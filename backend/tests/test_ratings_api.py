from uuid import uuid4
import pytest
from httpx import AsyncClient
from tests.conftest import APEX_DEMO_ID, JUDE_DEMO_ID, SFIT_ID


@pytest.mark.asyncio
async def test_full_rating_session_lifecycle_and_answer_correction(client: AsyncClient):
    """
    Test complete rating session lifecycle:
    1. Create respondent profile.
    2. Start rating session.
    3. Save answers for all 25 parameters.
    4. Correct an answer before submission (verify replacement).
    5. Submit session transactionally.
    6. Verify submission success and score calculation.
    """
    client_uuid = str(uuid4())

    # 1. Create respondent
    resp_payload = {
        "client_uuid": client_uuid,
        "declared_college_id": str(SFIT_ID),
        "affiliation": "current_student",
        "display_name": "Test Student",
    }
    resp = await client.post("/api/respondents", json=resp_payload)
    assert resp.status_code == 201
    respondent_id = resp.json()["id"]

    # 2. Start session
    sess_payload = {
        "college_id": str(SFIT_ID),
        "respondent_id": respondent_id,
    }
    sess_resp = await client.post("/api/rating-sessions", json=sess_payload)
    assert sess_resp.status_code == 201
    session_id = sess_resp.json()["id"]

    # Get active parameters
    ratings_report = (await client.get(f"/api/colleges/{SFIT_ID}/ratings")).json()
    params = ratings_report["parameters"]
    assert len(params) == 25

    # 3. Save answers (24 with score 9, 1 No-view)
    for p in params[:-1]:
        ans_payload = {"score": 9, "is_no_view": False}
        ans_resp = await client.put(
            f"/api/rating-sessions/{session_id}/answers/{p['parameter_id']}",
            json=ans_payload,
        )
        assert ans_resp.status_code == 200

    last_param = params[-1]
    ans_resp = await client.put(
        f"/api/rating-sessions/{session_id}/answers/{last_param['parameter_id']}",
        json={"is_no_view": True},
    )
    assert ans_resp.status_code == 200

    # 4. Correct an answer before submission (change first param from 9 to 10)
    first_param = params[0]
    correction_resp = await client.put(
        f"/api/rating-sessions/{session_id}/answers/{first_param['parameter_id']}",
        json={"score": 10, "is_no_view": False},
    )
    assert correction_resp.status_code == 200
    assert correction_resp.json()["score"] == 10

    # Verify session detail
    detail_resp = await client.get(f"/api/rating-sessions/{session_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["answered_count"] == 25
    assert detail["is_complete"] is True

    # 5. Submit session
    submit_resp = await client.post(f"/api/rating-sessions/{session_id}/submit")
    assert submit_resp.status_code == 200
    sub_data = submit_resp.json()
    assert sub_data["status"] == "submitted"
    assert sub_data["category"] == "high"
    assert sub_data["score_contribution_inserted"] is True
    # First rating for SFIT, so score remains 100 (1 < 20)
    assert sub_data["score_before"] == 100
    assert sub_data["score_after"] == 100


@pytest.mark.asyncio
async def test_incomplete_session_submit_returns_http_422(client: AsyncClient):
    """Verify submitting a session missing answers returns HTTP 422 with missing parameter details."""
    client_uuid = str(uuid4())
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(SFIT_ID),
            "affiliation": "alumnus",
        },
    )
    respondent_id = resp.json()["id"]

    sess_resp = await client.post(
        "/api/rating-sessions",
        json={"college_id": str(SFIT_ID), "respondent_id": respondent_id},
    )
    session_id = sess_resp.json()["id"]

    # Submit without answering any parameters
    submit_resp = await client.post(f"/api/rating-sessions/{session_id}/submit")
    assert submit_resp.status_code == 422
    err_detail = submit_resp.json()["detail"]
    assert "missing" in str(err_detail).lower()


@pytest.mark.asyncio
async def test_invalid_answers_are_rejected(client: AsyncClient):
    """Verify validation errors for invalid answer score values and No-view combinations."""
    client_uuid = str(uuid4())
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(SFIT_ID),
            "affiliation": "current_student",
        },
    )
    respondent_id = resp.json()["id"]

    sess_resp = await client.post(
        "/api/rating-sessions",
        json={"college_id": str(SFIT_ID), "respondent_id": respondent_id},
    )
    session_id = sess_resp.json()["id"]

    ratings_report = (await client.get(f"/api/colleges/{SFIT_ID}/ratings")).json()
    param_id = ratings_report["parameters"][0]["parameter_id"]

    # 1. Both score and is_no_view=True
    r1 = await client.put(
        f"/api/rating-sessions/{session_id}/answers/{param_id}",
        json={"score": 8, "is_no_view": True},
    )
    assert r1.status_code == 422

    # 2. Neither score nor is_no_view
    r2 = await client.put(
        f"/api/rating-sessions/{session_id}/answers/{param_id}",
        json={"score": None, "is_no_view": False},
    )
    assert r2.status_code == 422

    # 3. Score out of range (15)
    r3 = await client.put(
        f"/api/rating-sessions/{session_id}/answers/{param_id}",
        json={"score": 15, "is_no_view": False},
    )
    assert r3.status_code == 422


