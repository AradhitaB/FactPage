import math
import numpy as np
from scipy import stats
from sqlalchemy import func
from statsmodels.stats.proportion import proportion_effectsize, proportions_ztest
from statsmodels.stats.power import NormalIndPower
from sqlalchemy.orm import Session as DBSession
import config
from models import Session, Event, Variant, EventType
from schemas import VariantCounts, TestResult, RawStats, FullStats

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


def get_stats(db: DBSession) -> RawStats | FullStats:
    required = _required_per_variant()

    list_counts = _query_counts(db, Session.list_variant, EventType.list_complete)
    button_counts = _query_counts(db, Session.button_variant, EventType.button_click)

    list_a, list_b = list_counts[Variant.A], list_counts[Variant.B]
    button_a, button_b = button_counts[Variant.A], button_counts[Variant.B]

    current_min = min(list_a.assigned, list_b.assigned, button_a.assigned, button_b.assigned)

    base = dict(
        list_a=list_a,
        list_b=list_b,
        button_a=button_a,
        button_b=button_b,
        required_per_variant=required,
    )

    if current_min < required:
        return RawStats(**base, current_min_per_variant=current_min)

    return FullStats(
        **base,
        list_test=_run_test(list_a, list_b),
        button_test=_run_test(button_a, button_b),
    )
