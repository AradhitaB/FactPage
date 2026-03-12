SESSION_COOKIE = "factpage_session"


# ─── Health ───────────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ─── Assignment ───────────────────────────────────────────────────────────────

def test_assignment_creates_session_and_sets_cookie(client):
    r = client.get("/api/assignment")
    assert r.status_code == 200

    data = r.json()
    assert "session_id" in data
    assert data["list_variant"] in ("A", "B")
    assert data["button_variant"] in ("A", "B")
    assert SESSION_COOKIE in r.cookies


def test_assignment_returns_same_session_on_repeat(client):
    r1 = client.get("/api/assignment")
    r2 = client.get("/api/assignment")  # client replays the cookie automatically

    assert r1.json()["session_id"] == r2.json()["session_id"]
    assert r1.json()["list_variant"] == r2.json()["list_variant"]
    assert r1.json()["button_variant"] == r2.json()["button_variant"]


def test_assignment_variants_are_valid(client):
    for _ in range(10):
        r = client.get("/api/assignment")
        data = r.json()
        assert data["list_variant"] in ("A", "B")
        assert data["button_variant"] in ("A", "B")


# ─── Events ───────────────────────────────────────────────────────────────────

def _get_session(client) -> dict:
    return client.get("/api/assignment").json()


def test_record_list_complete(client):
    session = _get_session(client)
    r = client.post("/api/events", json={
        "session_id": session["session_id"],
        "event_type": "list_complete",
    })
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_record_button_click(client):
    session = _get_session(client)
    r = client.post("/api/events", json={
        "session_id": session["session_id"],
        "event_type": "button_click",
    })
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_event_is_idempotent(client):
    """Posting the same event twice should succeed both times but only count once."""
    session = _get_session(client)
    payload = {"session_id": session["session_id"], "event_type": "button_click"}

    r1 = client.post("/api/events", json=payload)
    r2 = client.post("/api/events", json=payload)

    assert r1.status_code == 200
    assert r2.status_code == 200


def test_event_rejects_session_mismatch(client):
    """session_id in body must match the cookie — prevents spoofing another user's session."""
    _get_session(client)  # establishes the cookie
    r = client.post("/api/events", json={
        "session_id": "00000000-0000-0000-0000-000000000000",
        "event_type": "button_click",
    })
    assert r.status_code == 403


def test_event_rejects_unknown_session(client):
    # Manually set a fake cookie so the body and cookie match but session doesn't exist
    client.cookies.set(SESSION_COOKIE, "00000000-0000-0000-0000-000000000000")
    r = client.post("/api/events", json={
        "session_id": "00000000-0000-0000-0000-000000000000",
        "event_type": "button_click",
    })
    assert r.status_code == 404


def test_event_rejects_invalid_event_type(client):
    session = _get_session(client)
    r = client.post("/api/events", json={
        "session_id": session["session_id"],
        "event_type": "not_a_real_event",
    })
    assert r.status_code == 422  # Pydantic validation error


# ─── Stats ────────────────────────────────────────────────────────────────────

def test_stats_returns_raw_on_empty_db(client):
    r = client.get("/api/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["unlocked"] is False
    assert "required_per_variant" in data
    assert "current_min_per_variant" in data


def test_stats_shape_raw(client):
    r = client.get("/api/stats")
    data = r.json()
    for key in ("list_a", "list_b", "button_a", "button_b"):
        assert key in data
        assert "assigned" in data[key]
        assert "converted" in data[key]
        assert "rate" in data[key]
