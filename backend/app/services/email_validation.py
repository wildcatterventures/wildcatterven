import re
from typing import Tuple
from uuid import UUID
import asyncpg
from fastapi import HTTPException, status
from app.core.constants import (
    DISALLOWED_DISPOSABLE_DOMAINS,
    DISALLOWED_FREE_DOMAINS,
    VALID_ACADEMIC_TLD_SUFFIXES,
)

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
)

BOGUS_USERNAMES = {
    "test", "fake", "admin", "dummy", "placeholder", "none", "null", "asdf",
}


def normalize_email(email: str) -> str:
    """Strip whitespace and lowercase an email address."""
    return email.strip().lower()


def validate_email_structure_and_provider(email: str) -> Tuple[str, str]:
    """
    Validate standard email structure and reject vague, disposable,
    or generic public webmail providers (e.g., Gmail, Yahoo, Outlook).
    Returns (username, domain).
    """
    cleaned = normalize_email(email)
    if not cleaned or not EMAIL_REGEX.match(cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid, well-formed email address (e.g. yourname@college.ac.in).",
        )

    username, domain = cleaned.split("@", 1)
    username = username.strip()
    domain = domain.strip()

    # 1. Check for free public webmail providers first
    if domain in DISALLOWED_FREE_DOMAINS or any(
        domain.endswith("." + free_dom) for free_dom in DISALLOWED_FREE_DOMAINS
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Personal and public email providers (@gmail.com, @yahoo.com, @outlook.com, etc.) are strictly disallowed. Please use your official college-issued email ID.",
        )

    # 2. Check for temporary/disposable providers
    if domain in DISALLOWED_DISPOSABLE_DOMAINS or any(
        domain.endswith("." + disp_dom) for disp_dom in DISALLOWED_DISPOSABLE_DOMAINS
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Temporary or disposable email addresses are strictly prohibited. Please provide your legitimate college email.",
        )

    # 3. Check username
    if len(username) < 2 or username in BOGUS_USERNAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide your legitimate personal college email ID, not a generic or placeholder username.",
        )

    # Vague domain checks (e.g., domain without valid parts)
    parts = domain.split(".")
    if len(parts) < 2 or any(len(p) == 0 for p in parts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email domain format.",
        )

    return username, domain


async def validate_college_email_affinity(
    conn: asyncpg.Connection,
    email: str,
    declared_college_id: UUID,
) -> str:
    """
    Verify that the given email is:
    1. A well-structured non-vague email.
    2. Not from an unapproved public or disposable provider.
    3. Strictly bound to the declared college (e.g., @sfit.ac.in cannot vote for IIT Bombay).
    Returns the normalized email address.
    """
    _, domain = validate_email_structure_and_provider(email)

    # 1. Fetch declared college
    declared_college = await conn.fetchrow(
        "SELECT id, name, short_code, email_domains, is_demo FROM colleges WHERE id = $1;",
        declared_college_id,
    )
    if not declared_college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Declared college {declared_college_id} does not exist.",
        )

    # 2. Fetch all known colleges with registered email domains to detect cross-college violations
    all_colleges = await conn.fetch(
        "SELECT id, name, short_code, email_domains FROM colleges WHERE email_domains IS NOT NULL AND email_domains != '';"
    )

    declared_dict = dict(declared_college) if not isinstance(declared_college, dict) else declared_college
    declared_raw = declared_dict.get("email_domains") or ""
    declared_domains = [d.strip().lower() for d in declared_raw.split(",") if d.strip()]

    # If the declared college has explicit registered domains:
    if declared_domains:
        matches_declared = any(
            domain == d or domain.endswith("." + d) for d in declared_domains
        )
        if matches_declared:
            return normalize_email(email)

        # Domain does not match target college.
        # Check if this domain belongs to another known college:
        for other in all_colleges:
            other_dict = dict(other) if not isinstance(other, dict) else other
            if other_dict["id"] == declared_college_id:
                continue
            other_domains = [
                d.strip().lower()
                for d in (other_dict.get("email_domains") or "").split(",")
                if d.strip()
            ]
            if any(domain == d or domain.endswith("." + d) for d in other_domains):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"College domain mismatch: Email address '@{domain}' belongs to "
                        f"{other_dict['name']} ({other_dict['short_code']}). "
                        f"You cannot rate {declared_dict['name']} using an email from {other_dict['name']}."
                    ),
                )

        # Does not match declared college, and not explicitly owned by another
        expected_str = " or ".join(f"@{d}" for d in declared_domains)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"College domain mismatch: Email domain '@{domain}' is not authorized for "
                f"{declared_dict['name']}. Please use your official institutional email (expected: {expected_str})."
            ),
        )

    # If declared college does NOT have email_domains configured (e.g. unknown college added dynamically)
    # Check if domain belongs to ANY other registered college:
    for other in all_colleges:
        other_dict = dict(other) if not isinstance(other, dict) else other
        other_domains = [
            d.strip().lower()
            for d in (other_dict.get("email_domains") or "").split(",")
            if d.strip()
        ]
        if any(domain == d or domain.endswith("." + d) for d in other_domains):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"College domain mismatch: Email address '@{domain}' belongs to "
                    f"{other_dict['name']} ({other_dict['short_code']}). "
                    f"You cannot rate {declared_dict['name']} using an email from {other_dict['name']}."
                ),
            )

    # Must at least have an academic TLD
    has_academic_tld = any(domain.endswith(suffix) for suffix in VALID_ACADEMIC_TLD_SUFFIXES)
    if not has_academic_tld:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Vague or non-institutional domain '@{domain}'. A valid college email must end with "
                "an academic extension (such as .ac.in, .edu, .edu.in) or match your college's official domain."
            ),
        )

    return normalize_email(email)
