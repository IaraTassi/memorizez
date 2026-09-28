package com.memorizez.memorizez.review.repository;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.review.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, String> {

    Optional<Review> findByCard(Card card);

}
