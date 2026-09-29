package com.memorizez.memorizez.collection.service;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.dto.CollectionResponse;
import com.memorizez.memorizez.collection.dto.CreateCollectionRequest;
import com.memorizez.memorizez.collection.dto.UpdateCollectionRequest;
import com.memorizez.memorizez.collection.exception.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final UserRepository userRepository;
    private final CardRepository cardRepository;
    private final ReviewRepository reviewRepository;

    public CollectionService(
            CollectionRepository collectionRepository,
            UserRepository userRepository, CardRepository cardRepository, ReviewRepository reviewRepository) {

        this.collectionRepository = collectionRepository;
        this.userRepository = userRepository;
        this.cardRepository = cardRepository;
        this.reviewRepository = reviewRepository;
    }

    public void create(
            CreateCollectionRequest request,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Collection collection = new Collection();

        collection.setName(request.getName());
        collection.setUser(user);

        collectionRepository.save(collection);
    }

    public List<CollectionResponse> findAll(Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName()).orElseThrow(() -> new UserNotFoundException("User not found"));

        return collectionRepository
                .findAllByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(collection -> new CollectionResponse(
                        collection.getId(),
                        collection.getName(),
                        collection.getCreatedAt(),
                        Math.toIntExact(
                                cardRepository.countByCollection(collection)
                        )
                ))
                .toList();
    }

    public void update(String id, UpdateCollectionRequest request, Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName()).orElseThrow(() -> new UserNotFoundException("User not found"));

        Collection collection = collectionRepository.findByIdAndUser(id, user).orElseThrow(() -> new CollectionNotFoundException("Collection not found"));

        collection.setName(request.getName());

        collectionRepository.save(collection);
    }

    @Transactional
    public void delete(
            String id,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        Collection collection = collectionRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new CollectionNotFoundException("Collection not found"));

        List<Card> cards = cardRepository.findAllByCollection(collection);

        for (Card card : cards) {
            reviewRepository.findByCard(card)
                    .ifPresent(reviewRepository::delete);

            cardRepository.delete(card);
        }

        collectionRepository.delete(collection);
    }
}
