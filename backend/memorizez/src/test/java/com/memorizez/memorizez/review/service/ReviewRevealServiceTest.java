package com.memorizez.memorizez.review.service;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.card.exception.CardNotFoundException;
import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.exception.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.history.History;
import com.memorizez.memorizez.history.repository.HistoryRepository;
import com.memorizez.memorizez.review.Review;
import com.memorizez.memorizez.review.ReviewSession;
import com.memorizez.memorizez.review.ReviewStage;
import com.memorizez.memorizez.review.dto.ReviewResponse;
import com.memorizez.memorizez.review.exception.CardNotAvailableForReviewException;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.verify;

public class ReviewRevealServiceTest {

    @Test
    void shouldRevealNewCardSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        Authentication authentication = mock(Authentication.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        HttpSession httpSession = mock(HttpSession.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        Card card = new Card();
        card.setFront("What is encapsulation?");
        card.setBack("O que é encapsulamento");
        card.setNotes("Princípio da POO.");
        card.setCollection(collection);

        String collectionId = "collection-1";
        String cardId = "card-1";

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId)
                );

        when(httpSession.getAttribute("memorizezReviewSession"))
                .thenReturn(reviewSession);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(cardId, collection))
                .thenReturn(Optional.of(card));

        when(reviewRepository.findByCard(card))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        ReviewResponse response =
                service.reveal(
                        collectionId,
                        cardId,
                        authentication
                );

        ArgumentCaptor<Review> captor =
                ArgumentCaptor.forClass(Review.class);

        verify(reviewRepository)
                .save(captor.capture());

        Review savedReview = captor.getValue();

        assertEquals(card, savedReview.getCard());
        assertNotNull(savedReview.getRevealedAt());

        assertEquals(card.getId(), response.getCardId());
        assertEquals(card.getFront(), response.getFront());
        assertEquals(card.getBack(), response.getBack());
        assertEquals(card.getNotes(), response.getNotes());
        assertNull(response.getStage());
        assertNull(response.getNextReviewDate());
        assertNull(response.getProgress());
        verify(historyRepository, never())
                .save(any(History.class));
    }

    @Test
    void shouldRevealExistingReviewSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        Authentication authentication = mock(Authentication.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        HttpSession httpSession = mock(HttpSession.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        String collectionId = "collection-1";
        String cardId = "card-1";

        Card card = new Card();
        card.setFront("What is inheritance?");
        card.setBack("O que é herança");
        card.setNotes("Inheritance allows reuse.");
        card.setCollection(collection);

        Review review = new Review();
        review.setCard(card);
        review.setStage(ReviewStage.SEVEN_DAYS);
        review.setNextReviewDate(LocalDate.now());
        review.setRevealedAt(null);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId)
                );

        when(httpSession.getAttribute("memorizezReviewSession"))
                .thenReturn(reviewSession);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(cardId, collection))
                .thenReturn(Optional.of(card));

        when(reviewRepository.findByCard(card))
                .thenReturn(Optional.of(review));

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        ReviewResponse response =
                service.reveal(
                        collectionId,
                        cardId,
                        authentication
                );

        verify(reviewRepository)
                .findByCard(card);

        verify(reviewRepository)
                .save(review);

        assertNotNull(review.getRevealedAt());

        assertEquals(
                ReviewStage.SEVEN_DAYS,
                review.getStage()
        );

        assertEquals(
                LocalDate.now(),
                review.getNextReviewDate()
        );

        assertEquals(card.getId(), response.getCardId());
        assertEquals(card.getFront(), response.getFront());
        assertEquals(card.getBack(), response.getBack());
        assertEquals(card.getNotes(), response.getNotes());

        assertEquals(
                ReviewStage.SEVEN_DAYS,
                response.getStage()
        );

        assertEquals(
                LocalDate.now(),
                response.getNextReviewDate()
        );

        assertNull(response.getProgress());

        verify(historyRepository, never())
                .save(any(History.class));
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotCurrentCardInReviewSession() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        Authentication authentication = mock(Authentication.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        HttpSession httpSession = mock(HttpSession.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        String collectionId = "collection-1";
        String currentCardId = "card-1";
        String requestedCardId = "card-2";

        Card card = new Card();
        card.setFront("What is inheritance?");
        card.setBack("O que é herança");
        card.setNotes("Inheritance allows reuse.");
        card.setCollection(collection);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(currentCardId, requestedCardId)
                );

        when(httpSession.getAttribute("memorizezReviewSession"))
                .thenReturn(reviewSession);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(
                requestedCardId,
                collection
        )).thenReturn(Optional.of(card));

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        assertThrows(
                CardNotAvailableForReviewException.class,
                () -> service.reveal(
                        collectionId,
                        requestedCardId,
                        authentication
                )
        );

        verify(cardRepository)
                .findByIdAndCollection(
                        requestedCardId,
                        collection
                );

        verify(reviewRepository, never())
                .findByCard(any(Card.class));

        verify(reviewRepository, never())
                .save(any(Review.class));

        verify(historyRepository, never())
                .save(any(History.class));
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotAvailableForReview() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        Authentication authentication = mock(Authentication.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        HttpSession httpSession = mock(HttpSession.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        String collectionId = "collection-1";
        String cardId = "card-1";

        Card card = new Card();
        card.setFront("What is encapsulation?");
        card.setBack("O que é encapsulamento");
        card.setNotes("Princípio da POO.");
        card.setCollection(collection);

        Review review = new Review();
        review.setCard(card);
        review.setStage(ReviewStage.SEVEN_DAYS);
        review.setNextReviewDate(LocalDate.now().plusDays(7));
        review.setRevealedAt(null);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId)
                );

        when(httpSession.getAttribute("memorizezReviewSession"))
                .thenReturn(reviewSession);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(cardId, collection))
                .thenReturn(Optional.of(card));

        when(reviewRepository.findByCard(card))
                .thenReturn(Optional.of(review));

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        assertThrows(
                CardNotAvailableForReviewException.class,
                () -> service.reveal(
                        collectionId,
                        cardId,
                        authentication
                )
        );

        verify(reviewRepository)
                .findByCard(card);

        verify(reviewRepository, never())
                .save(any(Review.class));

    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInReveal() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        HttpSession httpSession = mock(HttpSession.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        String collectionId = "collection-1";
        String cardId = "card-1";

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.reveal(
                        collectionId,
                        cardId,
                        authentication
                )
        );

        verify(collectionRepository, never())
                .findByIdAndUser(anyString(), any());

        verify(cardRepository, never())
                .findByIdAndCollection(anyString(), any());

    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInReveal() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        HttpSession httpSession = mock(HttpSession.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        String collectionId = "collection-1";
        String cardId = "card-1";

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.reveal(
                        collectionId,
                        cardId,
                        authentication
                )
        );

        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

        verify(cardRepository, never())
                .findByIdAndCollection(anyString(), any());

        verify(reviewRepository, never())
                .findByCard(any(Card.class));

    }

    @Test
    void shouldThrowExceptionWhenCardIsNotFoundInReveal() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        HttpSession httpSession = mock(HttpSession.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        String collectionId = "collection-1";
        String cardId = "card-1";

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(cardId, collection))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        assertThrows(
                CardNotFoundException.class,
                () -> service.reveal(
                        collectionId,
                        cardId,
                        authentication
                )
        );

        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

        verify(cardRepository)
                .findByIdAndCollection(cardId, collection);
    }

}
