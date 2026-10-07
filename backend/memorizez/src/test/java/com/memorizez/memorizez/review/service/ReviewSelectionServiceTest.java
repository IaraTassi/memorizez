package com.memorizez.memorizez.review.service;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.exception.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.history.History;
import com.memorizez.memorizez.history.repository.HistoryRepository;
import com.memorizez.memorizez.review.Review;
import com.memorizez.memorizez.review.ReviewSession;
import com.memorizez.memorizez.review.ReviewStage;
import com.memorizez.memorizez.review.dto.ReviewCollectionResponse;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.never;

public class ReviewSelectionServiceTest {

    @Test
    void shouldFindAvailableCardsForReviewSuccessfully() {
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

        Card card1 = new Card();
        card1.setFront("What is encapsulation?");
        card1.setBack("O que é encapsulamento");
        card1.setNotes("Princípio da POO.");
        card1.setCollection(collection);

        Card card2 = new Card();
        card2.setFront("What is inheritance?");
        card2.setBack("O que é herança");
        card2.setNotes("Inheritance allows reuse.");
        card2.setCollection(collection);

        Review review1 = new Review();
        review1.setCard(card1);
        review1.setStage(ReviewStage.ONE_DAY);
        review1.setNextReviewDate(LocalDate.now());

        Review review2 = new Review();
        review2.setCard(card2);
        review2.setStage(ReviewStage.SEVEN_DAYS);
        review2.setNextReviewDate(LocalDate.now());

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(cardRepository.findAvailableForReview(
                user,
                LocalDate.now()))
                .thenReturn(List.of(card1, card2));

        when(reviewRepository.findByCard(card1))
                .thenReturn(Optional.of(review1));

        when(reviewRepository.findByCard(card2))
                .thenReturn(Optional.of(review2));

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        List<ReviewResponse> response =
                service.findAvailableForReview(authentication);

        assertEquals(2, response.size());

        assertEquals(
                card1.getId(),
                response.get(0).getCardId()
        );

        assertEquals(
                ReviewStage.ONE_DAY,
                response.get(0).getStage()
        );

        assertEquals(
                LocalDate.now(),
                response.get(0).getNextReviewDate()
        );

        assertEquals(
                card2.getId(),
                response.get(1).getCardId()
        );

        assertEquals(
                ReviewStage.SEVEN_DAYS,
                response.get(1).getStage()
        );
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindAvailableForReview() {
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
                () -> service.findAvailableForReview(authentication)
        );

        verify(cardRepository, never())
                .findAvailableForReview(any(User.class), any(LocalDate.class));

        verify(reviewRepository, never())
                .findByCard(any(Card.class));
    }

    @Test
    void shouldStartReviewSuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        HttpSession httpSession = mock(HttpSession.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        String collectionId = "collection-1";

        Collection collection = new Collection();
        collection.setName("POO");
        collection.setUser(user);

        Card card1 = mock(Card.class);
        Card card2 = mock(Card.class);

        when(card1.getId()).thenReturn("card-1");
        when(card1.getFront()).thenReturn("What is encapsulation?");

        when(card2.getId()).thenReturn("card-2");
        when(card2.getFront()).thenReturn("What is inheritance?");

        when(card1.getCollection()).thenReturn(collection);
        when(card2.getCollection()).thenReturn(collection);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        when(cardRepository.findAvailableForReviewByCollection(
                collection,
                LocalDate.now()
        )).thenReturn(List.of(card1, card2));

        when(reviewRepository.findByCard(card1))
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
                service.startReview(
                        collectionId,
                        authentication
                );

        ArgumentCaptor<ReviewSession> sessionCaptor =
                ArgumentCaptor.forClass(ReviewSession.class);

        verify(httpSession)
                .setAttribute(
                        eq("memorizezReviewSession"),
                        sessionCaptor.capture()
                );

        ReviewSession session = sessionCaptor.getValue();

        assertEquals(collectionId, session.getCollectionId());
        assertEquals(List.of(card1.getId(), card2.getId()), session.getCardIds());
        assertEquals(0, session.getCurrentIndex());

        assertEquals(
                card1.getId(),
                response.getCardId()
        );

        assertEquals(
                card1.getFront(),
                response.getFront()
        );

        assertNull(response.getBack());
        assertNull(response.getNotes());

        assertNotNull(response.getProgress());

        assertEquals(
                0,
                response.getProgress().getCompletedCards()
        );

        assertEquals(
                2,
                response.getProgress().getTotalCards()
        );

        assertEquals(
                0,
                response.getProgress().getPercentage()
        );

        verify(reviewRepository)
                .findByCard(card1);

        verify(reviewRepository, never())
                .save(any(Review.class));

        verify(historyRepository, never())
                .save(any(History.class));
    }

