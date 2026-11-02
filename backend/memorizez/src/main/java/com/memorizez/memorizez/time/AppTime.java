package com.memorizez.memorizez.time;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

public final class AppTime {

    private static final ZoneId ZONE =
            ZoneId.of("America/Sao_Paulo");

    private AppTime() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }
}
