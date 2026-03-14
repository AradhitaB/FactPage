import math
import numpy as np
from scipy import stats
from sqlalchemy import func
from statsmodels.stats.proportion import proportion_effectsize, proportions_ztest
from statsmodels.stats.power import NormalIndPower
from sqlalchemy.orm import Session as DBSession
import config
from models import Session, Event, Variant, EventType
from schemas import VariantCounts, VariantDepth, TestResult, StatsResponse

ALPHA = config.ALPHA
POWER = config.POWER
MDE = config.MDE
BASELINE = config.BASELINE_CONVERSION


def _required_per_variant() -> int:
    """Compute minimum n per variant via power analysis."""
    effect = proportion_effectsize(BASELINE, BASELINE + MDE)
    analysis = NormalIndPower()
    n = analysis.solve_power(effect_size=effect, alpha=ALPHA, power=POWER, alternative="two-sided")
    return math.ceil(n)


# Computed once at module load — inputs are config constants, no need to recompute per request.
REQUIRED_PER_VARIANT: int = _required_per_variant()


def _query_counts(
    db: DBSession,
    group_col,
    event_type: EventType,
) -> dict[Variant, VariantCounts]:
    """
    Single GROUP BY query replacing two COUNT queries per variant.

    LEFT OUTER JOIN ensures sessions with no matching event still appear
    with converted=0. func.count(Event.id) counts only non-NULL event ids,
    which is correct because unmatched rows from the outer join produce NULLs.
    """
    rows = (
        db.query(
            group_col,
            func.count(Session.id).label("assigned"),
            func.count(Event.id).label("converted"),
        )
        .outerjoin(
            Event,
            (Event.session_id == Session.id) & (Event.event_type == event_type),
        )
        .group_by(group_col)
        .all()
    )

    result = {Variant.A: VariantCounts(assigned=0, converted=0, rate=0.0),
              Variant.B: VariantCounts(assigned=0, converted=0, rate=0.0)}
    for variant, assigned, converted in rows:
        rate = converted / assigned if assigned > 0 else 0.0
        result[variant] = VariantCounts(assigned=assigned, converted=converted, rate=rate)
    return result


def _query_depth(db: DBSession) -> dict[Variant, VariantDepth]:
    """
    Single GROUP BY query returning depth stats per list variant.

    LEFT OUTER JOIN on list_depth events only — sessions with no depth recording
    still appear with n=0. func.count(Event.id) counts only non-NULL rows (i.e.
    sessions that have a list_depth event); func.avg(Event.value) is NULL when n=0.
    Coverage = n / assigned — the fraction of sessions with a recorded depth value.
    """
    rows = (
        db.query(
            Session.list_variant,
            func.count(Session.id).label("assigned"),
            func.count(Event.id).label("n"),
            func.avg(Event.value).label("mean_depth"),
        )
        .outerjoin(
            Event,
            (Event.session_id == Session.id) & (Event.event_type == EventType.list_depth),
        )
        .group_by(Session.list_variant)
        .all()
    )

    result = {
        Variant.A: VariantDepth(n=0, mean=0.0, coverage=0.0),
        Variant.B: VariantDepth(n=0, mean=0.0, coverage=0.0),
    }
    for variant, assigned, n, mean_depth in rows:
        coverage = n / assigned if assigned > 0 else 0.0
        result[variant] = VariantDepth(
            n=n,
            mean=round(float(mean_depth), 4) if mean_depth is not None else 0.0,
            coverage=round(coverage, 4),
        )
    return result


def _run_test(a: VariantCounts, b: VariantCounts) -> TestResult:
    """Two-proportion z-test with 95% CI and Cohen's h effect size."""
    if a.assigned == 0 or b.assigned == 0:
        raise ValueError("Cannot run test with zero observations in a variant")

    count = np.array([a.converted, b.converted])
    nobs = np.array([a.assigned, b.assigned])

    z_stat, p_value = proportions_ztest(count, nobs, alternative="two-sided")

    # 95% confidence interval on the difference (B - A)
    diff = b.rate - a.rate
    se = math.sqrt(
        (a.rate * (1 - a.rate) / a.assigned) +
        (b.rate * (1 - b.rate) / b.assigned)
    )
    z_crit = stats.norm.ppf(1 - ALPHA / 2)
    ci_low = diff - z_crit * se
    ci_high = diff + z_crit * se

    # Cohen's h
    h = proportion_effectsize(a.rate, b.rate)

    # Observed power given current sample sizes
    analysis = NormalIndPower()
    try:
        observed_power = analysis.solve_power(
            effect_size=abs(h),
            nobs1=a.assigned,
            alpha=ALPHA,
            alternative="two-sided",
        )
    except (ValueError, ZeroDivisionError, RuntimeError):
        observed_power = 0.0

    return TestResult(
        z_stat=round(float(z_stat), 4),
        p_value=round(float(p_value), 4),
        ci_low=round(ci_low, 4),
        ci_high=round(ci_high, 4),
        effect_size=round(float(h), 4),
        power=round(float(observed_power), 4),
        significant=bool(p_value < ALPHA),
    )


def get_stats(db: DBSession) -> StatsResponse:
    list_counts = _query_counts(db, Session.list_variant, EventType.list_complete)
    button_counts = _query_counts(db, Session.button_variant, EventType.button_click)
    depth_counts = _query_depth(db)

    list_a, list_b = list_counts[Variant.A], list_counts[Variant.B]
    button_a, button_b = button_counts[Variant.A], button_counts[Variant.B]

    # Each experiment unlocks independently once both its variants reach the threshold.
    list_current_min = min(list_a.assigned, list_b.assigned)
    button_current_min = min(button_a.assigned, button_b.assigned)
    list_unlocked = list_current_min >= REQUIRED_PER_VARIANT
    button_unlocked = button_current_min >= REQUIRED_PER_VARIANT

    return StatsResponse(
        required_per_variant=REQUIRED_PER_VARIANT,
        list_a=list_a,
        list_b=list_b,
        button_a=button_a,
        button_b=button_b,
        list_current_min=list_current_min,
        button_current_min=button_current_min,
        list_unlocked=list_unlocked,
        button_unlocked=button_unlocked,
        list_test=_run_test(list_a, list_b) if list_unlocked else None,
        button_test=_run_test(button_a, button_b) if button_unlocked else None,
        list_depth_a=depth_counts[Variant.A],
        list_depth_b=depth_counts[Variant.B],
    )
