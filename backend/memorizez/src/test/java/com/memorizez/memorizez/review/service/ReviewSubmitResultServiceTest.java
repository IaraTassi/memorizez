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

public class ReviewSubmitResultServiceTest {

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
    void shouldThrowExceptionWhenUserIsNotFoundInSubmitResult() {

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

        ReviewResultRequest request =
                new ReviewResultRequest();

        request.setResult(ReviewResult.REMEMBERED);

        assertThrows(
                UserNotFoundException.class,
                () -> service.submitResult(
                        "collection-1",
                        "card-1",
                        request,
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
    void shouldThrowExceptionWhenCollectionIsNotFoundInSubmitResult() {

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

        ReviewResultRequest request =
                new ReviewResultRequest();

        request.setResult(ReviewResult.REMEMBERED);

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
                () -> service.submitResult(
                        "collection-1",
                        "card-1",
                        request,
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
    void shouldThrowExceptionWhenCardIsNotCurrentCardInSubmitResult() {

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

        Collection collection = mock(Collection.class);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collection.getId())
                .thenReturn("collection-1");

        when(collectionRepository.findByIdAndUser(
                "collection-1",
                user
        )).thenReturn(Optional.of(collection));

        ReviewSession reviewSession =
                new ReviewSession(
                        "collection-1",
                        List.of("card-2")
                );

        when(httpSession.getAttribute("memorizezReviewSession"))
                .thenReturn(reviewSession);

        ReviewResultRequest request =
                new ReviewResultRequest();

        request.setResult(ReviewResult.REMEMBERED);

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
                () -> service.submitResult(
                        "collection-1",
                        "card-1",
                        request,
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

        verify(httpSession)
                .getAttribute("memorizezReviewSession");

        verifyNoInteractions(
                cardRepository,
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotFoundInSubmitResult() {

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

        Collection collection = mock(Collection.class);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collection.getId())
                .thenReturn("collection-1");

        when(collectionRepository.findByIdAndUser(
                "collection-1",
                user
        )).thenReturn(Optional.of(collection));

        ReviewResultRequest request =
                new ReviewResultRequest();

        request.setResult(ReviewResult.REMEMBERED);

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        historyRepository,
                        httpSession
                );

        ReviewSession reviewSession =
                new ReviewSession(
                        "collection-1",
                        List.of("card-1")
                );

        when(httpSession.getAttribute("memorizezReviewSession"))
                .thenReturn(reviewSession);

        when(cardRepository.findByIdAndCollection(
                "card-1",
                collection
        )).thenReturn(Optional.empty());

        assertThrows(
                CardNotFoundException.class,
                () -> service.submitResult(
                        "collection-1",
                        "card-1",
                        request,
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

        verify(httpSession)
                .getAttribute("memorizezReviewSession");

        verify(cardRepository)
                .findByIdAndCollection(
                        "card-1",
                        collection
                );

        verifyNoInteractions(
                reviewRepository,
                historyRepository
        );
    }

}
