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
import com.memorizez.memorizez.review.dto.ReviewCollectionResponse;
import com.memorizez.memorizez.review.dto.ReviewResponse;
import com.memorizez.memorizez.review.dto.ReviewResultRequest;
import com.memorizez.memorizez.review.dto.ReviewResultResponse;
import com.memorizez.memorizez.review.exception.CardNotAvailableForReviewException;
import com.memorizez.memorizez.review.exception.CardNotRevealedException;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ReviewServiceTest {

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

    @Test
    void shouldThrowExceptionWhenReviewIsNotFoundInSubmitResult() {

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
        card.setCollection(collection);

        String collectionId = "collection-1";
        String cardId = "card-1";

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

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

        assertThrows(
                CardNotRevealedException.class,
                () -> service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                )
        );

        verify(httpSession)
                .getAttribute("memorizezReviewSession");

        verify(cardRepository)
                .findByIdAndCollection(
                        cardId,
                        collection
                );

        verify(reviewRepository)
                .findByCard(card);

        verify(reviewRepository, never())
                .save(any(Review.class));

        verify(cardRepository, never())
                .save(any(Card.class));

        verify(historyRepository, never())
                .save(any(History.class));
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotRevealedInSubmitResult() {

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
        card.setCollection(collection);

        Review review = new Review();
        review.setCard(card);
        review.setStage(ReviewStage.ONE_DAY);
        review.setNextReviewDate(LocalDate.now());
        review.setRevealedAt(null);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

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
                CardNotRevealedException.class,
                () -> service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                )
        );

        verify(httpSession)
                .getAttribute("memorizezReviewSession");

        verify(cardRepository)
                .findByIdAndCollection(
                        cardId,
                        collection
                );

        verify(reviewRepository)
                .findByCard(card);

        verify(reviewRepository, never())
                .save(any(Review.class));

        verify(cardRepository, never())
                .save(any(Card.class));

        verify(historyRepository, never())
                .save(any(History.class));
    }

    @Test
    void shouldProcessFirstRememberedResultSuccessfully() {

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
        String nextCardId = "card-2";

        Card card = new Card();
        card.setFront("What is encapsulation?");
        card.setBack("O que é encapsulamento");
        card.setNotes("Princípio da POO.");
        card.setCollection(collection);

        Review review = new Review();
        review.setCard(card);
        review.setStage(null);
        review.setNextReviewDate(null);
        review.setRevealedAt(LocalDateTime.now());

        Card nextCard = mock(Card.class);

        when(nextCard.getId())
                .thenReturn(nextCardId);

        when(nextCard.getFront())
                .thenReturn("What is inheritance?");

        when(nextCard.getCollection())
                .thenReturn(collection);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId, nextCardId)
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

        when(cardRepository.findByIdAndCollection(nextCardId, collection))
                .thenReturn(Optional.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
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

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        ArgumentCaptor<History> historyCaptor =
                ArgumentCaptor.forClass(History.class);

        verify(historyRepository)
                .save(historyCaptor.capture());

        History savedHistory = historyCaptor.getValue();

        assertEquals(
                HistoryAction.REMEMBERED,
                savedHistory.getAction()
        );

        assertEquals(1, card.getRememberedCount());
        assertEquals(0, card.getNotRememberedCount());

        assertEquals(
                ReviewStage.ONE_DAY,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(1),
                review.getNextReviewDate()
        );

        assertNull(review.getRevealedAt());

        assertEquals(
                1,
                reviewSession.getCurrentIndex()
        );

        assertFalse(response.isCompleted());
        assertNotNull(response.getNextCard());

        assertEquals(
                nextCard.getId(),
                response.getNextCard().getCardId()
        );

        assertEquals(
                "What is inheritance?",
                response.getNextCard().getFront()
        );

        assertNull(response.getNextCard().getBack());
        assertNull(response.getNextCard().getNotes());
        assertNotNull(response.getProgress());

        assertEquals(
                1,
                response.getProgress().getCompletedCards()
        );

        assertEquals(
                2,
                response.getProgress().getTotalCards()
        );

        assertEquals(
                50,
                response.getProgress().getPercentage()
        );

        verify(httpSession)
                .getAttribute("memorizezReviewSession");

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findByIdAndCollection(
                        nextCardId,
                        collection
                );

        verify(reviewRepository)
                .findByCard(nextCard);
    }

    @Test
    void shouldProcessFirstNotRememberedResultSuccessfully() {

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
        String nextCardId = "card-2";

        Card card = new Card();
        card.setFront("What is encapsulation?");
        card.setBack("O que é encapsulamento");
        card.setNotes("Princípio da POO.");
        card.setCollection(collection);

        Review review = new Review();
        review.setCard(card);
        review.setStage(null);
        review.setNextReviewDate(null);
        review.setRevealedAt(LocalDateTime.now());

        Card nextCard = mock(Card.class);

        when(nextCard.getId())
                .thenReturn(nextCardId);

        when(nextCard.getFront())
                .thenReturn("What is inheritance?");

        when(nextCard.getCollection())
                .thenReturn(collection);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.NOT_REMEMBERED);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId, nextCardId)
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

        when(cardRepository.findByIdAndCollection(nextCardId, collection))
                .thenReturn(Optional.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
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

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        ArgumentCaptor<History> historyCaptor =
                ArgumentCaptor.forClass(History.class);

        verify(historyRepository)
                .save(historyCaptor.capture());

        History savedHistory = historyCaptor.getValue();

        assertEquals(
                HistoryAction.NOT_REMEMBERED,
                savedHistory.getAction()
        );

        assertEquals(0, card.getRememberedCount());
        assertEquals(1, card.getNotRememberedCount());

        assertEquals(
                ReviewStage.ONE_DAY,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(1),
                review.getNextReviewDate()
        );

        assertNull(review.getRevealedAt());

        assertEquals(
                1,
                reviewSession.getCurrentIndex()
        );

        assertFalse(response.isCompleted());
        assertNotNull(response.getNextCard());

        assertEquals(
                nextCard.getId(),
                response.getNextCard().getCardId()
        );

        assertEquals(
                "What is inheritance?",
                response.getNextCard().getFront()
        );

        assertNull(response.getNextCard().getBack());
        assertNull(response.getNextCard().getNotes());

        assertNotNull(
                response.getProgress()
        );

        assertEquals(
                1,
                response.getProgress().getCompletedCards()
        );

        assertEquals(
                2,
                response.getProgress().getTotalCards()
        );

        assertEquals(
                50,
                response.getProgress().getPercentage()
        );

        verify(httpSession)
                .getAttribute("memorizezReviewSession");

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findByIdAndCollection(
                        nextCardId,
                        collection
                );

        verify(reviewRepository)
                .findByCard(nextCard);
    }

    @Test
    void shouldAdvanceFromOneDayToSevenDaysWhenUserRemembersCard() {

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
        String nextCardId = "card-2";

        Card card = new Card();
        card.setFront("What is encapsulation?");
        card.setBack("O que é encapsulamento");
        card.setNotes("Princípio da POO.");
        card.setCollection(collection);

        Review review = new Review();
        review.setCard(card);
        review.setStage(ReviewStage.ONE_DAY);
        review.setNextReviewDate(LocalDate.now().plusDays(1));
        review.setRevealedAt(LocalDateTime.now());

        Card nextCard = mock(Card.class);

        when(nextCard.getId())
                .thenReturn(nextCardId);

        when(nextCard.getFront())
                .thenReturn("What is inheritance?");

        when(nextCard.getCollection())
                .thenReturn(collection);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId, nextCardId)
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

        when(cardRepository.findByIdAndCollection(nextCardId, collection))
                .thenReturn(Optional.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
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

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        assertEquals(1, card.getRememberedCount());
        assertEquals(0, card.getNotRememberedCount());

        assertEquals(
                ReviewStage.SEVEN_DAYS,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(7),
                review.getNextReviewDate()
        );

        assertNull(review.getRevealedAt());

        assertEquals(
                1,
                reviewSession.getCurrentIndex()
        );

        assertFalse(response.isCompleted());
        assertNotNull(response.getNextCard());

        assertEquals(
                nextCard.getId(),
                response.getNextCard().getCardId()
        );

        assertEquals(
                nextCard.getFront(),
                response.getNextCard().getFront()
        );

        assertNull(response.getNextCard().getBack());
        assertNull(response.getNextCard().getNotes());

        assertNotNull(
                response.getProgress()
        );

        assertEquals(
                1,
                response.getProgress().getCompletedCards()
        );

        assertEquals(
                2,
                response.getProgress().getTotalCards()
        );

        assertEquals(
                50,
                response.getProgress().getPercentage()
        );

        verify(httpSession)
                .getAttribute("memorizezReviewSession");

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(historyRepository)
                .save(any(History.class));

        verify(cardRepository)
                .findByIdAndCollection(
                        nextCardId,
                        collection
                );

        verify(reviewRepository)
                .findByCard(nextCard);

    }

    @Test
    void shouldAdvanceFromSevenDaysToFifteenDaysWhenUserRemembersCard() {

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
        String nextCardId = "card-2";

        Card card = new Card();
        card.setFront("What is encapsulation?");
        card.setBack("O que é encapsulamento");
        card.setNotes("Princípio da POO.");
        card.setCollection(collection);

        Review review = new Review();
        review.setCard(card);
        review.setStage(ReviewStage.SEVEN_DAYS);
        review.setNextReviewDate(LocalDate.now().plusDays(1));
        review.setRevealedAt(LocalDateTime.now());

        Card nextCard = mock(Card.class);

        when(nextCard.getId())
                .thenReturn(nextCardId);

        when(nextCard.getFront())
                .thenReturn("What is inheritance?");

        when(nextCard.getCollection())
                .thenReturn(collection);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId, nextCardId)
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

        when(cardRepository.findByIdAndCollection(nextCardId, collection))
                .thenReturn(Optional.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
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

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        assertEquals(1, card.getRememberedCount());
        assertEquals(0, card.getNotRememberedCount());

        assertEquals(
                ReviewStage.FIFTEEN_DAYS,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(15),
                review.getNextReviewDate()
        );

        assertNull(review.getRevealedAt());

        assertEquals(
                1,
                reviewSession.getCurrentIndex()
        );

        assertFalse(response.isCompleted());
        assertNotNull(response.getNextCard());

        assertEquals(
                nextCard.getId(),
                response.getNextCard().getCardId()
        );

        assertEquals(
                "What is inheritance?",
                response.getNextCard().getFront()
        );


        assertNull(response.getNextCard().getBack());
        assertNull(response.getNextCard().getNotes());

        assertNotNull(
                response.getProgress()
        );

        assertEquals(
                1,
                response.getProgress().getCompletedCards()
        );

        assertEquals(
                2,
                response.getProgress().getTotalCards()
        );

        assertEquals(
                50,
                response.getProgress().getPercentage()
        );

        verify(httpSession)
                .getAttribute("memorizezReviewSession");

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(historyRepository)
                .save(any(History.class));

        verify(cardRepository)
                .findByIdAndCollection(
                        nextCardId,
                        collection
                );

        verify(reviewRepository)
                .findByCard(nextCard);
    }

    @Test
    void shouldAdvanceFromFifteenDaysToThirtyDaysWhenUserRemembersCard() {

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
        String nextCardId = "card-2";

        Card card = new Card();
        card.setFront("What is encapsulation?");
        card.setBack("O que é encapsulamento");
        card.setNotes("Princípio da POO.");
        card.setCollection(collection);

        Review review = new Review();
        review.setCard(card);
        review.setStage(ReviewStage.FIFTEEN_DAYS);
        review.setNextReviewDate(LocalDate.now().plusDays(1));
        review.setRevealedAt(LocalDateTime.now());

        Card nextCard = mock(Card.class);

        when(nextCard.getId())
                .thenReturn(nextCardId);

        when(nextCard.getFront())
                .thenReturn("What is inheritance?");

        when(nextCard.getCollection())
                .thenReturn(collection);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId, nextCardId)
                );

        when(httpSession.getAttribute(
                "memorizezReviewSession"
        )).thenReturn(reviewSession);

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

        when(cardRepository.findByIdAndCollection(nextCardId, collection))
                .thenReturn(Optional.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
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

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        assertEquals(1, card.getRememberedCount());
        assertEquals(0, card.getNotRememberedCount());

        assertEquals(
                ReviewStage.THIRTY_DAYS,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(30),
                review.getNextReviewDate()
        );

        assertNull(review.getRevealedAt());

        assertEquals(
                1,
                reviewSession.getCurrentIndex()
        );

        assertFalse(response.isCompleted());
        assertNotNull(response.getNextCard());

        assertEquals(
                nextCard.getId(),
                response.getNextCard().getCardId()
        );

        assertEquals(
                "What is inheritance?",
                response.getNextCard().getFront()
        );

        assertNull(response.getNextCard().getBack());
        assertNull(response.getNextCard().getNotes());

        assertNotNull(
                response.getProgress()
        );

        assertEquals(
                1,
                response.getProgress().getCompletedCards()
        );

        assertEquals(
                2,
                response.getProgress().getTotalCards()
        );

        assertEquals(
                50,
                response.getProgress().getPercentage()
        );

        verify(httpSession)
                .getAttribute("memorizezReviewSession");

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(historyRepository)
                .save(any(History.class));

        verify(cardRepository)
                .findByIdAndCollection(
                        nextCardId,
                        collection
                );

        verify(reviewRepository)
                .findByCard(nextCard);
    }

    @Test
    void shouldKeepThirtyDaysWhenUserRemembersCard() {

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
        String nextCardId = "card-2";

        Card card = new Card();
        card.setFront("What is encapsulation?");
        card.setBack("O que é encapsulamento");
        card.setNotes("Princípio da POO.");
        card.setCollection(collection);

        Review review = new Review();
        review.setCard(card);
        review.setStage(ReviewStage.THIRTY_DAYS);
        review.setNextReviewDate(LocalDate.now().plusDays(1));
        review.setRevealedAt(LocalDateTime.now());

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        Card nextCard = mock(Card.class);

        when(nextCard.getId())
                .thenReturn(nextCardId);

        when(nextCard.getFront())
                .thenReturn("What is inheritance?");

        when(nextCard.getCollection())
                .thenReturn(collection);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId, nextCardId)
                );

        when(httpSession.getAttribute(
                "memorizezReviewSession"
        )).thenReturn(reviewSession);

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

        when(cardRepository.findByIdAndCollection(nextCardId, collection))
                .thenReturn(Optional.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
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

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        assertEquals(1, card.getRememberedCount());
        assertEquals(0, card.getNotRememberedCount());

        assertEquals(
                ReviewStage.THIRTY_DAYS,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(30),
                review.getNextReviewDate()
        );

        assertNull(review.getRevealedAt());

        assertEquals(
                1,
                reviewSession.getCurrentIndex()
        );

        assertFalse(response.isCompleted());
        assertNotNull(response.getNextCard());

        assertEquals(
                nextCard.getId(),
                response.getNextCard().getCardId()
        );

        assertEquals(
                "What is inheritance?",
                response.getNextCard().getFront()
        );

        assertNull(response.getNextCard().getBack());
        assertNull(response.getNextCard().getNotes());

        assertNotNull(
                response.getProgress()
        );

        assertEquals(
                1,
                response.getProgress().getCompletedCards()
        );

        assertEquals(
                2,
                response.getProgress().getTotalCards()
        );

        assertEquals(
                50,
                response.getProgress().getPercentage()
        );

        verify(httpSession)
                .getAttribute("memorizezReviewSession");

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);


        verify(historyRepository)
                .save(any(History.class));

        verify(cardRepository)
                .findByIdAndCollection(
                        nextCardId,
                        collection
                );

        verify(reviewRepository)
                .findByCard(nextCard);

    }

    @Test
    void shouldResetToOneDayWhenUserDoesNotRememberCard() {

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
        String nextCardId = "card-2";

        Card card = new Card();
        card.setFront("What is encapsulation?");
        card.setBack("O que é encapsulamento");
        card.setNotes("Princípio da POO.");
        card.setCollection(collection);

        Review review = new Review();
        review.setCard(card);
        review.setStage(ReviewStage.FIFTEEN_DAYS);
        review.setNextReviewDate(LocalDate.now().plusDays(15));
        review.setRevealedAt(LocalDateTime.now());

        Card nextCard = mock(Card.class);

        when(nextCard.getId())
                .thenReturn(nextCardId);

        when(nextCard.getFront())
                .thenReturn("What is inheritance?");

        when(nextCard.getCollection())
                .thenReturn(collection);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.NOT_REMEMBERED);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId, nextCardId)
                );

        when(httpSession.getAttribute(
                "memorizezReviewSession"
        )).thenReturn(reviewSession);

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

        when(cardRepository.findByIdAndCollection(nextCardId, collection))
                .thenReturn(Optional.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
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

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        ArgumentCaptor<History> historyCaptor =
                ArgumentCaptor.forClass(History.class);

        verify(historyRepository)
                .save(historyCaptor.capture());

        History savedHistory = historyCaptor.getValue();

        assertEquals(
                HistoryAction.NOT_REMEMBERED,
                savedHistory.getAction()
        );

        assertEquals(0, card.getRememberedCount());
        assertEquals(1, card.getNotRememberedCount());

        assertEquals(
                ReviewStage.ONE_DAY,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(1),
                review.getNextReviewDate()
        );

        assertNull(review.getRevealedAt());

        assertEquals(
                1,
                reviewSession.getCurrentIndex()
        );

        assertFalse(response.isCompleted());
        assertNotNull(response.getNextCard());

        assertEquals(
                nextCard.getId(),
                response.getNextCard().getCardId()
        );

        assertEquals(
                "What is inheritance?",
                response.getNextCard().getFront()
        );

        assertNull(response.getNextCard().getBack());
        assertNull(response.getNextCard().getNotes());

        assertNotNull(
                response.getProgress()
        );

        assertEquals(
                1,
                response.getProgress().getCompletedCards()
        );

        assertEquals(
                2,
                response.getProgress().getTotalCards()
        );

        assertEquals(
                50,
                response.getProgress().getPercentage()
        );

        verify(httpSession)
                .getAttribute(
                        "memorizezReviewSession"
                );

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findByIdAndCollection(
                        nextCardId,
                        collection
                );

        verify(reviewRepository)
                .findByCard(nextCard);
    }

    @Test
    void shouldCompleteReviewWhenNoCardsAreAvailableAfterSubmittingResult() {

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
        review.setNextReviewDate(LocalDate.now());
        review.setRevealedAt(LocalDateTime.now());

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        ReviewSession reviewSession =
                new ReviewSession(
                        collectionId,
                        List.of(cardId)
                );

        when(httpSession.getAttribute(
                "memorizezReviewSession"
        )).thenReturn(reviewSession);

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

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        ArgumentCaptor<History> historyCaptor =
                ArgumentCaptor.forClass(History.class);

        verify(historyRepository)
                .save(historyCaptor.capture());

        History savedHistory = historyCaptor.getValue();

        assertEquals(
                HistoryAction.REMEMBERED,
                savedHistory.getAction()
        );

        assertEquals(1, card.getRememberedCount());

        assertEquals(0, card.getNotRememberedCount());

        assertEquals(
                ReviewStage.FIFTEEN_DAYS,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(15),
                review.getNextReviewDate()
        );

        assertNull(review.getRevealedAt());

        assertEquals(
                1,
                reviewSession.getCurrentIndex()
        );

        assertTrue(
                response.isCompleted()
        );

        assertNull(
                response.getNextCard()
        );

        assertNotNull(
                response.getProgress()
        );

        assertEquals(
                1,
                response.getProgress().getCompletedCards()
        );

        assertEquals(
                1,
                response.getProgress().getTotalCards()
        );

        assertEquals(
                100,
                response.getProgress().getPercentage()
        );

        verify(httpSession)
                .getAttribute(
                        "memorizezReviewSession"
                );

        verify(httpSession)
                .removeAttribute(
                        "memorizezReviewSession"
                );

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findByIdAndCollection(
                        cardId,
                        collection
                );
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
