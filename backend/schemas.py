from pydantic import BaseModel
from models import Variant, EventType


# ─── Assignment ───────────────────────────────────────────────────────────────

class AssignmentResponse(BaseModel):
    session_id: str
    list_variant: Variant
    button_variant: Variant


# ─── Events ───────────────────────────────────────────────────────────────────

class EventRequest(BaseModel):
    session_id: str
    event_type: EventType


class EventResponse(BaseModel):
    ok: bool


# ─── Stats ────────────────────────────────────────────────────────────────────

class VariantCounts(BaseModel):
    assigned: int
    converted: int
    rate: float


class RawStats(BaseModel):
    """Returned before minimum sample size is reached."""
    unlocked: bool = False
    list_a: VariantCounts
    list_b: VariantCounts
    button_a: VariantCounts
    button_b: VariantCounts
    required_per_variant: int
    current_min_per_variant: int  # smallest of the four variant counts


class TestResult(BaseModel):
    z_stat: float
    p_value: float
    ci_low: float   # lower bound of 95% CI on the difference in proportions
    ci_high: float  # upper bound
    effect_size: float  # Cohen's h
    power: float    # observed power given current n
    significant: bool


class FullStats(BaseModel):
    """Returned once minimum sample size is reached."""
    unlocked: bool = True
    list_a: VariantCounts
    list_b: VariantCounts
    button_a: VariantCounts
    button_b: VariantCounts
    required_per_variant: int
    list_test: TestResult
    button_test: TestResult
