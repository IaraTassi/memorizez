package com.memorizez.memorizez.history.service;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.card.exception.CardNotFoundException;
import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.exception.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.history.History;
import com.memorizez.memorizez.history.HistoryAction;
import com.memorizez.memorizez.history.dto.HistoryCardDetailResponse;
import com.memorizez.memorizez.history.dto.HistoryCardResponse;
import com.memorizez.memorizez.history.dto.HistoryCollectionResponse;
import com.memorizez.memorizez.history.dto.HistoryResponse;
import com.memorizez.memorizez.history.repository.HistoryRepository;
import com.memorizez.memorizez.review.Review;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class HistoryService {

    private final UserRepository userRepository;
    private final CollectionRepository collectionRepository;
    private final CardRepository cardRepository;
    private final ReviewRepository reviewRepository;
    private final HistoryRepository historyRepository;

    public HistoryService(
            UserRepository userRepository,
            CollectionRepository collectionRepository,
            CardRepository cardRepository,
            ReviewRepository reviewRepository,
            HistoryRepository historyRepository
    ) {
        this.userRepository = userRepository;
        this.collectionRepository = collectionRepository;
        this.cardRepository = cardRepository;
        this.reviewRepository = reviewRepository;
        this.historyRepository = historyRepository;
    }

    public List<HistoryCollectionResponse> findAllCollections(
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        List<Collection> collections =
                collectionRepository.findAllByUserOrderByCreatedAtDesc(user);

        return collections.stream()
                .map(collection -> new HistoryCollectionResponse(
                        collection.getId(),
                        collection.getName(),
                        cardRepository.countByCollection(collection)
                ))
                .toList();
    }

    public Page<HistoryCardResponse> findAllCards(
            Authentication authentication,
            String collectionId,
            Pageable pageable
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(collectionId, user)
                .orElseThrow(() -> new CollectionNotFoundException("Collection not found"));

        return cardRepository
                .findAllByCollectionOrderByFrontAsc(collection, pageable)
                .map(card -> new HistoryCardResponse(
                        card.getId(),
                        card.getFront(),
                        card.getRememberedCount(),
                        card.getNotRememberedCount(),
                        card.getEditCount()
                ));
    }

    public HistoryCardDetailResponse findCard(
            Authentication authentication,
            String collectionId,
            String cardId
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(collectionId, user)
                .orElseThrow(() -> new CollectionNotFoundException("Collection not found"));

        Card card = cardRepository
                .findByIdAndCollection(cardId, collection)
                .orElseThrow(() -> new CardNotFoundException("Card not found"));

        Review review = reviewRepository
                .findByCard(card)
                .orElse(null);

        return new HistoryCardDetailResponse(
                card.getId(),
                card.getFront(),
                card.getRememberedCount(),
                card.getNotRememberedCount(),
                card.getEditCount(),
                card.getCreatedAt(),
                review != null ? review.getNextReviewDate() : null
        );
    }

    public Page<HistoryResponse> findHistory(
            Authentication authentication,
            String collectionId,
            String cardId,
            Pageable pageable
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(collectionId, user)
                .orElseThrow(() -> new CollectionNotFoundException("Collection not found"));

        Card card = cardRepository
                .findByIdAndCollection(cardId, collection)
                .orElseThrow(() -> new CardNotFoundException("Card not found"));

        Page<History> historyPage =
                historyRepository
                        .findByCardIdOrderByCreatedAtDesc(
                                card.getId(),
                                pageable
                        );

        List<HistoryResponse> content =
                new ArrayList<>(
                        historyPage
                                .map(history -> new HistoryResponse(
                                        history.getAction(),
                                        history.getCreatedAt()
                                ))
                                .getContent()
                );

        long totalElements =
                historyPage.getTotalElements() + 1;

        int lastPage =
                (int) Math.ceil(
                        (double) totalElements / pageable.getPageSize()
                ) - 1;

        if (pageable.getPageNumber() == lastPage) {

            content.add(
                    new HistoryResponse(
                            HistoryAction.CREATED,
                            card.getCreatedAt().atStartOfDay()
                    )
            );
        }

        return new PageImpl<>(
                content,
                pageable,
                totalElements
        );
    }

}