package com.memorizez.memorizez.review.service;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.card.exception.CardNotFoundException;
import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.exception.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.history.History;
import com.memorizez.memorizez.history.HistoryAction;
import com.memorizez.memorizez.history.repository.HistoryRepository;
import com.memorizez.memorizez.review.Review;
import com.memorizez.memorizez.review.ReviewResult;
import com.memorizez.memorizez.review.ReviewStage;
import com.memorizez.memorizez.review.dto.*;
import com.memorizez.memorizez.review.exception.CardNotAvailableForReviewException;
import com.memorizez.memorizez.review.exception.CardNotRevealedException;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.time.AppTime;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CardRepository cardRepository;
    private final CollectionRepository collectionRepository;
    private final UserRepository userRepository;
    private final HistoryRepository historyRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            CardRepository cardRepository,
            CollectionRepository collectionRepository,
            UserRepository userRepository,
            HistoryRepository historyRepository) {

        this.reviewRepository = reviewRepository;
        this.cardRepository = cardRepository;
        this.collectionRepository = collectionRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
    }

    public List<ReviewResponse> findAvailableForReview(
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UserNotFoundException("User not found"));

        List<Card> cards = cardRepository.findAvailableForReview(
                user,
                AppTime.today()
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
                                    : null,
                            null
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

        LocalDate today = AppTime.today();

        if (review != null
                && review.getStage() != null
                && review.getNextReviewDate() != null
                && review.getNextReviewDate().isAfter(today)) {

            throw new CardNotAvailableForReviewException(
                    "Card is not available for review"
            );
        }

        if (review == null) {
            review = new Review();
            review.setCard(card);
        }

        review.setRevealedAt(AppTime.now());

        reviewRepository.save(review);

        return new ReviewResponse(
                card.getId(),
                card.getFront(),
                card.getBack(),
                card.getNotes(),
                review.getStage(),
                review.getNextReviewDate(),
                null
        );
    }

    @Transactional
    public ReviewResultResponse submitResult(
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
                        new CollectionNotFoundException("Collection not found"));

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
            } else {
                review.setStage(review.getStage().next());
            }

        } else {

            card.incrementNotRememberedCount();
            review.setStage(ReviewStage.ONE_DAY);
        }

        review.setNextReviewDate(
                AppTime.today().plusDays(
                        review.getStage().getIntervalDays()
                )
        );

        review.setRevealedAt(null);

        HistoryAction action =
                request.getResult() == ReviewResult.REMEMBERED
                        ? HistoryAction.REMEMBERED
                        : HistoryAction.NOT_REMEMBERED;

        historyRepository.save(
                new History(
                        null,
                        card,
                        action,
                        AppTime.now()
                )
        );

        reviewRepository.save(review);
        cardRepository.save(card);

        List<Card> nextAvailableCards =
                cardRepository.findAvailableForReviewByCollection(
                        collection,
                        AppTime.today()
                );

        if (nextAvailableCards.isEmpty()) {
            return new ReviewResultResponse(
                    true,
                    null,
                    null
            );
        }

        Card nextCard = nextAvailableCards.get(0);

        Review nextReview = reviewRepository
                .findByCard(nextCard)
                .orElse(null);

        ReviewResponse nextCardResponse = new ReviewResponse(
                nextCard.getId(),
                nextCard.getFront(),
                null,
                null,
                nextReview != null ? nextReview.getStage() : null,
                nextReview != null ? nextReview.getNextReviewDate() : null,
                null
        );

        return new ReviewResultResponse(
                false,
                nextCardResponse,
                null
        );
    }


    public ReviewResponse startReview(
            String collectionId,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(collectionId, user)
                .orElseThrow(() ->
                        new CollectionNotFoundException("Collection not found"));

        List<Card> cards = cardRepository.findAvailableForReviewByCollection(
                collection,
                AppTime.today()
        );

        if (cards.isEmpty()) {
            throw new CardNotAvailableForReviewException(
                    "No cards available for review"
            );
        }

        Card firstCard = cards.get(0);

        Review review = reviewRepository
                .findByCard(firstCard)
                .orElse(null);

        ReviewProgressResponse progress = new ReviewProgressResponse(
                0,
                cards.size(),
                0
        );

        return new ReviewResponse(
                firstCard.getId(),
                firstCard.getFront(),
                null,
                null,
                review != null ? review.getStage() : null,
                review != null ? review.getNextReviewDate() : null,
                progress
        );
    }


    public List<ReviewCollectionResponse> findCollectionsForReview(
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UserNotFoundException("User not found"));

        LocalDate today = AppTime.today();

        return collectionRepository
                .findAllByUserOrderByCreatedAtDescIdDesc(user)
                .stream()
                .map(collection -> {

                    long availableCardCount =
                            cardRepository
                                    .findAvailableForReviewByCollection(
                                            collection,
                                            today
                                    )
                                    .size();

                    return new ReviewCollectionResponse(
                            collection.getId(),
                            collection.getName(),
                            availableCardCount
                    );
                })
                .toList();
    }

}
