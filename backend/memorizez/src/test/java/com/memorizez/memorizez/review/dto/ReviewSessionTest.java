package com.memorizez.memorizez.review.dto;

import com.memorizez.memorizez.review.ReviewSession;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ReviewSessionTest {

    @Test
    void shouldStartSessionWithFirstCardAsCurrent() {

        ReviewSession session =
                new ReviewSession(
                        "collection-1",
                        List.of("card-1", "card-2", "card-3")
                );

        assertEquals("collection-1", session.getCollectionId());
        assertEquals(
                List.of("card-1", "card-2", "card-3"),
                session.getCardIds()
        );
        assertEquals(0, session.getCurrentIndex());
        assertEquals(3, session.getTotalCards());
        assertEquals(0, session.getCompletedCards());
        assertEquals(0, session.getPercentage());
        assertEquals("card-1", session.getCurrentCardId());
    }

    @Test
    void shouldAdvanceToNextCard() {

        ReviewSession session =
                new ReviewSession(
                        "collection-1",
                        List.of("card-1", "card-2", "card-3")
                );

        session.advance();

        assertEquals(1, session.getCurrentIndex());
        assertEquals(1, session.getCompletedCards());
        assertEquals("card-2", session.getCurrentCardId());
    }

    @Test
    void shouldCalculateProgressCorrectly() {

        ReviewSession session =
                new ReviewSession(
                        "collection-1",
                        List.of(
                                "card-1",
                                "card-2",
                                "card-3",
                                "card-4"
                        )
                );

        session.advance();

        assertEquals(1, session.getCompletedCards());
        assertEquals(4, session.getTotalCards());
        assertEquals(25, session.getPercentage());

        session.advance();

        assertEquals(2, session.getCompletedCards());
        assertEquals(50, session.getPercentage());
    }

    @Test
    void shouldReachOneHundredPercentWhenAllCardsAreCompleted() {

        ReviewSession session =
                new ReviewSession(
                        "collection-1",
                        List.of("card-1", "card-2")
                );

        session.advance();
        session.advance();

        assertEquals(2, session.getCompletedCards());
        assertEquals(2, session.getTotalCards());
        assertEquals(100, session.getPercentage());
    }

    @Test
    void shouldReturnZeroPercentageWhenSessionHasNoCards() {

        ReviewSession session =
                new ReviewSession(
                        "collection-1",
                        List.of()
                );

        assertEquals(0, session.getPercentage());
    }

}
