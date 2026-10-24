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
