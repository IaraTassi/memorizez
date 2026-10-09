package com.memorizez.memorizez.card;

import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.history.History;
import com.memorizez.memorizez.review.Review;
import jakarta.persistence.*;

import java.time.LocalDate;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "cards")
public class Card {

    @Id
    private String id;

    @Column(nullable = false, length = 200)
    private String front;

    @Column(nullable = false, length = 400)
    private String back;

    @Column(nullable = true, length = 300)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDate createdAt;

    @Column(nullable = false)
    private int rememberedCount = 0;

    @Column(nullable = false)
    private int notRememberedCount = 0;

    @Column(nullable = false)
    private int editCount = 0;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "collection_id", nullable = false)
    private Collection collection;

    @OneToOne(
            mappedBy = "card",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true
    )
    private Review review;

    @OneToMany(
            mappedBy = "card",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true
    )
    private List<History> histories = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }

        if (createdAt == null) {
            createdAt = LocalDate.now();
        }
    }

    public String getId() {
        return id;
    }

    public String getFront() {
        return front;
    }

    public void setFront(String front) {
        this.front = front;
    }

    public String getBack() {
        return back;
    }

    public void setBack(String back) {
        this.back = back;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public Collection getCollection() {
        return collection;
    }

    public void setCollection(Collection collection) {
        this.collection = collection;
    }

    public int getRememberedCount() {
        return rememberedCount;
    }

    public int getNotRememberedCount() {
        return notRememberedCount;
    }

    public int getEditCount() {
        return editCount;
    }

    public void incrementRememberedCount() {
        rememberedCount++;
    }

    public void incrementNotRememberedCount() {
        notRememberedCount++;
    }

    public void incrementEditCount() {
        editCount++;
    }
}
