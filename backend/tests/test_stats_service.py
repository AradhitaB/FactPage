import math
import pytest
from models import Session, Event, Variant, EventType
from schemas import RawStats, FullStats
from services.stats_service import _required_per_variant, _run_test, get_stats
from schemas import VariantCounts


def test_required_per_variant_is_positive_integer():
    n = _required_per_variant()
    assert isinstance(n, int)
    assert n > 0


def test_required_per_variant_is_reasonable():
    """For default params (alpha=0.05, power=0.80, MDE=0.10), n should be in a sane range."""
    n = _required_per_variant()
    assert 50 <= n <= 1000, f"Required n={n} seems unreasonable for default parameters"


def _make_counts(assigned, converted) -> VariantCounts:
    rate = converted / assigned if assigned > 0 else 0.0
    return VariantCounts(assigned=assigned, converted=converted, rate=rate)


def test_run_test_significant_difference():
    """A large, clear difference should produce a significant result."""
    a = _make_counts(assigned=500, converted=200)  # 40% conversion
    b = _make_counts(assigned=500, converted=300)  # 60% conversion
    result = _run_test(a, b)

    assert result.significant is True
    assert result.p_value < 0.05
    assert result.ci_low < result.ci_high
    # CI should not cross zero for a significant result
    assert not (result.ci_low < 0 < result.ci_high)


def test_run_test_no_difference():
    """Identical conversion rates should not be significant."""
    a = _make_counts(assigned=500, converted=250)  # 50%
    b = _make_counts(assigned=500, converted=250)  # 50%
    result = _run_test(a, b)

    assert result.significant is False
    assert result.p_value > 0.05
    assert math.isclose(result.effect_size, 0.0, abs_tol=1e-6)


def test_run_test_ci_contains_true_difference():
    """95% CI on (B - A) should contain the true difference for large samples."""
    true_diff = 0.10  # B is 10pp better
    a = _make_counts(assigned=10_000, converted=5_000)  # 50%
    b = _make_counts(assigned=10_000, converted=6_000)  # 60%
    result = _run_test(a, b)

    assert result.ci_low <= true_diff <= result.ci_high


def test_run_test_power_between_0_and_1():
    a = _make_counts(assigned=200, converted=80)
    b = _make_counts(assigned=200, converted=100)
    result = _run_test(a, b)
    assert 0.0 <= result.power <= 1.0


def _seed_db(db, list_a_n, list_b_n, btn_a_n, btn_b_n,
             list_a_conv, list_b_conv, btn_a_conv, btn_b_conv):
    """Helper: insert sessions and events directly into the test DB."""
    def add_sessions(n, list_v, btn_v, list_conv, btn_conv):
        for i in range(n):
            s = Session(list_variant=list_v, button_variant=btn_v)
            db.add(s)
            db.flush()
            if i < list_conv:
                db.add(Event(session_id=s.id, event_type=EventType.list_complete))
            if i < btn_conv:
                db.add(Event(session_id=s.id, event_type=EventType.button_click))

    add_sessions(list_a_n, Variant.A, Variant.A, list_a_conv, btn_a_conv)
    add_sessions(list_b_n, Variant.B, Variant.B, list_b_conv, btn_b_conv)
    db.commit()


def test_get_stats_returns_raw_when_below_threshold(test_db):
    # Seed with very few sessions — well below required_per_variant
    _seed_db(test_db, 5, 5, 5, 5, 2, 3, 2, 3)
    result = get_stats(test_db)
    assert isinstance(result, RawStats)
    assert result.unlocked is False
    assert result.current_min_per_variant < result.required_per_variant


def test_get_stats_returns_full_when_above_threshold(test_db):
    required = _required_per_variant()
    n = required + 10  # comfortably above threshold
    _seed_db(test_db, n, n, n, n,
             int(n * 0.4), int(n * 0.5),
             int(n * 0.4), int(n * 0.5))
    result = get_stats(test_db)
    assert isinstance(result, FullStats)
    assert result.unlocked is True
    assert hasattr(result, "list_test")
    assert hasattr(result, "button_test")


def test_get_stats_empty_db(test_db):
    result = get_stats(test_db)
    assert isinstance(result, RawStats)
    assert result.list_a.assigned == 0
    assert result.list_b.assigned == 0
