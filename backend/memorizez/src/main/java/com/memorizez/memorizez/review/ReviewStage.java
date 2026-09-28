package com.memorizez.memorizez.review;

public enum ReviewStage {

    ONE_DAY(1),
    SEVEN_DAYS(7),
    FIFTEEN_DAYS(15),
    THIRTY_DAYS(30);

    private final int intervalDays;

    ReviewStage(int intervalDays) {
        this.intervalDays = intervalDays;
    }

    public int getIntervalDays() {
        return intervalDays;
    }
}