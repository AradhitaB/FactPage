import os
import math
import numpy as np
from scipy import stats
from statsmodels.stats.proportion import proportion_effectsize
from statsmodels.stats.power import NormalIndPower
from sqlalchemy.orm import Session as DBSession
from models import Session, Event, Variant, EventType
from schemas import VariantCounts, TestResult, RawStats, FullStats

ALPHA = float(os.getenv("ALPHA", "0.05"))
POWER = float(os.getenv("POWER", "0.80"))
MDE = float(os.getenv("MDE", "0.10"))
BASELINE = float(os.getenv("BASELINE_CONVERSION", "0.50"))


def _required_per_variant() -> int:
    """Compute minimum n per variant via power analysis."""
    effect = proportion_effectsize(BASELINE, BASELINE + MDE)
    analysis = NormalIndPower()
    n = analysis.solve_power(effect_size=effect, alpha=ALPHA, power=POWER, alternative="two-sided")
    return math.ceil(n)


def _variant_counts(
    db: DBSession, variant_field: str, event_type: EventType, variant: Variant
) -> VariantCounts:
    assigned = (
        db.query(Session)
        .filter(getattr(Session, variant_field) == variant)
        .count()
    )
    converted = (
        db.query(Event)
        .join(Session)
        .filter(getattr(Session, variant_field) == variant)
        .filter(Event.event_type == event_type)
        .count()
    )
    rate = converted / assigned if assigned > 0 else 0.0
    return VariantCounts(assigned=assigned, converted=converted, rate=rate)


def _run_test(a: VariantCounts, b: VariantCounts) -> TestResult:
    """Two-proportion z-test with 95% CI and Cohen's h effect size."""
    count = np.array([a.converted, b.converted])
    nobs = np.array([a.assigned, b.assigned])

    z_stat, p_value = stats.proportions_ztest(count, nobs, alternative="two-sided")

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
    except Exception:
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

    list_a = _variant_counts(db, "list_variant", EventType.list_complete, Variant.A)
    list_b = _variant_counts(db, "list_variant", EventType.list_complete, Variant.B)
    button_a = _variant_counts(db, "button_variant", EventType.button_click, Variant.A)
    button_b = _variant_counts(db, "button_variant", EventType.button_click, Variant.B)

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
