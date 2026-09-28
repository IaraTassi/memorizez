package com.memorizez.memorizez.card.service;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.card.dto.CardResponse;
import com.memorizez.memorizez.card.dto.CreateCardRequest;
import com.memorizez.memorizez.card.dto.UpdateCardRequest;
import com.memorizez.memorizez.card.exception.CardNotFoundException;
import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.exeption.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.review.Review;
import com.memorizez.memorizez.review.ReviewStage;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class CardService {

    private final CardRepository cardRepository;
    private final CollectionRepository collectionRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public CardService(
            CardRepository cardRepository,
            CollectionRepository collectionRepository,
            UserRepository userRepository,
            ReviewRepository reviewRepository) {

        this.cardRepository = cardRepository;
        this.collectionRepository = collectionRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
    }

    public void create(
            String collectionId,
            CreateCardRequest request,
            Authentication authentication) {

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(collectionId, user)
                .orElseThrow(() -> new CollectionNotFoundException("Collection not found"));

        Card card = new Card();

        card.setFront(request.getFront());
        card.setBack(request.getBack());
        card.setNotes(request.getNotes());
        card.setCollection(collection);

        cardRepository.save(card);

    }

    public Page<CardResponse> findAll(
            String collectionId,
            Pageable pageable,
            Authentication authentication) {

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new  UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(collectionId, user)
                .orElseThrow(() -> new CollectionNotFoundException("Collection not found"));

        return cardRepository
                .findAllByCollectionOrderByFrontAsc(collection, pageable)
                .map(card -> new CardResponse(
                        card.getId(),
                        card.getFront(),
                        card.getBack(),
                        card.getNotes(),
                        card.getCreatedAt(),
                        card.getRememberedCount(),
                        card.getNotRememberedCount(),
                        card.getEditCount())

        );
    }

    @Transactional
    public void update(
            String collectionId,
            String cardId,
            UpdateCardRequest request,
            Authentication authentication) {

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(collectionId, user)
                .orElseThrow(() ->
                        new CollectionNotFoundException("Collection not found"));

        Card card = cardRepository
                .findByIdAndCollection(cardId, collection)
                .orElseThrow(() ->
                        new CardNotFoundException("Card not found"));

        card.setFront(request.getFront());
        card.setBack(request.getBack());
        card.setNotes(request.getNotes());
        card.incrementEditCount();

        Review review = reviewRepository
                .findByCard(card)
                .orElse(null);

        if (review != null) {
            review.setRevealedAt(null);

            if (review.getStage() != null) {
                review.setStage(ReviewStage.ONE_DAY);
                review.setNextReviewDate(
                        LocalDate.now().plusDays(
                                ReviewStage.ONE_DAY.getIntervalDays()
                        )
                );
            }

            reviewRepository.save(review);
        }

        cardRepository.save(card);
    }

    @Transactional
    public void delete(
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

        reviewRepository.findByCard(card)
                .ifPresent(reviewRepository::delete);

        cardRepository.delete(card);
    }

}
