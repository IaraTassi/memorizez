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
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class FreeStudyServiceTest {

    @Test
    void shouldFindFirstCardForFreeStudySuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("English");
        collection.setUser(user);

        Card card = new Card();
        card.setFront("What is encapsulation?");
        card.setBack(
                "Polymorphism allows objects of different classes to be treated as objects of a common type."
        );
        card.setNotes(
                "Example: Dog and Cat can implement the same method differently."
        );
        card.setCollection(collection);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                collection.getId(),
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findAllByCollectionOrderByCreatedAtAsc(collection))
                .thenReturn(List.of(card));

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        Optional<FreeStudyResponse> result =
                service.findFirstCard(
                        collection.getId(),
                        authentication
                );

        assertTrue(result.isPresent());

        FreeStudyResponse response = result.get();

        assertEquals(card.getId(), response.getCardId());

        assertEquals(
                collection.getId(),
                response.getCollectionId()
        );

        assertEquals(
                "What is encapsulation?",
                response.getFront()
        );

        assertNull(response.getBack());
        assertNull(response.getNotes());

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        collection.getId(),
                        user
                );

        verify(cardRepository)
                .findAllByCollectionOrderByCreatedAtAsc(collection);
    }

    @Test
    void shouldReturnEmptyWhenSelectedCollectionHasNoCards() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("English");
        collection.setUser(user);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                collection.getId(),
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findAllByCollectionOrderByCreatedAtAsc(collection))
                .thenReturn(List.of());

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        Optional<FreeStudyResponse> result =
                service.findFirstCard(
                        collection.getId(),
                        authentication
                );

        assertTrue(result.isEmpty());

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        collection.getId(),
                        user
                );

        verify(cardRepository)
                .findAllByCollectionOrderByCreatedAtAsc(collection);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindFirstCard() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.findFirstCard(
                        "collection-id",
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("unknown@memorizez.com");

        verifyNoInteractions(
                collectionRepository,
                cardRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInFindFirstCard() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
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

        when(collectionRepository.findByIdAndUser(
                "collection-id",
                user
        )).thenReturn(Optional.empty());

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.findFirstCard(
                        "collection-id",
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        "collection-id",
                        user
                );

        verifyNoInteractions(cardRepository);
    }

    @Test
    void shouldRevealCardSuccessfullyInFreeBack() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

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
        card.setBack(
                "O que é encapsulamento"
        );
        card.setNotes(
                "Princípio da POO."
        );
        card.setCollection(collection);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                collection.getId(),
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(
                card.getId(),
                collection
        )).thenReturn(Optional.of(card));

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        FreeStudyResponse response =
                service.freeBack(
                        collection.getId(),
                        card.getId(),
                        authentication
                );

        assertEquals(card.getId(), response.getCardId());

        assertEquals(
                collection.getId(),
                response.getCollectionId()
        );

        assertEquals(
                "What is encapsulation?",
                response.getFront()
        );

        assertEquals(
                "O que é encapsulamento",
                response.getBack()
        );

        assertEquals(
                "Princípio da POO.",
                response.getNotes()
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        collection.getId(),
                        user
                );

        verify(cardRepository)
                .findByIdAndCollection(
                        card.getId(),
                        collection
                );
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFreeBack() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.freeBack(
                        "collection-id",
                        "card-id",
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("unknown@memorizez.com");

        verifyNoInteractions(
                collectionRepository,
                cardRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotFoundInFreeBack() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                "collection-id",
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(
                "card-id",
                collection
        )).thenReturn(Optional.empty());

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        assertThrows(
                CardNotFoundException.class,
                () -> service.freeBack(
                        "collection-id",
                        "card-id",
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        "collection-id",
                        user
                );

        verify(cardRepository)
                .findByIdAndCollection(
                        "card-id",
                        collection
                );
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInFreeBack() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
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

        when(collectionRepository.findByIdAndUser(
                "collection-id",
                user
        )).thenReturn(Optional.empty());

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.freeBack(
                        "collection-id",
                        "card-id",
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        "collection-id",
                        user
                );

        verifyNoInteractions(cardRepository);
    }

    @Test
    void shouldFindNextCardInCurrentCollection() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        Card currentCard = mock(Card.class);
        when(currentCard.getId()).thenReturn("current-card-id");
        when(currentCard.getFront()).thenReturn("What is encapsulation?");
        when(currentCard.getCollection()).thenReturn(collection);

        Card nextCard = mock(Card.class);
        when(nextCard.getId()).thenReturn("next-card-id");
        when(nextCard.getFront()).thenReturn("What is Spring Boot?");
        when(nextCard.getCollection()).thenReturn(collection);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                "collection-id",
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(
                "current-card-id",
                collection
        )).thenReturn(Optional.of(currentCard));

        when(cardRepository.findAllByCollectionOrderByCreatedAtAsc(
                collection
        )).thenReturn(List.of(currentCard, nextCard));

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        Optional<FreeStudyResponse> result =
                service.freeNext(
                        "collection-id",
                        "current-card-id",
                        authentication
                );

        assertTrue(result.isPresent());

        FreeStudyResponse response = result.get();

        assertEquals(
                "next-card-id",
                response.getCardId()
        );

        assertEquals(
                collection.getId(),
                response.getCollectionId()
        );

        assertEquals(
                "What is Spring Boot?",
                response.getFront()
        );

        assertNull(response.getBack());
        assertNull(response.getNotes());

        assertNotEquals(
                currentCard.getId(),
                response.getCardId()
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        "collection-id",
                        user
                );

        verify(cardRepository)
                .findByIdAndCollection(
                        "current-card-id",
                        collection
                );

        verify(cardRepository)
                .findAllByCollectionOrderByCreatedAtAsc(
                        collection
                );
    }

    @Test
    void shouldReturnEmptyWhenCurrentCardIsLastInFreeNext() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        Card currentCard = mock(Card.class);
        when(currentCard.getId()).thenReturn("current-card-id");
        when(currentCard.getFront()).thenReturn("What is encapsulation?");
        when(currentCard.getCollection()).thenReturn(collection);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                "collection-id",
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(
                "current-card-id",
                collection
        )).thenReturn(Optional.of(currentCard));

        when(cardRepository.findAllByCollectionOrderByCreatedAtAsc(
                collection
        )).thenReturn(List.of(currentCard));

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        Optional<FreeStudyResponse> result =
                service.freeNext(
                        "collection-id",
                        "current-card-id",
                        authentication
                );

        assertTrue(result.isEmpty());

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        "collection-id",
                        user
                );

        verify(cardRepository)
                .findByIdAndCollection(
                        "current-card-id",
                        collection
                );

        verify(cardRepository)
                .findAllByCollectionOrderByCreatedAtAsc(
                        collection
                );
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFreeNext() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.freeNext(
                        "collection-id",
                        "card-id",
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("unknown@memorizez.com");

        verifyNoInteractions(
                collectionRepository,
                cardRepository
        );
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInFreeNext() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
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

        when(collectionRepository.findByIdAndUser(
                "collection-id",
                user
        )).thenReturn(Optional.empty());

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.freeNext(
                        "collection-id",
                        "card-id",
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        "collection-id",
                        user
                );

        verifyNoInteractions(cardRepository);
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotFoundInFreeNext() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                "collection-id",
                user
        )).thenReturn(Optional.of(collection));

        when(cardRepository.findByIdAndCollection(
                "card-id",
                collection
        )).thenReturn(Optional.empty());

        FreeStudyService service =
                new FreeStudyService(
                        userRepository,
                        collectionRepository,
                        cardRepository
                );

        assertThrows(
                CardNotFoundException.class,
                () -> service.freeNext(
                        "collection-id",
                        "card-id",
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        "collection-id",
                        user
                );

        verify(cardRepository)
                .findByIdAndCollection(
                        "card-id",
                        collection
                );
    }

}
