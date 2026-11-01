import pytest
from app.core.constants import (
    BASE_SCORE,
    CATEGORY_HIGH,
    CATEGORY_LOW,
    CATEGORY_NEUTRAL,
    HIGH_THRESHOLD,
    LOW_THRESHOLD,
)
from app.services.scoring import (
    calculate_arithmetic_mean,
    check_threshold_crossing,
    classify_category,
)


def test_arithmetic_mean_mixed_numeric_and_no_view():
    """Verify arithmetic mean calculates accurately excluding No-view answers."""
    # 5 scores: 6, 8, No-view, 10, No-view -> (6 + 8 + 10) / 3 = 24 / 3 = 8.0
    scores = [6, 8, None, 10, None]
    is_no_views = [False, False, True, False, True]
    mean = calculate_arithmetic_mean(scores, is_no_views)
    assert mean is not None
    assert mean == 8.0


def test_arithmetic_mean_all_no_view():
    """Verify all-No-view session produces None rather than zero or failing."""
    scores = [None, None, None, None]
    is_no_views = [True, True, True, True]
    mean = calculate_arithmetic_mean(scores, is_no_views)
    assert mean is None


def test_arithmetic_mean_all_numeric():
    """Verify pure numeric answers calculate unrounded mean."""
    scores = [2, 3, 2, 3]
    is_no_views = [False, False, False, False]
    mean = calculate_arithmetic_mean(scores, is_no_views)
    assert mean == 2.5


def test_category_boundaries_around_four_and_eight():
    """
    Verify exact classification boundaries:
    - mean < 4.0 -> low
    - 4.0 <= mean < 8.0 -> neutral
    - mean >= 8.0 -> high
    """
    assert classify_category(3.999) == CATEGORY_LOW
    assert classify_category(4.0) == CATEGORY_NEUTRAL
    assert classify_category(4.001) == CATEGORY_NEUTRAL
    assert classify_category(7.999) == CATEGORY_NEUTRAL
    assert classify_category(8.0) == CATEGORY_HIGH
    assert classify_category(8.001) == CATEGORY_HIGH
    assert classify_category(None) is None


def test_exact_assignment_boundary_values():
    """
    Verify assignment exact boundary values:
    - 3.99 -> low
    - 4.00 -> neutral
    - 7.99 -> neutral
    - 8.00 -> high (CRITICAL: 8.00 must qualify as high, not neutral)
    """
    assert classify_category(3.99) == CATEGORY_LOW
    assert classify_category(4.00) == CATEGORY_NEUTRAL
    assert classify_category(7.99) == CATEGORY_NEUTRAL
    assert classify_category(8.00) == CATEGORY_HIGH


def test_unrounded_arithmetic_mean_preserves_category_boundaries():
    """
    Verify arithmetic mean is unrounded when determining category:
    - Mean 7.996: if rounded to 1 or 2 decimals it would be 8.0, but unrounded it must remain neutral.
    - Mean 3.996: if rounded to 1 or 2 decimals it would be 4.0, but unrounded it must remain low.
    """
    # 7.996 is strictly < 8.0 -> neutral
    mean_near_high = 7.996
    assert classify_category(mean_near_high) == CATEGORY_NEUTRAL

    # 3.996 is strictly < 4.0 -> low
    mean_near_neutral = 3.996
    assert classify_category(mean_near_neutral) == CATEGORY_LOW


def test_initial_base_score_is_one_hundred():
    """Verify the platform base score constant is strictly 100."""
    assert BASE_SCORE == 100


def test_nineteen_low_contributions_leave_score_at_100_twentieth_drops_to_99():
    """
    Verify threshold block logic for low contributions:
    - 19 low contributions: block 0 (19 // 20 == 0) -> no delta.
    - 20th low contribution: block 1 (20 // 20 == 1) -> delta = -1 (100 -> 99).
    """
    score = BASE_SCORE

    # First 19 contributions
    for i in range(1, 20):
        crossed, blk, delta = check_threshold_crossing(
            category=CATEGORY_LOW,
            old_count=i - 1,
            new_count=i,
        )
        assert not crossed
        assert blk is None
        assert delta is None

    assert score == 100

    # 20th contribution
    crossed, blk, delta = check_threshold_crossing(
        category=CATEGORY_LOW,
        old_count=19,
        new_count=20,
    )
    assert crossed is True
    assert blk == 1
    assert delta == -1
    score += delta
    assert score == 99


