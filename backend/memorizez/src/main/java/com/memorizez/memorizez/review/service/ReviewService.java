package com.memorizez.memorizez.review.service;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.card.exception.CardNotFoundException;
import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.exeption.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.review.Review;
import com.memorizez.memorizez.review.ReviewResult;
import com.memorizez.memorizez.review.ReviewStage;
import com.memorizez.memorizez.review.dto.ReviewResponse;
import com.memorizez.memorizez.review.dto.ReviewResultRequest;
import com.memorizez.memorizez.review.exception.CardNotAvailableForReviewException;
import com.memorizez.memorizez.review.exception.CardNotRevealedException;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CardRepository cardRepository;
    private final CollectionRepository collectionRepository;
    private final UserRepository userRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            CardRepository cardRepository,
            CollectionRepository collectionRepository,
            UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.cardRepository = cardRepository;
        this.collectionRepository = collectionRepository;
        this.userRepository = userRepository;
    }

    public List<ReviewResponse> findAvailableForReview(
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UserNotFoundException("User not found"));

        List<Card> cards = cardRepository.findAvailableForReview(
                user,
                LocalDate.now()
        );

        return cards.stream()
                .map(card -> {
                    Review review = reviewRepository
                            .findByCard(card)
                            .orElse(null);

                    return new ReviewResponse(
                            card.getId(),
                            card.getFront(),
                            null,
                            null,
                            review != null ? review.getStage() : null,
                            review != null
                                    ? review.getNextReviewDate()
                                    : null
                    );
                })
                .toList();
    }

    @Transactional
    public ReviewResponse reveal(
            String collectionId,
            String cardId,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(collectionId, user)
                .orElseThrow(() ->
                        new CollectionNotFoundException("Collection not found"));

        Card card = cardRepository
                .findByIdAndCollection(cardId, collection)
                .orElseThrow(() ->
                        new CardNotFoundException("Card not found"));

        Review review = reviewRepository
                .findByCard(card)
                .orElse(null);

        LocalDate today = LocalDate.now();

        if (review != null
                && review.getStage() != null
                && review.getNextReviewDate().isAfter(today)) {

            throw new CardNotAvailableForReviewException(
                    "Card is not available for review"
            );
        }

        if (review == null) {
            review = new Review();
            review.setCard(card);
        }

        review.setRevealedAt(LocalDateTime.now());

        reviewRepository.save(review);

        return new ReviewResponse(
                card.getId(),
                card.getFront(),
                card.getBack(),
                card.getNotes(),
                review.getStage(),
                review.getNextReviewDate()
        );
    }

    @Transactional
    public void submitResult(
            String collectionId,
            String cardId,
            ReviewResultRequest request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(collectionId, user)
                .orElseThrow(() ->
                        new CollectionNotFoundException(
                                "Collection not found"
                        ));

        Card card = cardRepository
                .findByIdAndCollection(cardId, collection)
                .orElseThrow(() ->
                        new CardNotFoundException("Card not found"));

        Review review = reviewRepository
                .findByCard(card)
                .orElseThrow(() ->
                        new CardNotRevealedException(
                                "Card must be revealed before submitting result"
                        ));

        if (review.getRevealedAt() == null) {
            throw new CardNotRevealedException(
                    "Card must be revealed before submitting result"
            );
        }

        if (request.getResult() == ReviewResult.REMEMBERED) {

            card.incrementRememberedCount();

            if (review.getStage() == null) {
                review.setStage(ReviewStage.ONE_DAY);

            } else if (review.getStage() != ReviewStage.THIRTY_DAYS) {
                review.setStage(
                        ReviewStage.values()[review.getStage().ordinal() + 1]
                );
            }

        } else {

            card.incrementNotRememberedCount();
            review.setStage(ReviewStage.ONE_DAY);
        }

        review.setNextReviewDate(
                LocalDate.now().plusDays(
                        review.getStage().getIntervalDays()
                )
        );

        review.setRevealedAt(null);

        reviewRepository.save(review);
        cardRepository.save(card);
    }
}
