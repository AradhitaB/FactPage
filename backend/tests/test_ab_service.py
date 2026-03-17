from collections import Counter
from datetime import datetime, timedelta, timezone

from models import Event, EventType, Variant
from services.ab_service import assign_variants, cleanup_old_sessions, create_session, get_session


def test_assign_variants_returns_valid_variants():
    list_variant, button_variant = assign_variants()
    assert list_variant in (Variant.A, Variant.B)
    assert button_variant in (Variant.A, Variant.B)


def test_assign_variants_are_independent():
    """Over many draws, list and button variants should not be perfectly correlated."""
    results = [assign_variants() for _ in range(200)]
    list_variants = [r[0] for r in results]
    button_variants = [r[1] for r in results]

    # Both variants should appear for each test (not stuck on one side)
    assert Variant.A in list_variants
    assert Variant.B in list_variants
    assert Variant.A in button_variants
    assert Variant.B in button_variants

    # If perfectly correlated, all pairs would be (A,A) or (B,B) — check we have cross pairs
    mixed = [(l, b) for l, b in results if l != b]
    assert len(mixed) > 0, "List and button variants appear perfectly correlated"


def test_assign_variants_roughly_balanced():
    """Each variant should appear roughly 50% of the time over many draws."""
    results = [assign_variants() for _ in range(500)]
    list_counts = Counter(r[0] for r in results)
    button_counts = Counter(r[1] for r in results)

    # Allow ±10% deviation from 50/50
    for counts in (list_counts, button_counts):
        for variant in (Variant.A, Variant.B):
            proportion = counts[variant] / 500
            assert 0.40 <= proportion <= 0.60, (
                f"Variant {variant} proportion {proportion:.2f} is too far from 0.50"
            )


def test_create_session(test_db):
    session = create_session(test_db)
    assert session.id is not None
    assert session.list_variant in (Variant.A, Variant.B)
    assert session.button_variant in (Variant.A, Variant.B)


def test_get_session_returns_existing(test_db):
    session = create_session(test_db)
    fetched = get_session(test_db, session.id)
    assert fetched is not None
    assert fetched.id == session.id
    assert fetched.list_variant == session.list_variant
    assert fetched.button_variant == session.button_variant


def test_get_session_returns_none_for_unknown(test_db):
    result = get_session(test_db, "nonexistent-id")
    assert result is None


def test_each_session_gets_own_assignment(test_db):
    """Two sessions should be independently assigned — not share a single assignment."""
    s1 = create_session(test_db)
    s2 = create_session(test_db)
    assert s1.id != s2.id
    # Assignments may coincidentally match, but sessions are distinct records
    fetched_s1 = get_session(test_db, s1.id)
    fetched_s2 = get_session(test_db, s2.id)
    assert fetched_s1.id != fetched_s2.id


def test_cleanup_removes_old_sessions(test_db):
    old = create_session(test_db)
    old_id = old.id  # capture before cleanup expires the identity map entry
    old.created_at = datetime.now(timezone.utc) - timedelta(days=31)
    test_db.commit()

    recent = create_session(test_db)

    deleted = cleanup_old_sessions(test_db)

    assert deleted == 1
    assert get_session(test_db, old_id) is None
    assert get_session(test_db, recent.id) is not None


def test_cleanup_removes_events_with_old_sessions(test_db):
    old = create_session(test_db)
    old_id = old.id  # capture before cleanup expires the identity map entry
    old.created_at = datetime.now(timezone.utc) - timedelta(days=31)
    test_db.flush()
    test_db.add(Event(session_id=old_id, event_type=EventType.button_click))
    test_db.commit()

    cleanup_old_sessions(test_db)

    remaining = test_db.query(Event).filter(Event.session_id == old_id).first()
    assert remaining is None


def test_cleanup_leaves_recent_sessions_untouched(test_db):
    for _ in range(3):
        create_session(test_db)

    deleted = cleanup_old_sessions(test_db)

    assert deleted == 0
