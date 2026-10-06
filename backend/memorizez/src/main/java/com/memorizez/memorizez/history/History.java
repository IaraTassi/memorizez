package com.memorizez.memorizez.history;

import com.memorizez.memorizez.card.Card;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "histories")
public class History {

    @Id
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HistoryAction action;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public History(String id, Card card, HistoryAction action, LocalDateTime createdAt) {
        this.id = id;
        this.card = card;
        this.action = action;
        this.createdAt = createdAt;
    }

    @PrePersist
    private void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }

    public String getId() {
        return id;
    }

    public HistoryAction getAction() {
        return action;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    protected History() {
    }
}