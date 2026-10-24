"""Campus Uncut core scoring and domain constants."""

# Scoring Constants
BASE_SCORE: int = 100
SCORE_BLOCK_SIZE: int = 20
SCORE_DELTA_LOW: int = -1
SCORE_DELTA_HIGH: int = 1

# Rating Scale & Classification Thresholds
MIN_RATING_SCORE: int = 1
MAX_RATING_SCORE: int = 10
LOW_THRESHOLD: float = 4.0      # unrounded mean < 4.0 -> low
HIGH_THRESHOLD: float = 8.0     # unrounded mean >= 8.0 -> high

# Categories
CATEGORY_LOW: str = "low"
CATEGORY_NEUTRAL: str = "neutral"
CATEGORY_HIGH: str = "high"

# Expected Active Parameters Count
EXPECTED_ACTIVE_PARAMETERS_COUNT: int = 25

# Session Statuses
SESSION_STATUS_IN_PROGRESS: str = "in_progress"
SESSION_STATUS_SUBMITTED: str = "submitted"
SESSION_STATUS_ABANDONED: str = "abandoned"

# Affiliations
AFFILIATION_CURRENT_STUDENT: str = "current_student"
AFFILIATION_ALUMNUS: str = "alumnus"
VALID_AFFILIATIONS: set[str] = {AFFILIATION_CURRENT_STUDENT, AFFILIATION_ALUMNUS}