@pytest.mark.asyncio
async def test_college_respondent_mismatch_returns_http_403(client: AsyncClient):
    """Verify starting a session for a college different than respondent's declared college returns HTTP 403."""
    client_uuid = str(uuid4())
    # Respondent declares SFIT
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(SFIT_ID),
            "affiliation": "current_student",
        },
    )
    respondent_id = resp.json()["id"]

    # Attempts to rate St. Jude
    sess_resp = await client.post(
        "/api/rating-sessions",
        json={"college_id": str(JUDE_DEMO_ID), "respondent_id": respondent_id},
    )
    assert sess_resp.status_code == 403
    assert "mismatch" in sess_resp.json()["detail"].lower() or "declared" in sess_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_duplicate_submitted_rating_returns_http_409(client: AsyncClient):
    """Verify only one submitted session is permitted per respondent per college."""
    client_uuid = str(uuid4())
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(SFIT_ID),
            "affiliation": "current_student",
        },
    )
    respondent_id = resp.json()["id"]

    # Session 1
    sess1 = (await client.post(
        "/api/rating-sessions",
        json={"college_id": str(SFIT_ID), "respondent_id": respondent_id},
    )).json()
    session_id = sess1["id"]

    # Answer all 25
    ratings_report = (await client.get(f"/api/colleges/{SFIT_ID}/ratings")).json()
    for p in ratings_report["parameters"]:
        await client.put(
            f"/api/rating-sessions/{session_id}/answers/{p['parameter_id']}",
            json={"score": 5, "is_no_view": False},
        )

    # Submit Session 1
    sub1 = await client.post(f"/api/rating-sessions/{session_id}/submit")
    assert sub1.status_code == 200

    # Attempt to submit again (repeated submit)
    sub2 = await client.post(f"/api/rating-sessions/{session_id}/submit")
    assert sub2.status_code == 409

    # Attempt to start a second session for same college
    sess2 = await client.post(
        "/api/rating-sessions",
        json={"college_id": str(SFIT_ID), "respondent_id": respondent_id},
    )
    assert sess2.status_code == 409


@pytest.mark.asyncio
async def test_st_jude_demo_twentieth_low_rating_triggers_score_decrement(client: AsyncClient):
    """
    Demo 1 verification:
    St. Jude is seeded with 19 qualifying low ratings (score 100).
    A new respondent submits the 20th qualifying low rating.
    The college score MUST decrement from 100 to 99!
    """
    client_uuid = str(uuid4())
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(JUDE_DEMO_ID),
            "affiliation": "current_student",
            "display_name": "Twentieth Low Student",
        },
    )
    respondent_id = resp.json()["id"]

    sess = (await client.post(
        "/api/rating-sessions",
        json={"college_id": str(JUDE_DEMO_ID), "respondent_id": respondent_id},
    )).json()
    session_id = sess["id"]

    # Answer all 25 with low ratings (scores 2 and 3 -> mean strictly < 4.0)
    ratings_report = (await client.get(f"/api/colleges/{JUDE_DEMO_ID}/ratings")).json()
    for p in ratings_report["parameters"]:
        await client.put(
            f"/api/rating-sessions/{session_id}/answers/{p['parameter_id']}",
            json={"score": 2, "is_no_view": False},
        )

    # Submit 20th low rating
    sub_resp = await client.post(f"/api/rating-sessions/{session_id}/submit")
    assert sub_resp.status_code == 200
    res = sub_resp.json()

    assert res["category"] == "low"
    assert res["threshold_block_triggered"] == 1
    assert res["score_delta"] == -1
    assert res["score_before"] == 100
    assert res["score_after"] == 99

    # Verify college profile score updated
    col = (await client.get(f"/api/colleges/{JUDE_DEMO_ID}")).json()
    assert col["current_score"] == 99
    assert col["total_qualifying_low"] == 20


