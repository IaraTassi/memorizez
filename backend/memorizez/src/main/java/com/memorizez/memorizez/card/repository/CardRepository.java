package com.memorizez.memorizez.card.repository;


import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.collection.Collection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

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

}