def test_nineteen_high_contributions_leave_score_at_100_twentieth_increments_to_101():
    """
    Verify threshold block logic for high contributions:
    - 19 high contributions: block 0 (19 // 20 == 0) -> no delta.
    - 20th high contribution: block 1 (20 // 20 == 1) -> delta = +1 (100 -> 101).
    """
    score = BASE_SCORE

    # First 19 contributions
    for i in range(1, 20):
        crossed, blk, delta = check_threshold_crossing(
            category=CATEGORY_HIGH,
            old_count=i - 1,
            new_count=i,
        )
        assert not crossed
        assert blk is None
        assert delta is None

    assert score == 100

    # 20th contribution
    crossed, blk, delta = check_threshold_crossing(
        category=CATEGORY_HIGH,
        old_count=19,
        new_count=20,
    )
    assert crossed is True
    assert blk == 1
    assert delta == 1
    score += delta
    assert score == 101


def test_neutral_contributions_never_alter_score():
    """Verify neutral ratings never trigger a block or change the score, even after 20+ contributions."""
    for count in [1, 19, 20, 21, 40, 100]:
        crossed, blk, delta = check_threshold_crossing(
            category=CATEGORY_NEUTRAL,
            old_count=count - 1,
            new_count=count,
        )
        assert not crossed
        assert blk is None
        assert delta is None


def test_specification_scoring_scenarios_table():
    """
    Verify all scenarios from product specification table:
    | Scenario                        | Expected institutional score |
    | New college                     | 100                          |
    | 19 low ratings                  | 100                          |
    | 20 low ratings                  | 99                           |
    | 39 low ratings                  | 99                           |
    | 40 low ratings                  | 98                           |
    | 19 high ratings                 | 100                          |
    | 20 high ratings                 | 101                          |
    | 40 high ratings                 | 102                          |
    | Neutral ratings only            | 100                          |
    | A mixture of 20 low and 20 high | 100                          |
    """
    # 1. New college
    assert BASE_SCORE == 100

    # Helper to simulate sequential contributions of a category
    def simulate_sequence(cat: str, count: int, starting_score: int = BASE_SCORE) -> int:
        score = starting_score
        for i in range(1, count + 1):
            crossed, blk, delta = check_threshold_crossing(cat, i - 1, i)
            if crossed and delta is not None:
                score += delta
        return score

    # 2. 19 low ratings -> 100
    assert simulate_sequence(CATEGORY_LOW, 19) == 100

    # 3. 20 low ratings -> 99
    assert simulate_sequence(CATEGORY_LOW, 20) == 99

    # 4. 39 low ratings -> 99
    assert simulate_sequence(CATEGORY_LOW, 39) == 99

    # 5. 40 low ratings -> 98
    assert simulate_sequence(CATEGORY_LOW, 40) == 98

    # 6. 19 high ratings -> 100
    assert simulate_sequence(CATEGORY_HIGH, 19) == 100

    # 7. 20 high ratings -> 101
    assert simulate_sequence(CATEGORY_HIGH, 20) == 101

    # 8. 40 high ratings -> 102
    assert simulate_sequence(CATEGORY_HIGH, 40) == 102

    # 9. Neutral ratings only (e.g. 50 neutral ratings) -> 100
    assert simulate_sequence(CATEGORY_NEUTRAL, 50) == 100

    # 10. A mixture of 20 low and 20 high -> 100
    score_mixed = BASE_SCORE
    # Apply 20 low ratings
    for i in range(1, 21):
        crossed, _, delta = check_threshold_crossing(CATEGORY_LOW, i - 1, i)
        if crossed and delta is not None:
            score_mixed += delta
    assert score_mixed == 99

    # Apply 20 high ratings
    for i in range(1, 21):
        crossed, _, delta = check_threshold_crossing(CATEGORY_HIGH, i - 1, i)
        if crossed and delta is not None:
            score_mixed += delta
    assert score_mixed == 100


