from uuid import uuid4
import pytest
from httpx import AsyncClient

SFIT_ID = "c0000000-0000-0000-0000-000000000001"
IITB_ID = "dfa099b3-eae4-4833-869f-b05774cc586c"


@pytest.mark.anyio
async def test_vague_free_emails_are_rejected(client: AsyncClient):
    """Generic webmail providers (Gmail, Yahoo, etc.) must be strictly rejected."""
    free_emails = [
        "student@gmail.com",
        "scholar@yahoo.com",
        "user@outlook.com",
        "test@hotmail.com",
        "someone@icloud.com",
        "person@protonmail.com",
    ]
    for email in free_emails:
        payload = {
            "client_uuid": str(uuid4()),
            "declared_college_id": SFIT_ID,
            "affiliation": "current_student",
            "display_name": "Test Student",
            "college_email": email,
        }
        resp = await client.post("/api/respondents", json=payload)
        assert resp.status_code == 400
        assert "Personal and public email providers" in resp.json()["detail"]


@pytest.mark.anyio
async def test_disposable_and_bogus_emails_are_rejected(client: AsyncClient):
    """Temporary, disposable, and bogus usernames must be rejected."""
    bad_emails = [
        "user@tempmail.com",
        "student@mailinator.com",
        "admin@sfit.ac.in",
        "test@sfit.ac.in",
        "a@sfit.ac.in",
        "notanemail",
    ]
    for email in bad_emails:
        payload = {
            "client_uuid": str(uuid4()),
            "declared_college_id": SFIT_ID,
            "affiliation": "current_student",
            "college_email": email,
        }
        resp = await client.post("/api/respondents", json=payload)
        assert resp.status_code == 400


@pytest.mark.anyio
async def test_cross_college_email_mismatch_is_forbidden(client: AsyncClient):
    """
    X college cannot rate for Y college:
    @sfit.ac.in cannot vote for IIT Bombay.
    """
    payload = {
        "client_uuid": str(uuid4()),
        "declared_college_id": IITB_ID,  # IIT Bombay
        "affiliation": "current_student",
        "college_email": "maxwell@sfit.ac.in",  # SFIT email
    }
    resp = await client.post("/api/respondents", json=payload)
    assert resp.status_code == 403
    detail = resp.json()["detail"]
    assert "College domain mismatch" in detail
    assert "sfit.ac.in" in detail
    assert "St. Francis Institute of Technology" in detail


@pytest.mark.anyio
async def test_valid_college_email_passes(client: AsyncClient):
    """
    Matching email domain is accepted for the declared college.
    """
    # 1. SFIT student with @sfit.ac.in
    sfit_payload = {
        "client_uuid": str(uuid4()),
        "declared_college_id": SFIT_ID,
        "affiliation": "current_student",
        "display_name": "SFIT Student",
        "college_email": "maxwell@sfit.ac.in",
    }
    resp1 = await client.post("/api/respondents", json=sfit_payload)
    assert resp1.status_code == 201
    data1 = resp1.json()
    assert data1["college_email"] == "maxwell@sfit.ac.in"

    # 2. IITB student with @iitb.ac.in
    iitb_payload = {
        "client_uuid": str(uuid4()),
        "declared_college_id": IITB_ID,
        "affiliation": "current_student",
        "display_name": "IITB Scholar",
        "college_email": "student@iitb.ac.in",
    }
    resp2 = await client.post("/api/respondents", json=iitb_payload)
    assert resp2.status_code == 201
    data2 = resp2.json()
    assert data2["college_email"] == "student@iitb.ac.in"


@pytest.mark.anyio
async def test_session_creation_enforces_email_domain_affinity(client: AsyncClient):
    """
    Creating a rating session verifies college_email domain affinity.
    """
    # Register with SFIT email
    resp_payload = {
        "client_uuid": str(uuid4()),
        "declared_college_id": SFIT_ID,
        "affiliation": "current_student",
        "college_email": "testuser@sfit.ac.in",
    }
    resp = await client.post("/api/respondents", json=resp_payload)
    assert resp.status_code == 201
    respondent_id = resp.json()["id"]

    # Start session for SFIT should succeed
    sess_resp = await client.post(
        "/api/rating-sessions",
        json={"college_id": SFIT_ID, "respondent_id": respondent_id},
    )
    assert sess_resp.status_code == 201