    @Test
    void shouldThrowExceptionWhenNoCardsAreAvailableInStartReview() {
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

        String collectionId = "collection-1";

        Collection collection = new Collection();
        collection.setName("POO");
        collection.setUser(user);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        when(cardRepository.findAvailableForReviewByCollection(
                collection,
                LocalDate.now()
        )).thenReturn(List.of());

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
                () -> service.startReview(
                        collectionId,
                        authentication
                )
        );

        verify(httpSession, never())
                .setAttribute(anyString(), any());

        verify(reviewRepository, never())
                .findByCard(any(Card.class));

        verify(historyRepository, never())
                .save(any(History.class));
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInStartReview() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);
        HttpSession httpSession = mock(HttpSession.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
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
                UserNotFoundException.class,
                () -> service.startReview(
                        "collection-1",
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("unknown@memorizez.com");

        verifyNoInteractions(
                collectionRepository,
                cardRepository,
                reviewRepository,
                historyRepository,
                httpSession
        );
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInStartReview() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);
        HttpSession httpSession = mock(HttpSession.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                "collection-1",
                user
        )).thenReturn(Optional.empty());

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
                () -> service.startReview(
                        "collection-1",
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        "collection-1",
                        user
                );

        verifyNoInteractions(
                cardRepository,
                reviewRepository,
                historyRepository,
                httpSession
        );
    }

    @Test
    void shouldFindCollectionsForReviewSuccessfully() {

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

        Collection collection1 = new Collection();
        collection1.setName("POO");
        collection1.setUser(user);

        Collection collection2 = new Collection();
        collection2.setName("Inglês");
        collection2.setUser(user);

        Card card1 = mock(Card.class);
        Card card2 = mock(Card.class);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findAllByUserOrderByCreatedAtDesc(user))
                .thenReturn(List.of(collection1, collection2));

        when(cardRepository.findAvailableForReviewByCollection(
                collection1,
                LocalDate.now()
        )).thenReturn(List.of(card1, card2));

        when(cardRepository.findAvailableForReviewByCollection(
                collection2,
                LocalDate.now()
        )).thenReturn(List.of(card1));

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        List<ReviewCollectionResponse> response =
                service.findCollectionsForReview(authentication);

        assertEquals(
                2,
                response.size()
        );

        assertEquals(
                "POO",
                response.get(0).getName()
        );

        assertEquals(
                2,
                response.get(0).getAvailableCardCount()
        );

        assertEquals(
                "Inglês",
                response.get(1).getName()
        );

        assertEquals(
                1,
                response.get(1).getAvailableCardCount()
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findAllByUserOrderByCreatedAtDesc(user);

        verify(cardRepository)
                .findAvailableForReviewByCollection(
                        collection1,
                        LocalDate.now()
                );

        verify(cardRepository)
                .findAvailableForReviewByCollection(
                        collection2,
                        LocalDate.now()
                );

        verifyNoInteractions(
                reviewRepository,
                historyRepository,
                httpSession
        );
    }

    @Test
    void shouldReturnEmptyListWhenUserHasNoCollectionsForReview() {
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

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findAllByUserOrderByCreatedAtDesc(user))
                .thenReturn(List.of());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        List<ReviewCollectionResponse> response =
                service.findCollectionsForReview(authentication);

        assertTrue(response.isEmpty());

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findAllByUserOrderByCreatedAtDesc(user);

        verifyNoInteractions(
                cardRepository,
                reviewRepository,
                historyRepository,
                httpSession
        );
    }

    @Test
    void shouldReturnCollectionWithZeroAvailableCardsForReview() {

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
        collection.setName("Java");
        collection.setUser(user);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findAllByUserOrderByCreatedAtDesc(user))
                .thenReturn(List.of(collection));

        when(cardRepository.findAvailableForReviewByCollection(
                collection,
                LocalDate.now()
        )).thenReturn(List.of());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        List<ReviewCollectionResponse> response =
                service.findCollectionsForReview(authentication);

        assertEquals(
                1,
                response.size()
        );

        assertEquals(
                "Java",
                response.get(0).getName()
        );

        assertEquals(
                0,
                response.get(0).getAvailableCardCount()
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findAllByUserOrderByCreatedAtDesc(user);

        verify(cardRepository)
                .findAvailableForReviewByCollection(
                        collection,
                        LocalDate.now()
                );

        verifyNoInteractions(
                reviewRepository,
                historyRepository,
                httpSession
        );
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindCollectionsForReview() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        Authentication authentication = mock(Authentication.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        HttpSession httpSession = mock(HttpSession.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail(
                "unknown@memorizez.com"
        )).thenReturn(Optional.empty());

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
                () -> service.findCollectionsForReview(authentication)
        );

        verify(userRepository)
                .findByEmail("unknown@memorizez.com");

        verify(collectionRepository, never())
                .findAllByUserOrderByCreatedAtDesc(any(User.class));

        verify(cardRepository, never())
                .findAvailableForReviewByCollection(
                        any(Collection.class),
                        any(LocalDate.class)
                );

        verifyNoInteractions(
                reviewRepository,
                historyRepository,
                httpSession
        );
    }

}
