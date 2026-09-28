package com.memorizez.memorizez.card.repository;


import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, String> {

    Page<Card> findAllByCollectionOrderByFrontAsc(
            Collection collection,
            Pageable pageable
    );

    Optional<Card> findByIdAndCollection(
            String id,
            Collection collection
    );

    @Query("""
    SELECT c
    FROM Card c
    LEFT JOIN Review r ON r.card = c
    WHERE c.collection.user = :user
      AND (
          r IS NULL
          OR r.stage IS NULL
          OR r.nextReviewDate <= :today
      )
    ORDER BY
        CASE WHEN r.nextReviewDate IS NULL THEN 0 ELSE 1 END,
        r.nextReviewDate ASC,
        c.createdAt ASC
    """)
    List<Card> findAvailableForReview(
            User user,
            LocalDate today
    );

}
