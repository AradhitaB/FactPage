from uuid import UUID
from pydantic import BaseModel
from models import Variant, EventType


# ─── Assignment ───────────────────────────────────────────────────────────────

class AssignmentResponse(BaseModel):
    session_id: str
    list_variant: Variant
    button_variant: Variant


# ─── Events ───────────────────────────────────────────────────────────────────

class EventRequest(BaseModel):
    session_id: UUID  # Pydantic rejects malformed UUIDs before they reach the DB
    event_type: EventType


class EventResponse(BaseModel):
    ok: bool


# ─── Stats ────────────────────────────────────────────────────────────────────

class VariantCounts(BaseModel):
    assigned: int
    converted: int
    rate: float


class TestResult(BaseModel):
    z_stat: float
    p_value: float
    ci_low: float   # lower bound of 95% CI on the difference in proportions
    ci_high: float  # upper bound
    effect_size: float  # Cohen's h — positive means B > A, negative means A > B
    power: float    # observed power given current n
    significant: bool


class StatsResponse(BaseModel):
    """
    Unified stats response with per-experiment unlock status.

    Each experiment unlocks independently once its own variants each reach
    required_per_variant. list_test / button_test are None until unlocked.
    """
    required_per_variant: int
    list_a: VariantCounts
    list_b: VariantCounts
    button_a: VariantCounts
    button_b: VariantCounts
    list_current_min: int    # min(list_a.assigned, list_b.assigned)
    button_current_min: int  # min(button_a.assigned, button_b.assigned)
    list_unlocked: bool
    button_unlocked: bool
    list_test: TestResult | None = None
    button_test: TestResult | None = None
