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
