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
import com.memorizez.memorizez.review.ReviewStage;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
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

public class HistoryServiceTest {

    @Test
    void shouldFindAllHistoryCollectionsSuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection javaCollection = new Collection();
        javaCollection.setName("Java");
        javaCollection.setUser(user);

        Collection englishCollection = new Collection();
        englishCollection.setName("Inglês");
        englishCollection.setUser(user);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findAllByUserOrderByCreatedAtDesc(user))
                .thenReturn(List.of(javaCollection, englishCollection));

        when(cardRepository.countByCollection(javaCollection))
                .thenReturn(36L);

        when(cardRepository.countByCollection(englishCollection))
                .thenReturn(82L);

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        List<HistoryCollectionResponse> response =
                service.findAllCollections(authentication);

        assertEquals(2, response.size());

        assertEquals(
                javaCollection.getId(),
                response.get(0).id()
        );

        assertEquals(
                "Java",
                response.get(0).name()
        );

        assertEquals(
                36L,
                response.get(0).cardCount()
        );

        assertEquals(
                englishCollection.getId(),
                response.get(1).id()
        );

        assertEquals(
                "Inglês",
                response.get(1).name()
        );

        assertEquals(
                82L,
                response.get(1).cardCount()
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findAllByUserOrderByCreatedAtDesc(user);

        verify(cardRepository)
                .countByCollection(javaCollection);

        verify(cardRepository)
                .countByCollection(englishCollection);
    }

    @Test
    void shouldReturnEmptyListWhenUserHasNoCollections() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

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

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        List<HistoryCollectionResponse> response =
                service.findAllCollections(authentication);

        assertTrue(response.isEmpty());

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findAllByUserOrderByCreatedAtDesc(user);

        verifyNoInteractions(
                cardRepository,
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindAllCollections() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.empty());

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.findAllCollections(authentication)
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verifyNoInteractions(
                collectionRepository,
                cardRepository,
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldFindAllHistoryCardsSuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Java");
        collection.setUser(user);

        String collectionId = "collection-1";

        Card card1 = new Card();
        card1.setFront("What is inheritance?");
        card1.setBack("Inheritance allows reuse.");
        card1.setCollection(collection);

        card1.incrementRememberedCount();
        card1.incrementRememberedCount();
        card1.incrementNotRememberedCount();
        card1.incrementEditCount();

        Card card2 = new Card();
        card2.setFront("What is polymorphism?");
        card2.setBack("Different forms.");
        card2.setCollection(collection);

        Page<Card> cardPage =
                new PageImpl<>(
                        List.of(card1, card2),
                        PageRequest.of(0, 10),
                        2
                );

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                collectionId,
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findAllByCollectionOrderByCreatedAtDescIdDesc(
                collection,
                PageRequest.of(0, 10)
        )).thenReturn(cardPage);

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        Page<HistoryCardResponse> response =
                service.findAllCards(
                        authentication,
                        collectionId,
                        PageRequest.of(0, 10)
                );

        assertEquals(2, response.getTotalElements());

        assertEquals(
                card1.getId(),
                response.getContent().get(0).id()
        );

        assertEquals(
                "What is inheritance?",
                response.getContent().get(0).front()
        );

        assertEquals(
                2,
                response.getContent().get(0).rememberedCount()
        );

        assertEquals(
                1,
                response.getContent().get(0).notRememberedCount()
        );

        assertEquals(
                1,
                response.getContent().get(0).editCount()
        );

        assertEquals(
                card2.getId(),
                response.getContent().get(1).id()
        );

        assertEquals(
                "What is polymorphism?",
                response.getContent().get(1).front()
        );

        assertEquals(
                0,
                response.getContent().get(1).rememberedCount()
        );

        assertEquals(
                0,
                response.getContent().get(1).notRememberedCount()
        );

        assertEquals(
                0,
                response.getContent().get(1).editCount()
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        collectionId,
                        user
                );

        verify(cardRepository)
                .findAllByCollectionOrderByCreatedAtDescIdDesc(
                        collection,
                        PageRequest.of(0, 10)
                );

        verifyNoInteractions(
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindAllCards() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        String collectionId = "collection-1";

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.empty());

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.findAllCards(
                        authentication,
                        collectionId,
                        Pageable.unpaged()
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verifyNoInteractions(
                collectionRepository,
                cardRepository,
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldReturnEmptyPageWhenCollectionHasNoCards() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Java");
        collection.setUser(user);

        String collectionId = "collection-1";

        PageRequest pageable = PageRequest.of(0, 10);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                collectionId,
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findAllByCollectionOrderByCreatedAtDescIdDesc(
                collection,
                pageable
        )).thenReturn(
                new PageImpl<>(
                        List.of(),
                        pageable,
                        0
                )
        );

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        Page<HistoryCardResponse> response =
                service.findAllCards(
                        authentication,
                        collectionId,
                        pageable
                );

        assertTrue(response.isEmpty());

        assertEquals(
                0,
                response.getTotalElements()
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        collectionId,
                        user
                );

        verify(cardRepository)
                .findAllByCollectionOrderByCreatedAtDescIdDesc(
                        collection,
                        pageable
                );

        verifyNoInteractions(
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInFindAllCards() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

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

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.findAllCards(
                        authentication,
                        collectionId,
                        Pageable.unpaged()
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

        verifyNoInteractions(
                cardRepository,
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldFindHistoryCardSuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Java");
        collection.setUser(user);

        String collectionId = "collection-1";
        String cardId = "card-1";

        Card card = new Card();
        card.setFront("What is inheritance?");
        card.setBack("Inheritance allows a class to reuse attributes and methods.");
        card.setNotes("Important OOP concept.");
        card.setCollection(collection);

        card.incrementRememberedCount();
        card.incrementRememberedCount();
        card.incrementNotRememberedCount();
        card.incrementEditCount();

        Review review = new Review();
        review.setCard(card);
        review.setStage(ReviewStage.SEVEN_DAYS);
        review.setNextReviewDate(LocalDate.now().plusDays(7));

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

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        HistoryCardDetailResponse response =
                service.findCard(
                        authentication,
                        collectionId,
                        cardId
                );

        assertEquals(
                card.getId(),
                response.id()
        );

        assertEquals(
                "What is inheritance?",
                response.front()
        );

        assertEquals(
                2,
                response.rememberedCount()
        );

        assertEquals(
                1,
                response.notRememberedCount()
        );

        assertEquals(
                1,
                response.editCount()
        );

        assertEquals(
                card.getCreatedAt(),
                response.createdAt()
        );

        assertEquals(
                LocalDate.now().plusDays(7),
                response.nextReviewDate()
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

        verify(cardRepository)
                .findByIdAndCollection(cardId, collection);

        verify(reviewRepository)
                .findByCard(card);
    }

    @Test
    void shouldFindHistoryCardSuccessfullyWhenReviewDoesNotExist() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Java");
        collection.setUser(user);

        String collectionId = "collection-1";
        String cardId = "card-1";

        Card card = new Card();
        card.setFront("What is inheritance?");
        card.setBack("Inheritance allows a class to reuse attributes and methods.");
        card.setNotes("Important OOP concept.");
        card.setCollection(collection);

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

        when(reviewRepository.findByCard(card))
                .thenReturn(Optional.empty());

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        HistoryCardDetailResponse response =
                service.findCard(
                        authentication,
                        collectionId,
                        cardId
                );

        assertEquals(
                "What is inheritance?",
                response.front()
        );

        assertEquals(
                0,
                response.rememberedCount()
        );

        assertEquals(
                0,
                response.notRememberedCount()
        );

        assertEquals(
                0,
                response.editCount()
        );

        assertNull(response.nextReviewDate());

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

        verify(reviewRepository)
                .findByCard(card);

        verifyNoInteractions(historyRepository);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindCard() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        String collectionId = "collection-1";
        String cardId = "card-1";

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.empty());

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.findCard(
                        authentication,
                        collectionId,
                        cardId
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verifyNoInteractions(
                collectionRepository,
                cardRepository,
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInFindCard() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

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

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.findCard(
                        authentication,
                        collectionId,
                        cardId
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

        verifyNoInteractions(
                cardRepository,
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotFoundInFindCard() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

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

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(cardId, collection))
                .thenReturn(Optional.empty());

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CardNotFoundException.class,
                () -> service.findCard(
                        authentication,
                        collectionId,
                        cardId
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

        verify(cardRepository)
                .findByIdAndCollection(cardId, collection);

        verifyNoInteractions(
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldFindHistorySuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Java");
        collection.setUser(user);

        String collectionId = "collection-1";
        String cardId = "card-1";

        Card card = mock(Card.class);

        when(card.getId())
                .thenReturn(cardId);

        when(card.getCreatedAt())
                .thenReturn(LocalDate.of(2026, 9, 15));

        History history1 = new History(
                "history-1",
                card,
                HistoryAction.REMEMBERED,
                LocalDateTime.of(2026, 9, 29, 10, 0)
        );

        History history2 = new History(
                "history-2",
                card,
                HistoryAction.EDITED,
                LocalDateTime.of(2026, 9, 20, 10, 0)
        );

        PageRequest pageable =
                PageRequest.of(0, 10);

        Page<History> historyPage =
                new PageImpl<>(
                        List.of(history1, history2),
                        pageable,
                        2
                );

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

        when(historyRepository.findByCardIdOrderByCreatedAtDesc(
                cardId,
                pageable
        )).thenReturn(historyPage);

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        Page<HistoryResponse> response =
                service.findHistory(
                        authentication,
                        collectionId,
                        cardId,
                        pageable
                );

        assertEquals(
                2,
                response.getTotalElements()
        );

        assertEquals(
                2,
                response.getContent().size()
        );

        assertEquals(
                HistoryAction.EDITED,
                response.getContent().get(1).action()
        );

        assertEquals(
                history2.getCreatedAt(),
                response.getContent().get(1).createdAt()
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

        verify(historyRepository)
                .findByCardIdOrderByCreatedAtDesc(
                        cardId,
                        pageable
                );

        verifyNoInteractions(reviewRepository);
    }

    @Test
    void shouldReturnEmptyHistoryWhenCardHasNoHistory() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Java");
        collection.setUser(user);

        String collectionId = "collection-1";
        String cardId = "card-1";

        Card card = mock(Card.class);

        when(card.getId())
                .thenReturn(cardId);

        when(card.getCreatedAt())
                .thenReturn(LocalDate.of(2026, 9, 15));

        PageRequest pageable =
                PageRequest.of(0, 10);

        Page<History> historyPage =
                new PageImpl<>(
                        List.of(),
                        pageable,
                        0
                );

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

        when(historyRepository.findByCardIdOrderByCreatedAtDesc(
                cardId,
                pageable
        )).thenReturn(historyPage);

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        Page<HistoryResponse> response =
                service.findHistory(
                        authentication,
                        collectionId,
                        cardId,
                        pageable
                );

        assertEquals(
                0,
                response.getTotalElements()
        );

        assertTrue(response.getContent().isEmpty());

        verify(historyRepository)
                .findByCardIdOrderByCreatedAtDesc(
                        cardId,
                        pageable
                );

        verifyNoInteractions(reviewRepository);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindHistory() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        String collectionId = "collection-1";
        String cardId = "card-1";

        PageRequest pageable =
                PageRequest.of(0, 10);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.empty());

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.findHistory(
                        authentication,
                        collectionId,
                        cardId,
                        pageable
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verifyNoInteractions(
                collectionRepository,
                cardRepository,
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInFindHistory() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        String collectionId = "collection-1";
        String cardId = "card-1";

        PageRequest pageable =
                PageRequest.of(0, 10);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                collectionId,
                user
        )).thenReturn(Optional.empty());

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.findHistory(
                        authentication,
                        collectionId,
                        cardId,
                        pageable
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        collectionId,
                        user
                );

        verifyNoInteractions(
                cardRepository,
                reviewRepository,
                historyRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotFoundInFindHistory() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        HistoryRepository historyRepository = mock(HistoryRepository.class);
        Authentication authentication = mock(Authentication.class);

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

        PageRequest pageable =
                PageRequest.of(0, 10);

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
        )).thenReturn(Optional.empty());

        HistoryService service =
                new HistoryService(
                        userRepository,
                        collectionRepository,
                        cardRepository,
                        reviewRepository,
                        historyRepository
                );

        assertThrows(
                CardNotFoundException.class,
                () -> service.findHistory(
                        authentication,
                        collectionId,
                        cardId,
                        pageable
                )
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

        verifyNoInteractions(
                reviewRepository,
                historyRepository
        );
    }


}
