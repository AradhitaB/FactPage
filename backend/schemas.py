from typing import Literal
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
    value: float | None = None


class EventResponse(BaseModel):
    ok: bool


# ─── Stats primitives ─────────────────────────────────────────────────────────

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


# ─── Depth histogram ──────────────────────────────────────────────────────────

class DepthBucket(BaseModel):
    facts: int   # 0–20 (round(depth * TOTAL_FACTS))
    count: int   # number of sessions that reached exactly this many facts


class DepthHistogram(BaseModel):
    """Distribution of facts read for one variant, optionally sliced by demographic group."""
    overall: list[DepthBucket]
    age_range: dict[str, list[DepthBucket]]
    technical_background: dict[str, list[DepthBucket]]
    prior_knowledge: dict[str, list[DepthBucket]]


# ─── Demographics Stats ────────────────────────────────────────────────────────

class DemographicGroup(BaseModel):
    label: str     # e.g. "18_24", "technical"
    n: int         # sessions in this group (with demographics recorded)
    completed: int # sessions in this group with a list_complete event
    rate: float    # completed / n


class DemographicsStats(BaseModel):
    total_responses: int
    age_range: list[DemographicGroup]
    technical_background: list[DemographicGroup]
    prior_knowledge: list[DemographicGroup]
    device_type: list[DemographicGroup]


# ─── Stats ────────────────────────────────────────────────────────────────────

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
    depth_histogram_a: DepthHistogram
    depth_histogram_b: DepthHistogram
    demographics: DemographicsStats | None = None
    earliest_real_session_at: str | None = None  # ISO timestamp of first non-synthetic session


# ─── Demographics ──────────────────────────────────────────────────────────────

AgeRange = Literal["under_18", "18_24", "25_34", "35_44", "45_plus"]
TechnicalBackground = Literal["non_technical", "somewhat_technical", "technical"]
PriorKnowledge = Literal["none", "a_few", "about_half", "most", "all"]
DeviceType = Literal["desktop", "mobile"]


class DemographicsRequest(BaseModel):
    age_range: AgeRange | None = None
    technical_background: TechnicalBackground | None = None
    prior_knowledge: PriorKnowledge | None = None
    device_type: DeviceType | None = None


class DemographicsResponse(BaseModel):
    submitted: bool
    age_range: AgeRange | None = None
    technical_background: TechnicalBackground | None = None
    prior_knowledge: PriorKnowledge | None = None
    device_type: DeviceType | None = None