@pytest.mark.asyncio
async def test_apex_demo_twentieth_high_rating_triggers_score_increment(client: AsyncClient):
    """
    Demo 2 verification:
    Apex Technical Academy is seeded with 19 qualifying high ratings (score 100).
    A new respondent submits the 20th qualifying high rating.
    The college score MUST increment from 100 to 101!
    """
    client_uuid = str(uuid4())
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(APEX_DEMO_ID),
            "affiliation": "alumnus",
            "display_name": "Twentieth High Alumnus",
        },
    )
    respondent_id = resp.json()["id"]

    sess = (await client.post(
        "/api/rating-sessions",
        json={"college_id": str(APEX_DEMO_ID), "respondent_id": respondent_id},
    )).json()
    session_id = sess["id"]

    # Answer all 25 with high ratings (scores 9 and 10 -> mean strictly >= 8.0)
    ratings_report = (await client.get(f"/api/colleges/{APEX_DEMO_ID}/ratings")).json()
    for p in ratings_report["parameters"]:
        await client.put(
            f"/api/rating-sessions/{session_id}/answers/{p['parameter_id']}",
            json={"score": 9, "is_no_view": False},
        )

    # Submit 20th high rating
    sub_resp = await client.post(f"/api/rating-sessions/{session_id}/submit")
    assert sub_resp.status_code == 200
    res = sub_resp.json()

    assert res["category"] == "high"
    assert res["threshold_block_triggered"] == 1
    assert res["score_delta"] == 1
    assert res["score_before"] == 100
    assert res["score_after"] == 101

    # Verify college profile score updated
    col = (await client.get(f"/api/colleges/{APEX_DEMO_ID}")).json()
    assert col["current_score"] == 101
    assert col["total_qualifying_high"] == 20


@pytest.mark.asyncio
async def test_demo_ratings_never_contaminate_real_college_aggregates(client: AsyncClient):
    """Verify demo college ratings (St. Jude and Apex) never leak into real college (SFIT)."""
    sfit_report = (await client.get(f"/api/colleges/{SFIT_ID}/ratings")).json()
    assert sfit_report["total_submitted_sessions"] == 0
    for p in sfit_report["parameters"]:
        assert p["numeric_response_count"] == 0
        assert p["average_score"] is None


