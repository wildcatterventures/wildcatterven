import pytest
from httpx import AsyncClient
from tests.conftest import APEX_DEMO_ID, JUDE_DEMO_ID, SFIT_ID


@pytest.mark.asyncio
async def test_search_colleges_filters_demo_by_default(client: AsyncClient):
    """Verify public college search excludes demo colleges by default."""
    response = await client.get("/api/colleges")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # SFIT is non-demo; St. Jude and Apex are demo colleges
    short_codes = [c["short_code"] for c in data]
    assert "SFIT" in short_codes
    assert "JUDE-DEMO" not in short_codes
    assert "APEX-DEMO" not in short_codes


@pytest.mark.asyncio
async def test_search_colleges_includes_demo_when_flagged(client: AsyncClient):
    """Verify demo colleges appear when demo=true query parameter is passed."""
    response = await client.get("/api/colleges?demo=true")
    assert response.status_code == 200
    data = response.json()
    short_codes = [c["short_code"] for c in data]
    assert "SFIT" in short_codes
    assert "JUDE-DEMO" in short_codes
    assert "APEX-DEMO" in short_codes


@pytest.mark.asyncio
async def test_search_colleges_partial_text_query(client: AsyncClient):
    """Verify partial name and location search."""
    # Search by city 'Mumbai'
    resp = await client.get("/api/colleges?q=Mumbai")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert data[0]["short_code"] == "SFIT"


@pytest.mark.asyncio
async def test_get_college_detail_sfit_real_stub(client: AsyncClient):
    """Verify real college stub SFIT has base score 100 and zero reviews."""
    resp = await client.get(f"/api/colleges/{SFIT_ID}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "St. Francis Institute of Technology"
    assert data["current_score"] == 100
    assert data["is_demo"] is False
    assert data["total_submitted_sessions"] == 0
    assert data["total_qualifying_low"] == 0
    assert data["total_qualifying_high"] == 0


@pytest.mark.asyncio
async def test_get_college_ratings_report(client: AsyncClient):
    """Verify ratings report contains all 25 active parameters."""
    resp = await client.get(f"/api/colleges/{SFIT_ID}/ratings")
    assert resp.status_code == 200
    data = resp.json()
    assert data["college_id"] == str(SFIT_ID)
    assert len(data["parameters"]) == 25
    # For SFIT with 0 reviews, averages should be None and counts 0
    first_param = data["parameters"][0]
    assert first_param["numeric_response_count"] == 0
    assert first_param["no_view_count"] == 0
    assert first_param["average_score"] is None


@pytest.mark.asyncio
async def test_create_unknown_college_success(client: AsyncClient):
    """Verify unknown-college creation initializes score to 100 with zero reviews."""
    payload = {
        "name": "National Institute of Design",
        "city": "Ahmedabad",
        "state": "Gujarat",
    }
    resp = await client.post("/api/colleges", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "National Institute of Design"
    assert data["city"] == "Ahmedabad"
    assert data["state"] == "Gujarat"
    assert data["current_score"] == 100
    assert data["is_demo"] is False
    assert data["total_submitted_sessions"] == 0


@pytest.mark.asyncio
async def test_create_unknown_college_duplicate_detection(client: AsyncClient):
    """Verify normalized duplicate college creation in same city/state returns HTTP 409."""
    payload = {
        "name": "St. Francis Institute of Technology",
        "city": "Mumbai",
        "state": "Maharashtra",
    }
    resp = await client.post("/api/colleges", json=payload)
    assert resp.status_code == 409
    assert "already exists" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_search_event_is_logged_for_query(client: AsyncClient, mock_db_state):
    """Verify eligible college search query records a search event."""
    from uuid import uuid4
    visitor_id = str(uuid4())

    resp = await client.get(
        "/api/colleges?q=Mumbai",
        headers={"X-Visitor-Session-ID": visitor_id},
    )
    assert resp.status_code == 200

    events = list(mock_db_state.get("search_events", {}).values())
    assert len(events) >= 1
    ev = events[-1]
    assert ev["query"] == "Mumbai"
    assert str(ev["visitor_session_id"]) == visitor_id
    assert ev["input_mode"] == "text"


@pytest.mark.asyncio
async def test_search_without_query_does_not_log_search_event(client: AsyncClient, mock_db_state):
    """Verify browsing directory without a search query does not record a search event."""
    initial_count = len(mock_db_state.get("search_events", {}))

    resp = await client.get("/api/colleges")
    assert resp.status_code == 200

    post_count = len(mock_db_state.get("search_events", {}))
    assert post_count == initial_count


@pytest.mark.asyncio
async def test_search_deduplication_prevents_duplicate_events(client: AsyncClient, mock_db_state):
    """Verify rapid repeated queries from same visitor are deduplicated within time window."""
    from uuid import uuid4
    visitor_id = str(uuid4())

    # First search
    resp1 = await client.get(
        "/api/colleges?q=SFIT",
        headers={"X-Visitor-Session-ID": visitor_id},
    )
    assert resp1.status_code == 200

    count_after_first = len(mock_db_state.get("search_events", {}))

    # Duplicate search with same visitor session within window
    resp2 = await client.get(
        "/api/colleges?q=SFIT",
        headers={"X-Visitor-Session-ID": visitor_id},
    )
    assert resp2.status_code == 200

    count_after_second = len(mock_db_state.get("search_events", {}))
    assert count_after_second == count_after_first


@pytest.mark.asyncio
async def test_search_succeeds_even_if_search_logging_fails(client: AsyncClient, monkeypatch):
    """Verify logging failure is non-blocking and never breaks search functionality."""
    from app.services import analytics

    async def _failing_log(*args, **kwargs):
        raise RuntimeError("Database pool failure during search analytics insert")

    monkeypatch.setattr(analytics, "log_search_event", _failing_log)

    resp = await client.get("/api/colleges?q=Mumbai")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1

