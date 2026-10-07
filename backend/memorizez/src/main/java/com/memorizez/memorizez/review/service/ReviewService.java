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
import com.memorizez.memorizez.review.ReviewSession;
import com.memorizez.memorizez.review.ReviewStage;
import com.memorizez.memorizez.review.dto.*;
import com.memorizez.memorizez.review.exception.CardNotAvailableForReviewException;
import com.memorizez.memorizez.review.exception.CardNotRevealedException;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
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
    private final HistoryRepository historyRepository;
    private final HttpSession httpSession;

    private static final String REVIEW_SESSION_ATTRIBUTE =
            "memorizezReviewSession";

    public ReviewService(
            ReviewRepository reviewRepository,
            CardRepository cardRepository,
            CollectionRepository collectionRepository,
            UserRepository userRepository,
            HistoryRepository historyRepository, HttpSession httpSession) {
        this.reviewRepository = reviewRepository;
        this.cardRepository = cardRepository;
        this.collectionRepository = collectionRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.httpSession = httpSession;
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

        ReviewSession reviewSession =
                (ReviewSession) httpSession.getAttribute(
                        REVIEW_SESSION_ATTRIBUTE
                );

        if (reviewSession == null
                || !collectionId.equals(reviewSession.getCollectionId())
                || reviewSession.getCardIds().isEmpty()
                || !cardId.equals(reviewSession.getCurrentCardId())) {

            throw new CardNotAvailableForReviewException(
                    "Card is not part of the active review session"
            );
        }

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
                        new CollectionNotFoundException(
                                "Collection not found"
                        ));

        ReviewSession reviewSession =
                (ReviewSession) httpSession.getAttribute(
                        REVIEW_SESSION_ATTRIBUTE
                );

        if (reviewSession == null
                || !collectionId.equals(reviewSession.getCollectionId())
                || reviewSession.getCardIds().isEmpty()
                || !cardId.equals(reviewSession.getCurrentCardId())) {

            throw new CardNotAvailableForReviewException(
                    "Card is not part of the active review session"
            );
        }

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
                LocalDate.now().plusDays(
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
                        LocalDateTime.now()
                )
        );

        reviewRepository.save(review);
        cardRepository.save(card);

        reviewSession.advance();

        ReviewProgressResponse progress =
                new ReviewProgressResponse(
                        reviewSession.getCompletedCards(),
                        reviewSession.getTotalCards(),
                        reviewSession.getPercentage()
                );

        if (reviewSession.getCurrentIndex()
                >= reviewSession.getTotalCards()) {

            httpSession.removeAttribute(
                    REVIEW_SESSION_ATTRIBUTE
            );

            return new ReviewResultResponse(
                    true,
                    null,
                    progress
            );
        }

        String nextCardId =
                reviewSession.getCurrentCardId();

        Card nextCard = cardRepository
                .findByIdAndCollection(
                        nextCardId,
                        collection
                )
                .orElseThrow(() ->
                        new CardNotFoundException("Card not found"));

        Review nextReview = reviewRepository
                .findByCard(nextCard)
                .orElse(null);

        ReviewResponse nextCardResponse = new ReviewResponse(
                nextCard.getId(),
                nextCard.getFront(),
                null,
                null,
                nextReview != null ? nextReview.getStage() : null,
                nextReview != null
                        ? nextReview.getNextReviewDate()
                        : null,
                null
        );

        return new ReviewResultResponse(
                false,
                nextCardResponse,
                progress
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
                LocalDate.now()
        );

        if (cards.isEmpty()) {
            throw new CardNotAvailableForReviewException(
                    "No cards available for review"
            );
        }

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        cards.stream()
                                .map(Card::getId)
                                .toList()
                );

        httpSession.setAttribute(
                REVIEW_SESSION_ATTRIBUTE,
                reviewSession
        );

        Card firstCard = cards.get(0);

        Review review = reviewRepository
                .findByCard(firstCard)
                .orElse(null);

        ReviewProgressResponse progress =
                new ReviewProgressResponse(
                        0,
                        reviewSession.getTotalCards(),
                        0
                );

        return new ReviewResponse(
                firstCard.getId(),
                firstCard.getFront(),
                null,
                null,
                review != null ? review.getStage() : null,
                review != null
                        ? review.getNextReviewDate()
                        : null,
                progress
        );
    }

    public List<ReviewCollectionResponse> findCollectionsForReview(
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UserNotFoundException("User not found"));

        LocalDate today = LocalDate.now();

        return collectionRepository
                .findAllByUserOrderByCreatedAtDesc(user)
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
