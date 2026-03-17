import math
import numpy as np
from scipy import stats
from sqlalchemy import func
from statsmodels.stats.proportion import proportion_effectsize, proportions_ztest
from statsmodels.stats.power import NormalIndPower
from sqlalchemy.orm import Session as DBSession
import config
from models import Session, Event, Variant, EventType, Demographics
from schemas import VariantCounts, TestResult, StatsResponse, DemographicGroup, DemographicsStats, DepthBucket, DepthHistogram

ALPHA = config.ALPHA
POWER = config.POWER
MDE = config.MDE
BASELINE = config.BASELINE_CONVERSION

TOTAL_FACTS = 20  # Number of items in the fact list


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
        .filter(Session.is_synthetic.is_(False))
        .group_by(group_col)
        .all()
    )

    result = {Variant.A: VariantCounts(assigned=0, converted=0, rate=0.0),
              Variant.B: VariantCounts(assigned=0, converted=0, rate=0.0)}
    for variant, assigned, converted in rows:
        rate = converted / assigned if assigned > 0 else 0.0
        result[variant] = VariantCounts(assigned=assigned, converted=converted, rate=rate)
    return result


def _query_depth_histograms(db: DBSession) -> dict[Variant, DepthHistogram]:
    """
    Distribution of facts read per variant, plus per-demographic slices.

    list_depth events store a float 0.0–1.0. Multiplying by TOTAL_FACTS and
    rounding gives the number of facts the session reached (0–20).

    Demographic slices join Demographics → Sessions → Events so the distribution
    is scoped to survey respondents only.
    """
    bucket_expr = func.round(Event.value * TOTAL_FACTS)

    def _to_buckets(counts: dict[int, int]) -> list[DepthBucket]:
        return [DepthBucket(facts=i, count=counts.get(i, 0)) for i in range(TOTAL_FACTS + 1)]

    # Overall distribution per variant
    overall_rows = (
        db.query(
            Session.list_variant,
            bucket_expr.label("bucket"),
            func.count(Event.id).label("cnt"),
        )
        .join(Event, (Event.session_id == Session.id) & (Event.event_type == EventType.list_depth))
        .filter(Event.value.isnot(None), Session.is_synthetic.is_(False))
        .group_by(Session.list_variant, bucket_expr)
        .all()
    )

    overall: dict[Variant, dict[int, int]] = {Variant.A: {}, Variant.B: {}}
    for variant, bucket, cnt in overall_rows:
        overall[variant][int(bucket)] = cnt

    def _demo_dist(variant: Variant, demo_col) -> dict[str, list[DepthBucket]]:
        rows = (
            db.query(
                demo_col,
                bucket_expr.label("bucket"),
                func.count(Event.id).label("cnt"),
            )
            .join(Session, Session.id == Demographics.session_id)
            .join(
                Event,
                (Event.session_id == Demographics.session_id)
                & (Event.event_type == EventType.list_depth),
            )
            .filter(
                Session.list_variant == variant,
                Event.value.isnot(None),
                demo_col.isnot(None),
                Session.is_synthetic.is_(False),
            )
            .group_by(demo_col, bucket_expr)
            .all()
        )
        result: dict[str, dict[int, int]] = {}
        for label, bucket, cnt in rows:
            if label not in result:
                result[label] = {}
            result[label][int(bucket)] = cnt
        return {label: _to_buckets(counts) for label, counts in result.items()}

    return {
        v: DepthHistogram(
            overall=_to_buckets(overall[v]),
            age_range=_demo_dist(v, Demographics.age_range),
            technical_background=_demo_dist(v, Demographics.technical_background),
            prior_knowledge=_demo_dist(v, Demographics.prior_knowledge),
        )
        for v in (Variant.A, Variant.B)
    }


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


def _query_demographics_stats(db: DBSession) -> DemographicsStats | None:
    """
    For each demographic field, compute completion rate per label.
    Returns None if no demographics responses exist yet.
    """
    total = (
        db.query(func.count(Demographics.id))
        .join(Session, Session.id == Demographics.session_id)
        .filter(Session.is_synthetic.is_(False))
        .scalar()
    ) or 0
    if total == 0:
        return None

    def _groups_for(col) -> list[DemographicGroup]:
        rows = (
            db.query(
                col,
                func.count(Demographics.id).label("n"),
                func.count(Event.id).label("completed"),
            )
            .join(Session, Session.id == Demographics.session_id)
            .outerjoin(
                Event,
                (Event.session_id == Demographics.session_id)
                & (Event.event_type == EventType.list_complete),
            )
            .filter(col.isnot(None), Session.is_synthetic.is_(False))
            .group_by(col)
            .all()
        )
        return [
            DemographicGroup(label=label, n=n, completed=completed, rate=round(completed / n, 4) if n > 0 else 0.0)
            for label, n, completed in rows
        ]

    return DemographicsStats(
        total_responses=total,
        age_range=_groups_for(Demographics.age_range),
        technical_background=_groups_for(Demographics.technical_background),
        prior_knowledge=_groups_for(Demographics.prior_knowledge),
        device_type=_groups_for(Demographics.device_type),
    )


def _earliest_real_session(db: DBSession) -> str | None:
    earliest = db.query(func.min(Session.created_at)).filter(Session.is_synthetic.is_(False)).scalar()
    return earliest.isoformat() if earliest else None


def get_stats(db: DBSession) -> StatsResponse:
    list_counts = _query_counts(db, Session.list_variant, EventType.list_complete)
    button_counts = _query_counts(db, Session.button_variant, EventType.button_click)
    histograms = _query_depth_histograms(db)

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
        depth_histogram_a=histograms[Variant.A],
        depth_histogram_b=histograms[Variant.B],
        demographics=_query_demographics_stats(db),
        earliest_real_session_at=_earliest_real_session(db),
    )
