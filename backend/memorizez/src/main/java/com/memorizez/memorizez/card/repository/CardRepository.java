package com.memorizez.memorizez.card.repository;


import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, String> {

    Page<Card> findAllByCollectionOrderByCreatedAtDescIdDesc(
            Collection collection,
            Pageable pageable
    );

    Optional<Card> findByIdAndCollection(
            String id,
            Collection collection
    );

    List<Card> findAllByCollectionOrderByCreatedAtAsc(Collection collection);

    long countByCollection(Collection collection);

    @Query("""
    SELECT c
    FROM Card c
    LEFT JOIN Review r ON r.card = c
    WHERE c.collection.user = :user
      AND (
          r IS NULL
          OR r.stage IS NULL
          OR r.nextReviewDate IS NULL
          OR r.nextReviewDate <= :today
      )
    ORDER BY
        CASE
            WHEN r IS NOT NULL
                 AND r.stage IS NOT NULL
                 AND (r.nextReviewDate IS NULL
                      OR r.nextReviewDate < :today)
            THEN 0
            WHEN r.nextReviewDate = :today THEN 1
            ELSE 2
        END,
        r.nextReviewDate ASC,
        c.createdAt ASC,
        c.id ASC
    """)
    List<Card> findAvailableForReview(
            User user,
            LocalDate today
    );

    @Query("""
    SELECT c
    FROM Card c
    LEFT JOIN Review r ON r.card = c
    WHERE c.collection = :collection
      AND (
          r IS NULL
          OR r.stage IS NULL
          OR r.nextReviewDate IS NULL
          OR r.nextReviewDate <= :today
      )
    ORDER BY
        CASE
            WHEN r IS NOT NULL
                 AND r.stage IS NOT NULL
                 AND (r.nextReviewDate IS NULL
                      OR r.nextReviewDate < :today)
            THEN 0
            WHEN r.nextReviewDate = :today THEN 1
            ELSE 2
        END,
        r.nextReviewDate ASC,
        c.createdAt ASC,
        c.id ASC
    """)
    List<Card> findAvailableForReviewByCollection(
            @Param("collection") Collection collection,
            @Param("today") LocalDate today
    );
}
