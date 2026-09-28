package com.memorizez.memorizez.review;

import com.memorizez.memorizez.card.Card;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    private String id;

    @Enumerated(EnumType.STRING)
    private ReviewStage stage;

    private LocalDate nextReviewDate;

    private LocalDateTime revealedAt;

    @Version
    private Long version;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "card_id",
            nullable = false,
            unique = true
    )
    private Card card;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }

    public String getId() {
        return id;
    }

    public ReviewStage getStage() {
        return stage;
    }

    public void setStage(ReviewStage stage) {
        this.stage = stage;
    }

    public LocalDate getNextReviewDate() {
        return nextReviewDate;
    }

    public void setNextReviewDate(LocalDate nextReviewDate) {
        this.nextReviewDate = nextReviewDate;
    }

    public LocalDateTime getRevealedAt() {
        return revealedAt;
    }

    public void setRevealedAt(LocalDateTime revealedAt) {
        this.revealedAt = revealedAt;
    }

    public Long getVersion() {
        return version;
    }

    public Card getCard() {
        return card;
    }

    public void setCard(Card card) {
        this.card = card;
    }
}