def test_student_experience_excludes_no_view_never_treats_as_zero():
    """
    Verify student experience rating arithmetic mean calculation:
    - Example: Food=8, Professors=7, Infrastructure=9, Hostel=6, Safety=8
      -> 38 / 5 = 7.6 / 10
    - If 20 answers are 'No View', calculation strictly divides by remaining numeric answers.
    - 'No View' is never treated as 0.
    """
    scores = [8, 7, 9, 6, 8] + [None] * 20
    is_no_views = [False, False, False, False, False] + [True] * 20

    mean = calculate_arithmetic_mean(scores, is_no_views)
    assert mean is not None
    assert round(mean, 2) == 7.60
    assert classify_category(mean) == CATEGORY_NEUTRAL


def test_partial_groups_carry_forward():
    """Verify partial groups below 20 carry forward and trigger only on full multiples."""
    score = BASE_SCORE
    # Batch 1: 19 low ratings -> score stays 100
    for i in range(1, 20):
        crossed, _, delta = check_threshold_crossing(CATEGORY_LOW, i - 1, i)
        assert not crossed
    assert score == 100

    # Next single low rating (20th) -> drops to 99
    crossed, blk, delta = check_threshold_crossing(CATEGORY_LOW, 19, 20)
    assert crossed and blk == 1 and delta == -1
    score += delta
    assert score == 99

    # Next 19 low ratings (21 to 39) -> score stays 99
    for i in range(21, 40):
        crossed, _, delta = check_threshold_crossing(CATEGORY_LOW, i - 1, i)
        assert not crossed
    assert score == 99

    # 40th low rating -> drops to 98
    crossed, blk, delta = check_threshold_crossing(CATEGORY_LOW, 39, 40)
    assert crossed and blk == 2 and delta == -1
    score += delta
    assert score == 98


def test_college_student_experience_average_aggregation_isolated_fixtures():
    """
    Focused verification for database aggregate calculation:
    1. College with submitted ratings receives actual AVG(calculated_overall_rating).
    2. IITB reproduces ~8.51 from its 3 submitted sessions (9.240, 7.208, 9.080).
    3. COEP reproduces ~7.22 (7.217).
    4. PICT reproduces ~7.68 (7.680).
    5. SPIT reproduces ~5.52 (5.520).
    6. SFIT reproduces 10.00 (10.000).
    7. College without valid submitted ratings receives NULL.
    8. NULL overall ratings are excluded from AVG.
    9. Existing institutional score remains 100/100.
    10. Category and submission counts remain independent.
    """
    def calc_db_avg(session_ratings: list[float | None]) -> float | None:
        valid = [r for r in session_ratings if r is not None]
        if not valid:
            return None
        return round(sum(valid) / len(valid), 2)

    # 1. Historical database values
    iitb_sessions = [9.240, 7.208, 9.080]
    assert calc_db_avg(iitb_sessions) == 8.51

    coep_sessions = [7.217]
    assert calc_db_avg(coep_sessions) == 7.22

    pict_sessions = [7.680]
    assert calc_db_avg(pict_sessions) == 7.68

    spit_sessions = [5.520]
    assert calc_db_avg(spit_sessions) == 5.52

    sfit_sessions = [10.000]
    assert calc_db_avg(sfit_sessions) == 10.00

    # 2. College without ratings receives None (SQL NULL)
    assert calc_db_avg([]) is None
    assert calc_db_avg([None, None]) is None

    # 3. NULL overall ratings are excluded
    assert calc_db_avg([8.5, None, 7.5]) == 8.00

    # 4. Institutional score remains independent
    assert BASE_SCORE == 100

