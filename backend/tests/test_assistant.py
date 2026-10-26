from unittest.mock import patch
from uuid import uuid4
import pytest
from httpx import AsyncClient
from app.agents.mock_provider import MockLLMProvider
from app.agents.tools import APPROVED_TOOLS_SPEC, execute_tool
from tests.conftest import MockAsyncpgConnection, SFIT_ID


@pytest.mark.asyncio
async def test_mock_provider_works_without_network_or_api_key():
    """Verify MockLLMProvider functions offline without requiring API key or network access."""
    provider = MockLLMProvider()
    reply, tool_calls = await provider.generate_response(
        messages=[{"role": "user", "content": "Search for SFIT"}],
        tools=APPROVED_TOOLS_SPEC,
    )
    assert len(tool_calls) == 1
    assert tool_calls[0]["name"] == "search_colleges"
    assert "query" in tool_calls[0]["arguments"]


@pytest.mark.asyncio
async def test_assistant_endpoint_search_colleges(client: AsyncClient):
    """Verify assistant endpoint executes search_colleges tool and returns structured payload."""
    payload = {"message": "Search for SFIT"}
    resp = await client.post("/api/assistant/message", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["tool_calls"]) >= 1
    tcall = data["tool_calls"][0]
    assert tcall["tool_name"] == "search_colleges"
    assert "SFIT" in str(tcall["result"])


@pytest.mark.asyncio
async def test_assistant_endpoint_parameter_ratings_retrieval(client: AsyncClient):
    """Verify assistant retrieves parameter ratings from platform database without inventing scores."""
    payload = {"message": "What is the score and rating for SFIT?"}
    resp = await client.post("/api/assistant/message", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["tool_calls"]) >= 1
    tool_names = [tc["tool_name"] for tc in data["tool_calls"]]
    assert any(name in ("get_college_summary", "get_parameter_ratings") for name in tool_names)


@pytest.mark.asyncio
async def test_tool_calling_safety_no_raw_sql_executed(mock_conn: MockAsyncpgConnection):
    """Verify all tool executions are strictly routed through approved services, not raw SQL."""
    # Attempt to call a nonexistent or arbitrary tool
    res = await execute_tool(mock_conn, "raw_sql_query", {"query": "DROP TABLE colleges;"})
    assert "error" in res
    assert "Unknown tool" in res["error"]


@pytest.mark.asyncio
async def test_create_unknown_college_tool_requires_confirmation(mock_conn: MockAsyncpgConnection):
    """Verify create_unknown_college tool requires explicit user confirmation before creation."""
    # Unconfirmed attempt
    res_unconfirmed = await execute_tool(
        mock_conn,
        "create_unknown_college",
        {
            "name": "Indian Institute of Science Education and Research",
            "city": "Pune",
            "state": "Maharashtra",
            "confirmed": False,
        },
    )
    assert res_unconfirmed["status"] == "confirmation_required"
    assert "confirm" in res_unconfirmed["message"].lower()

    # Confirmed attempt
    res_confirmed = await execute_tool(
        mock_conn,
        "create_unknown_college",
        {
            "name": "Indian Institute of Science Education and Research",
            "city": "Pune",
            "state": "Maharashtra",
            "confirmed": True,
        },
    )
    assert res_confirmed["status"] == "created"
    assert res_confirmed["college"]["current_score"] == 100


@pytest.mark.asyncio
async def test_tool_validation_failures_handled_safely(mock_conn: MockAsyncpgConnection):
    """Verify malformed arguments to tools are caught and return structured error dicts without crashing."""
    res = await execute_tool(mock_conn, "get_parameter_ratings", {"college_id": ""})
    assert "error" in res


@pytest.mark.asyncio
async def test_llm_error_fallback_activates_mock_provider_safely(client: AsyncClient):
    """
    Verify that if external LLM provider raises an error (e.g. rate limit, quota, network error),
    the assistant falls back deterministically to MockLLMProvider and does not crash or fabricate data.
    """
    with patch("app.services.assistant.get_llm_provider") as mock_get_provider:
        # Simulate a provider that raises an exception
        class BrokenProvider:
            async def generate_response(self, messages, tools):
                raise RuntimeError("External AI provider rate limited / 429 Too Many Requests")

        mock_get_provider.return_value = BrokenProvider()

        payload = {"message": "Search colleges in Mumbai"}
        resp = await client.post("/api/assistant/message", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["provider_used"] == "mock_fallback"
        assert len(data["tool_calls"]) >= 1
        assert data["tool_calls"][0]["tool_name"] == "search_colleges"


@pytest.mark.asyncio
async def test_assistant_all_nine_canonical_queries(client: AsyncClient):
    """
    Verify all 9 canonical assistant tool-calling requests mandated by the MVP audit:
    1. 'Find colleges in Mumbai.' -> search_colleges
    2. 'What is the score of SFIT?' -> get_college_summary
    3. 'How do students rate placements at this college?' -> get_parameter_ratings
    4. 'Show me the hostel rating.' -> get_parameter_ratings
    5. 'Start rating my college.' -> start_rating_session
    6. 'What question am I answering?' -> get_rating_session
    7. 'Save my rating as eight.' -> save_rating_answer
    8. 'Submit my rating.' -> submit_rating_session
    9. 'Add a college that is not listed.' -> create_unknown_college
    """
    queries_and_expected_tools = [
        ("Find colleges in Mumbai.", "search_colleges"),
        ("What is the score of SFIT?", "get_college_summary"),
        ("How do students rate placements at this college?", "get_parameter_ratings"),
        ("Show me the hostel rating.", "get_parameter_ratings"),
        ("Start rating my college.", "start_rating_session"),
        ("What question am I answering?", "get_rating_session"),
        ("Save my rating as eight.", "save_rating_answer"),
        ("Submit my rating.", "submit_rating_session"),
        ("Add a college that is not listed.", "create_unknown_college"),
    ]

    dummy_session_id = str(uuid4())
    dummy_client_uuid = str(uuid4())

    for query, expected_tool in queries_and_expected_tools:
        payload = {
            "message": query,
            "session_id": dummy_session_id,
            "client_uuid": dummy_client_uuid,
        }
        resp = await client.post("/api/assistant/message", json=payload)
        assert resp.status_code == 200, f"Query '{query}' failed with {resp.status_code}"
        data = resp.json()
        assert "reply" in data
        assert len(data["tool_calls"]) >= 1, f"No tool calls produced for '{query}'"
        called_tools = [tc["tool_name"] for tc in data["tool_calls"]]
        assert expected_tool in called_tools, f"Expected '{expected_tool}' for query '{query}', but got {called_tools}"

