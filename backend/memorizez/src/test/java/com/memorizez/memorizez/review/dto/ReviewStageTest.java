package com.memorizez.memorizez.review.dto;

import com.memorizez.memorizez.review.ReviewStage;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ReviewStageTest {

    @Test
    void shouldAdvanceFromOneDayToSevenDays() {
        assertEquals(
                ReviewStage.SEVEN_DAYS,
                ReviewStage.ONE_DAY.next()
        );
    }

    @Test
    void shouldAdvanceFromSevenDaysToFifteenDays() {
        assertEquals(
                ReviewStage.FIFTEEN_DAYS,
                ReviewStage.SEVEN_DAYS.next()
        );
    }

    @Test
    void shouldAdvanceFromFifteenDaysToThirtyDays() {
        assertEquals(
                ReviewStage.THIRTY_DAYS,
                ReviewStage.FIFTEEN_DAYS.next()
        );
    }

    @Test
    void shouldKeepThirtyDaysWhenAlreadyAtThirtyDays() {
        assertEquals(
                ReviewStage.THIRTY_DAYS,
                ReviewStage.THIRTY_DAYS.next()
        );
    }

    @Test
    void shouldHaveOneDayInterval() {
        assertEquals(1, ReviewStage.ONE_DAY.getIntervalDays());
    }

    @Test
    void shouldHaveSevenDaysInterval() {
        assertEquals(7, ReviewStage.SEVEN_DAYS.getIntervalDays());
    }

    @Test
    void shouldHaveFifteenDaysInterval() {
        assertEquals(15, ReviewStage.FIFTEEN_DAYS.getIntervalDays());
    }

    @Test
    void shouldHaveThirtyDaysInterval() {
        assertEquals(30, ReviewStage.THIRTY_DAYS.getIntervalDays());
    }
}
