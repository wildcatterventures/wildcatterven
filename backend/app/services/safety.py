"""
Campus Uncut — Lightweight AI Safety & Content Moderation Module.
Provides deterministic, context-aware input and output checks for the AI assistant.
Enforces Google Play Generative AI compliance without paid moderation APIs or external calls.
"""

from dataclasses import dataclass
import re
from typing import Optional

DEFAULT_REFUSAL_MESSAGE = (
    "Campus Uncut is an intelligence platform focused on college discovery, academic life, "
    "campus living, and student experiences. I cannot generate sexually explicit, violent, "
    "or abusive content. How can I help you explore institutions or verified student ratings?"
)

OUTPUT_SAFETY_REFUSAL = (
    "I apologize, but I cannot provide that response as it violates our content safety policies "
    "regarding explicit, violent, or abusive material. I can help answer questions about college "
    "admissions, academics, campus facilities, or student ratings."
)


@dataclass(frozen=True)
class SafetyResult:
    """Result of a safety evaluation on user input or assistant output."""
    is_safe: bool
    refusal_message: str = DEFAULT_REFUSAL_MESSAGE
    reason: Optional[str] = None
    category: Optional[str] = None


# 1. Child Sexual Exploitation and Abuse (CSAE / CSAM) - Absolute zero tolerance
_CSAM_PATTERN = re.compile(
    r"\b(child|children|minor|minors|underage|pedophil\w*|paedophil\w*|teenager|schoolboy|schoolgirl|infant|toddler)\b"
    r".*?\b(erotica|erotic|porn\w*|sex|intercourse|naked|nude|penetrat\w*|molest\w*|fondl\w*)\b|"
    r"\b(erotica|erotic|porn\w*|sex|intercourse|naked|nude|penetrat\w*|molest\w*|fondl\w*)\b"
    r".*?\b(child|children|minor|minors|underage|pedophil\w*|paedophil\w*|teenager|schoolboy|schoolgirl|infant|toddler)\b",
    re.IGNORECASE,
)

# 2. Sexually Explicit, Erotic, or Pornographic Generation Requests
_EXPLICIT_SEXUAL_GENERATION_PATTERN = re.compile(
    r"\b(write|generate|tell|compose|create|describe|narrate|roleplay|act\s+as)\b.*?"
    r"\b(erotica|erotic|porn|pornography|smut|nsfw|sex\s+scene|cybersex|blowjob|handjob|gangbang|penetration|cumshot|creampie|masturbat\w+)\b|"
    r"\b(hardcore\s+porn|erotic\s+story|erotic\s+novel|sexual\s+story|porn\s+script|sex\s+roleplay|erotic\s+roleplay)\b|"
    r"\b(talk\s+dirty\s+to\s+me|dirty\s+talk)\b",
    re.IGNORECASE,
)

# 3. Graphic Violence, Dangerous Weapons, and Self-Harm
_DANGEROUS_VIOLENCE_PATTERN = re.compile(
    r"\b(how\s+to\s+(make|build|assemble|detonate|construct)|instructions?\s+(for|to)\s+(make|build)|recipe\s+for)\b.*?"
    r"\b(bomb|pipe\s*bomb|explosive|ied|landmine|molotov|cyanide|ricin|nerve\s+agent)\b|"
    r"\b(how\s+to\s+(kill|murder|assassinate|lynch|torture|shoot\s+up|slit|poison)|help\s+me\s+(kill|murder|assassinate))\b.*?"
    r"\b(someone|people|person|student|professor|dean|family|classmate)\b|"
    r"\b(how\s+to\s+(commit\s+suicide|kill\s+myself|hang\s+myself|slit\s+my\s+wrists|end\s+my\s+life)|best\s+way\s+to\s+commit\s+suicide)\b",
    re.IGNORECASE,
)

# 4. Severe Harassment, Stalking, and Criminal Abuse Instructions
_HARASSMENT_ABUSE_PATTERN = re.compile(
    r"\b(how\s+to|ways\s+to|help\s+me|guide\s+to)\b.*?"
    r"\b(stalk|doxx|dox|blackmail|extort|cyberbully|swat)\b.*?"
    r"\b(someone|student|classmate|professor|girl|person|crush)\b|"
    r"\b(how\s+to\s+rag\s+a\s+junior|how\s+to\s+harass\s+someone\s+without\s+getting\s+caught)\b",
    re.IGNORECASE,
)