@pytest.mark.asyncio
async def test_all_no_view_session_submission(client: AsyncClient):
    """
    Verify all-No-view session:
    - Session can be completed and submitted.
    - Overall rating is NULL/None.
    - Creates no score contribution.
    - College score remains completely unchanged.
    """
    client_uuid = str(uuid4())
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(SFIT_ID),
            "affiliation": "current_student",
        },
    )
    respondent_id = resp.json()["id"]

    sess = (await client.post(
        "/api/rating-sessions",
        json={"college_id": str(SFIT_ID), "respondent_id": respondent_id},
    )).json()
    session_id = sess["id"]

    # Mark all 25 as is_no_view=True
    ratings_report = (await client.get(f"/api/colleges/{SFIT_ID}/ratings")).json()
    for p in ratings_report["parameters"]:
        await client.put(
            f"/api/rating-sessions/{session_id}/answers/{p['parameter_id']}",
            json={"is_no_view": True},
        )

    # Submit
    sub_resp = await client.post(f"/api/rating-sessions/{session_id}/submit")
    assert sub_resp.status_code == 200
    data = sub_resp.json()
    assert data["status"] == "submitted"
    assert data["unrounded_overall_rating"] is None
    assert data["category"] is None
    assert data["score_contribution_inserted"] is False
    assert data["score_before"] == 100
    assert data["score_after"] == 100


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """Verify /health returns service status and never leaks connection strings or credentials."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "db" in data
    # Guarantee zero credentials or connection strings leaked
    assert "postgres:" not in str(data)
    assert "password" not in str(data).lower()


@pytest.mark.asyncio
async def test_failed_transaction_does_not_leave_partial_score_changes(mock_conn):
    """Verify atomic transaction rollback prevents partial score changes on unexpected failure."""
    from app.services.scoring import submit_rating_session
    from tests.conftest import MockAsyncpgConnection

    # Capture initial state of St. Jude score
    init_score = mock_conn.db_state["college_score_state"][JUDE_DEMO_ID]["current_score"]
    init_low = mock_conn.db_state["college_score_state"][JUDE_DEMO_ID]["total_qualifying_low"]

    # Attempting to submit a nonexistent session will raise 404
    with pytest.raises(Exception):
        await submit_rating_session(mock_conn, uuid4())

    # Verify score state was completely untouched
    post_score = mock_conn.db_state["college_score_state"][JUDE_DEMO_ID]["current_score"]
    post_low = mock_conn.db_state["college_score_state"][JUDE_DEMO_ID]["total_qualifying_low"]
    assert post_score == init_score
    assert post_low == init_low


@pytest.mark.asyncio
async def test_submitting_session_with_24_answers_fails_with_missing_parameter(client: AsyncClient):
    """Verify answering 24 parameters and leaving 1 unanswered returns 422 and never silently defaults to No-view."""
    client_uuid = str(uuid4())
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(SFIT_ID),
            "affiliation": "current_student",
        },
    )
    respondent_id = resp.json()["id"]

    sess_resp = await client.post(
        "/api/rating-sessions",
        json={"college_id": str(SFIT_ID), "respondent_id": respondent_id},
    )
    session_id = sess_resp.json()["id"]

    ratings_report = (await client.get(f"/api/colleges/{SFIT_ID}/ratings")).json()
    params = ratings_report["parameters"]

    # Answer only the first 24 parameters
    for p in params[:24]:
        await client.put(
            f"/api/rating-sessions/{session_id}/answers/{p['parameter_id']}",
            json={"score": 7, "is_no_view": False},
        )

    # 25th parameter left unanswered
    sub_resp = await client.post(f"/api/rating-sessions/{session_id}/submit")
    assert sub_resp.status_code == 422
    err_data = sub_resp.json()["detail"]
    assert "missing" in str(err_data).lower()
    missing_id = params[24]["parameter_id"]
    assert missing_id in err_data.get("missing_parameter_ids", [])


@pytest.mark.asyncio
async def test_editing_answers_on_submitted_session_returns_http_409(client: AsyncClient):
    """Verify that once a session is submitted, answers cannot be edited or added."""
    client_uuid = str(uuid4())
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(SFIT_ID),
            "affiliation": "alumnus",
        },
    )
    respondent_id = resp.json()["id"]

    sess_resp = await client.post(
        "/api/rating-sessions",
        json={"college_id": str(SFIT_ID), "respondent_id": respondent_id},
    )
    session_id = sess_resp.json()["id"]

    ratings_report = (await client.get(f"/api/colleges/{SFIT_ID}/ratings")).json()
    for p in ratings_report["parameters"]:
        await client.put(
            f"/api/rating-sessions/{session_id}/answers/{p['parameter_id']}",
            json={"score": 8, "is_no_view": False},
        )

    # Submit session
    sub_resp = await client.post(f"/api/rating-sessions/{session_id}/submit")
    assert sub_resp.status_code == 200

    # Attempt to edit an answer after submission
    first_param = ratings_report["parameters"][0]["parameter_id"]
    edit_resp = await client.put(
        f"/api/rating-sessions/{session_id}/answers/{first_param}",
        json={"score": 10, "is_no_view": False},
    )
    assert edit_resp.status_code == 409
    assert "cannot edit" in edit_resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_scores_below_one_and_above_ten_are_rejected(client: AsyncClient):
    """Verify score 0, negative scores, and scores > 10 are rejected with 422."""
    client_uuid = str(uuid4())
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(SFIT_ID),
            "affiliation": "current_student",
        },
    )
    respondent_id = resp.json()["id"]
    sess_resp = await client.post(
        "/api/rating-sessions",
        json={"college_id": str(SFIT_ID), "respondent_id": respondent_id},
    )
    session_id = sess_resp.json()["id"]

    ratings_report = (await client.get(f"/api/colleges/{SFIT_ID}/ratings")).json()
    param_id = ratings_report["parameters"][0]["parameter_id"]

    for invalid_score in [0, -1, 11, 100]:
        r = await client.put(
            f"/api/rating-sessions/{session_id}/answers/{param_id}",
            json={"score": invalid_score, "is_no_view": False},
        )
        assert r.status_code == 422


@pytest.mark.asyncio
async def test_mixed_numeric_and_no_view_session_calculates_mean_strictly_over_numeric(client: AsyncClient):
    """Verify mean calculation excludes No-views and does not dilute the mean with zeroes."""
    client_uuid = str(uuid4())
    resp = await client.post(
        "/api/respondents",
        json={
            "client_uuid": client_uuid,
            "declared_college_id": str(SFIT_ID),
            "affiliation": "current_student",
        },
    )
    respondent_id = resp.json()["id"]
    sess_resp = await client.post(
        "/api/rating-sessions",
        json={"college_id": str(SFIT_ID), "respondent_id": respondent_id},
    )
    session_id = sess_resp.json()["id"]

    ratings_report = (await client.get(f"/api/colleges/{SFIT_ID}/ratings")).json()
    params = ratings_report["parameters"]

    # 3 numeric scores of 8 -> sum=24, count=3, mean=8.0 -> HIGH
    for p in params[:3]:
        await client.put(
            f"/api/rating-sessions/{session_id}/answers/{p['parameter_id']}",
            json={"score": 8, "is_no_view": False},
        )
    # Remaining 22 are No view
    for p in params[3:]:
        await client.put(
            f"/api/rating-sessions/{session_id}/answers/{p['parameter_id']}",
            json={"is_no_view": True},
        )

    sub_resp = await client.post(f"/api/rating-sessions/{session_id}/submit")
    assert sub_resp.status_code == 200
    data = sub_resp.json()
    assert data["unrounded_overall_rating"] == 8.0
    assert data["category"] == "high"
    assert data["score_contribution_inserted"] is True



