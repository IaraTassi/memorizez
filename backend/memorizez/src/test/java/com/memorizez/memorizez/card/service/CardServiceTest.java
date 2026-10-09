package com.memorizez.memorizez.card.service;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.card.dto.CardResponse;
import com.memorizez.memorizez.card.dto.CreateCardRequest;
import com.memorizez.memorizez.card.dto.UpdateCardRequest;
import com.memorizez.memorizez.card.exception.CardNotFoundException;
import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.exception.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.history.History;
import com.memorizez.memorizez.history.HistoryAction;
import com.memorizez.memorizez.history.repository.HistoryRepository;
import com.memorizez.memorizez.review.Review;
import com.memorizez.memorizez.review.ReviewStage;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class CardServiceTest {

    @Test
    void shouldCreateCardSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

        User user = new User("Test User", "test@memorizez.com", "hashed-password");

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        String collectionId = "collection-1";

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        CreateCardRequest request = new CreateCardRequest();
        request.setFront("What is inheritance in OOP?");
        request.setBack("What is inheritance in object-oriented programming?");
        request.setNotes("Inheritance allows a class to reuse attributes and methods from another class.");

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                        );

        service.create(collectionId, request, authentication);

        ArgumentCaptor<Card> captor = ArgumentCaptor.forClass(Card.class);

        verify(cardRepository).save(captor.capture());

        Card card = captor.getValue();

        assertEquals("What is inheritance in OOP?", card.getFront());
        assertEquals("What is inheritance in object-oriented programming?", card.getBack());
        assertEquals("Inheritance allows a class to reuse attributes and methods from another class.", card.getNotes());
        assertEquals(collection, card.getCollection());

        assertEquals(0, card.getRememberedCount());
        assertEquals(0, card.getNotRememberedCount());
        assertEquals(0, card.getEditCount());

        verify(historyRepository).save(argThat(history ->
                history.getAction() == HistoryAction.CREATED
                        && history.getCreatedAt() != null
        ));
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInCreate() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        String collectionId = "collection-1";

        CreateCardRequest request = new CreateCardRequest();
        request.setFront("What is inheritance in OOP?");
        request.setBack("What is inheritance in object-oriented programming?");
        request.setNotes("Inheritance allows a class to reuse attributes and methods from another class.");

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                        );

        assertThrows(UserNotFoundException.class, () -> service.create(collectionId, request, authentication));

        verify(collectionRepository, never())
                .findByIdAndUser(anyString(), any());

        verify(cardRepository, never())
                .save(any());

        verify(historyRepository, never()).save(any());
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInCreate() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        String collectionId = "collection-1";

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.empty());

        CreateCardRequest request = new CreateCardRequest();
        request.setFront("What is inheritance in OOP?");
        request.setBack("What is inheritance in object-oriented programming?");
        request.setNotes("Inheritance allows code reuse.");

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.create(collectionId, request, authentication)
        );

        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

        verify(cardRepository, never())
                .save(any());

        verify(historyRepository, never()).save(any());

    }

    @Test
    void shouldFindAllCardsSuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        String collectionId = "collection-1";

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        Card card1 = new Card();
        card1.setFront("What is encapsulation?");
        card1.setBack("O que é encapsulamento");
        card1.setNotes("Encapsulation hides internal details.");
        card1.setCollection(collection);

        card1.incrementRememberedCount();
        card1.incrementRememberedCount();
        card1.incrementNotRememberedCount();
        card1.incrementEditCount();
        card1.incrementEditCount();
        card1.incrementEditCount();

        Card card2 = new Card();
        card2.setFront("What is inheritance in OOP?");
        card2.setBack("What is inheritance in object-oriented programming?");
        card2.setNotes("Inheritance allows code reuse.");
        card2.setCollection(collection);

        card2.incrementRememberedCount();
        card2.incrementRememberedCount();
        card2.incrementRememberedCount();
        card2.incrementRememberedCount();
        card2.incrementRememberedCount();
        card2.incrementEditCount();

        Pageable pageable = PageRequest.of(0, 20);

        Page<Card> cards =
                new PageImpl<>(
                        List.of(card1, card2),
                        pageable,
                        2
                );

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        when(cardRepository.findAllByCollectionOrderByCreatedAtDescIdDesc(collection, pageable))
                .thenReturn(cards);

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        Page<CardResponse> response =
                service.findAll(collectionId, pageable, authentication);

        assertEquals(2, response.getContent().size());
        assertEquals("What is encapsulation?",
                response.getContent().get(0).getFront());
        assertEquals("What is inheritance in OOP?",
                response.getContent().get(1).getFront());

        verify(cardRepository)
                .findAllByCollectionOrderByCreatedAtDescIdDesc(collection, pageable);

        assertEquals(2, response.getContent().get(0).getRememberedCount());
        assertEquals(1, response.getContent().get(0).getNotRememberedCount());
        assertEquals(3, response.getContent().get(0).getEditCount());

        assertEquals(5, response.getContent().get(1).getRememberedCount());
        assertEquals(0, response.getContent().get(1).getNotRememberedCount());
        assertEquals(1, response.getContent().get(1).getEditCount());

        assertEquals(0, response.getNumber());
        assertEquals(20, response.getSize());
        assertEquals(2, response.getTotalElements());

    }

    @Test
    void shouldReturnEmptyPageWhenCollectionHasNoCards() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        String collectionId = "collection-1";

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        Pageable pageable = PageRequest.of(0, 20);

        Page<Card> cards = Page.empty(pageable);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        when(cardRepository.findAllByCollectionOrderByCreatedAtDescIdDesc(collection, pageable))
                .thenReturn(cards);

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        Page<CardResponse> response =
                service.findAll(collectionId, pageable, authentication);

        assertTrue(response.getContent().isEmpty());
        assertEquals(0, response.getTotalElements());
        assertEquals(0, response.getNumber());
        assertEquals(20, response.getSize());

        verify(cardRepository)
                .findAllByCollectionOrderByCreatedAtDescIdDesc(collection, pageable);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindAll() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        String collectionId = "collection-1";

        Pageable pageable = PageRequest.of(0, 20);

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(UserNotFoundException.class, () -> service.findAll(collectionId, pageable, authentication));

        verify(collectionRepository, never()).findByIdAndUser(anyString(), any());

        verify(cardRepository, never()).findAllByCollectionOrderByCreatedAtDescIdDesc(any(), any());

    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInFindAll() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        String collectionId = "collection-1";
        Pageable pageable = PageRequest.of(0, 20);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.empty());

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.findAll(collectionId, pageable, authentication)
        );

        verify(cardRepository, never())
                .findAllByCollectionOrderByCreatedAtDescIdDesc(any(), any());
    }

    @Test
    void shouldUpdateCardSuccessfullyWhenReviewDoesNotExist() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

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

        UpdateCardRequest request = new UpdateCardRequest();
        request.setFront("What is inheritance in OOP?");
        request.setBack("What is inheritance in object-oriented programming?");
        request.setNotes("");

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        service.update(collectionId, cardId, request, authentication);

        ArgumentCaptor<Card> captor =
                ArgumentCaptor.forClass(Card.class);

        verify(cardRepository)
                .findByIdAndCollection(cardId, collection);

        verify(cardRepository)
                .save(captor.capture());

        Card updatedCard = captor.getValue();

        assertEquals("What is inheritance in OOP?", updatedCard.getFront());
        assertEquals("What is inheritance in object-oriented programming?", updatedCard.getBack());
        assertEquals("", updatedCard.getNotes());
        assertEquals(collection, updatedCard.getCollection());
        assertEquals(1, updatedCard.getEditCount());

        ArgumentCaptor<History> historyCaptor =
                ArgumentCaptor.forClass(History.class);

        verify(historyRepository)
                .save(historyCaptor.capture());

        History savedHistory = historyCaptor.getValue();

        assertEquals(
                HistoryAction.EDITED,
                savedHistory.getAction()
        );

        assertNotNull(savedHistory.getCreatedAt());

        verify(reviewRepository)
                .findByCard(card);

        verify(reviewRepository, never())
                .save(any(Review.class));

    }

    @Test
    void shouldNotUpdateCardWhenNoFieldWasChanged() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

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

        UpdateCardRequest request = new UpdateCardRequest();
        request.setFront("What is encapsulation?");
        request.setBack("O que é encapsulamento");
        request.setNotes("Princípio da POO.");

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                collectionId,
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(
                cardId,
                collection
        )).thenReturn(Optional.of(card));

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        service.update(
                collectionId,
                cardId,
                request,
                authentication
        );

        assertEquals(
                0,
                card.getEditCount()
        );

        verify(cardRepository, never())
                .save(any(Card.class));

        verify(reviewRepository, never())
                .findByCard(any(Card.class));

        verify(reviewRepository, never())
                .save(any(Review.class));

        verify(historyRepository, never())
                .save(any(History.class));
    }

    @Test
    void shouldUpdateCardAndResetReviewSuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

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
        review.setRevealedAt(LocalDateTime.now());

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

        UpdateCardRequest request = new UpdateCardRequest();
        request.setFront("What is inheritance in OOP?");
        request.setBack("What is inheritance in object-oriented programming?");
        request.setNotes("Inheritance allows code reuse.");

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        service.update(collectionId, cardId, request, authentication);

        assertEquals(
                "What is inheritance in OOP?",
                card.getFront()
        );

        assertEquals(
                "What is inheritance in object-oriented programming?",
                card.getBack()
        );

        assertEquals(
                "Inheritance allows code reuse.",
                card.getNotes()
        );

        assertEquals(
                1,
                card.getEditCount()
        );

        assertEquals(
                ReviewStage.ONE_DAY,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(1),
                review.getNextReviewDate()
        );

        assertNull(
                review.getRevealedAt()
        );

        ArgumentCaptor<History> historyCaptor =
                ArgumentCaptor.forClass(History.class);

        verify(historyRepository)
                .save(historyCaptor.capture());

        History savedHistory = historyCaptor.getValue();

        assertEquals(
                HistoryAction.EDITED,
                savedHistory.getAction()
        );

        assertNotNull(
                savedHistory.getCreatedAt()
        );

        verify(reviewRepository)
                .findByCard(card);

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInUpdate() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        String collectionId = "collection-1";
        String cardId = "card-1";

        UpdateCardRequest request = new UpdateCardRequest();
        request.setFront("New front");
        request.setBack("New back");
        request.setNotes("");

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.update(collectionId, cardId, request, authentication)
        );

        verify(collectionRepository, never())
                .findByIdAndUser(anyString(), any());

        verify(cardRepository, never())
                .findByIdAndCollection(anyString(), any());

        verify(cardRepository, never())
                .save(any());
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInUpdate() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

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

        UpdateCardRequest request = new UpdateCardRequest();
        request.setFront("New front");
        request.setBack("New back");
        request.setNotes("");

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.update(collectionId, cardId, request, authentication)
        );

        verify(cardRepository, never())
                .findByIdAndCollection(anyString(), any());

        verify(cardRepository, never())
                .save(any());
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotFoundInUpdate() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

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

        UpdateCardRequest request = new UpdateCardRequest();
        request.setFront("New front");
        request.setBack("New back");
        request.setNotes("");

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CardNotFoundException.class,
                () -> service.update(collectionId, cardId, request, authentication)
        );

        verify(cardRepository)
                .findByIdAndCollection(cardId, collection);

        verify(cardRepository, never())
                .save(any());
    }

    @Test
    void shouldDeleteCardSuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

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

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                collectionId,
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(
                cardId,
                collection
        )).thenReturn(Optional.of(card));

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        service.delete(
                collectionId,
                cardId,
                authentication
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        collectionId,
                        user
                );

        verify(cardRepository)
                .findByIdAndCollection(
                        cardId,
                        collection
                );

        verify(cardRepository)
                .delete(card);

        verifyNoInteractions(
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInDelete() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        String collectionId = "collection-1";
        String cardId = "card-1";

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.delete(collectionId, cardId, authentication)
        );

        verify(collectionRepository, never())
                .findByIdAndUser(anyString(), any());

        verify(cardRepository, never())
                .findByIdAndCollection(anyString(), any());

        verify(cardRepository, never())
                .delete(any());
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInDelete() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

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

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.delete(collectionId, cardId, authentication)
        );

        verify(cardRepository, never())
                .findByIdAndCollection(anyString(), any());

        verify(cardRepository, never())
                .delete(any());
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotFoundInDelete() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);

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

        CardService service =
                new CardService(
                        cardRepository,
                        collectionRepository,
                        userRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CardNotFoundException.class,
                () -> service.delete(collectionId, cardId, authentication)
        );

        verify(cardRepository)
                .findByIdAndCollection(cardId, collection);

        verify(cardRepository, never())
                .delete(any());
    }
}
