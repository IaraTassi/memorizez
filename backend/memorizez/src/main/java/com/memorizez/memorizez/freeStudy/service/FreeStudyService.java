package com.memorizez.memorizez.freeStudy.service;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.card.exception.CardNotFoundException;
import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.exeption.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.freeStudy.dto.FreeStudyResponse;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FreeStudyService {

    private final UserRepository userRepository;
    private final CollectionRepository collectionRepository;
    private final CardRepository cardRepository;

    public FreeStudyService(
            UserRepository userRepository,
            CollectionRepository collectionRepository,
            CardRepository cardRepository) {
        this.userRepository = userRepository;
        this.collectionRepository = collectionRepository;
        this.cardRepository = cardRepository;
    }

    public Optional<FreeStudyResponse> findFirstCard(
            String collectionId,
            Authentication authentication) {

        User user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(collectionId, user)
                .orElseThrow(() ->
                        new CollectionNotFoundException("Collection not found"));

        List<Card> cards =
                cardRepository
                        .findAllByCollectionOrderByCreatedAtAsc(collection);

        if (cards.isEmpty()) {
            return Optional.empty();
        }

        Card card = cards.get(0);

        return Optional.of(
                new FreeStudyResponse(
                        card.getId(),
                        collection.getId(),
                        card.getFront(),
                        null,
                        null
                )
        );
    }

    public FreeStudyResponse freeBack(
            String collectionId,
            String cardId,
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

        return new FreeStudyResponse(
                card.getId(),
                collection.getId(),
                card.getFront(),
                card.getBack(),
                card.getNotes()
        );
    }

    public Optional<FreeStudyResponse> freeNext(
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

        Card currentCard = cardRepository
                .findByIdAndCollection(cardId, collection)
                .orElseThrow(() ->
                        new CardNotFoundException("Card not found"));

        List<Card> cards =
                cardRepository.findAllByCollectionOrderByCreatedAtAsc(collection);

        int currentIndex = -1;

        for (int i = 0; i < cards.size(); i++) {
            if (cards.get(i).getId().equals(currentCard.getId())) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex < cards.size() - 1) {

            Card nextCard = cards.get(currentIndex + 1);

            return Optional.of(
                    new FreeStudyResponse(
                            nextCard.getId(),
                            collection.getId(),
                            nextCard.getFront(),
                            null,
                            null
                    )
            );
        }

        return Optional.empty();
    }

}