# 5. Severe Hate Speech, Dehumanization, and Violent Group Incitement
_HATE_SPEECH_PATTERN = re.compile(
    r"\b(exterminate|gas|kill\s+all|eradicate)\s+(jews|muslims|hindus|dalits|blacks|whites|gays|lgbtq|transgender)\b|"
    r"\b(subhuman|vermin|cockroaches)\s+(caste|race|religion|minorities)\b",
    re.IGNORECASE,
)

# Output check: Graphic sexual depictions or vulgar pornographic narration in generated responses
_EXPLICIT_OUTPUT_PATTERN = re.compile(
    r"\b(moaned\s+in\s+pleasure|thrusting\s+deeply|stroked\s+his\s+cock|wet\s+pussy|climaxed\s+hard|spread\s+her\s+legs\s+and\s+entered)\b|"
    r"\b(detailed\s+guide\s+to\s+building\s+a\s+bomb|instructions\s+to\s+make\s+an\s+explosive)\b",
    re.IGNORECASE,
)


def evaluate_input_safety(message: str) -> SafetyResult:
    """
    Evaluate user query against content safety policies.
    Permits legitimate educational, reproductive health, campus safety, and consent discussions
    while blocking sexually explicit generation, CSAM, violence, hate speech, and harassment.
    """
    clean = (message or "").strip()
    if not clean:
        return SafetyResult(is_safe=True)

    # 1. Zero tolerance check: CSAM / Child Exploitation
    if _CSAM_PATTERN.search(clean):
        return SafetyResult(
            is_safe=False,
            refusal_message=DEFAULT_REFUSAL_MESSAGE,
            reason="Query involves minor-related sexual content or exploitation.",
            category="csam_prevention",
        )

    # 2. Dangerous violence, bomb making, suicide
    if _DANGEROUS_VIOLENCE_PATTERN.search(clean):
        return SafetyResult(
            is_safe=False,
            refusal_message=DEFAULT_REFUSAL_MESSAGE,
            reason="Query requests instructions for violence, weapons, or self-harm.",
            category="violence_prevention",
        )

    # 3. Targeted harassment, stalking, extortion instructions
    if _HARASSMENT_ABUSE_PATTERN.search(clean):
        return SafetyResult(
            is_safe=False,
            refusal_message=DEFAULT_REFUSAL_MESSAGE,
            reason="Query requests instructions for harassment, stalking, or abuse.",
            category="harassment_prevention",
        )

    # 4. Severe hate speech & incitement to violence
    if _HATE_SPEECH_PATTERN.search(clean):
        return SafetyResult(
            is_safe=False,
            refusal_message=DEFAULT_REFUSAL_MESSAGE,
            reason="Query contains hate speech or incitement against protected groups.",
            category="hate_speech_prevention",
        )

    # 5. Explicit sexual / erotic generation requests
    # (Notice: This pattern explicitly checks for intent to *generate/roleplay* erotica or porn,
    # so questions like "What is consent?", "Does campus provide contraception?", or
    # "How does ICC handle sexual harassment?" will NOT match and will safely pass).
    if _EXPLICIT_SEXUAL_GENERATION_PATTERN.search(clean):
        return SafetyResult(
            is_safe=False,
            refusal_message=DEFAULT_REFUSAL_MESSAGE,
            reason="Query requests generation of sexually explicit, erotic, or pornographic content.",
            category="explicit_content_prevention",
        )

    return SafetyResult(is_safe=True)


def evaluate_output_safety(reply_text: str) -> SafetyResult:
    """
    Verify assistant-generated reply before sending to client.
    Ensures generated text does not contain explicit pornographic scenes or dangerous instructions.
    """
    clean = (reply_text or "").strip()
    if not clean:
        return SafetyResult(is_safe=True)

    if _CSAM_PATTERN.search(clean):
        return SafetyResult(
            is_safe=False,
            refusal_message=OUTPUT_SAFETY_REFUSAL,
            reason="Output contained prohibited minor-related content.",
            category="csam_prevention",
        )

    if _EXPLICIT_OUTPUT_PATTERN.search(clean):
        return SafetyResult(
            is_safe=False,
            refusal_message=OUTPUT_SAFETY_REFUSAL,
            reason="Output contained sexually explicit or dangerous content.",
            category="explicit_output_prevention",
        )

    return SafetyResult(is_safe=True)
