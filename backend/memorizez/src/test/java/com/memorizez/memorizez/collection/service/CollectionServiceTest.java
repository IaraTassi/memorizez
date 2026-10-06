package com.memorizez.memorizez.collection.service;

import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.dto.CollectionResponse;
import com.memorizez.memorizez.collection.dto.CreateCollectionRequest;
import com.memorizez.memorizez.collection.dto.UpdateCollectionRequest;
import com.memorizez.memorizez.collection.exception.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class CollectionServiceTest {

    @Test
    void shouldCreateCollectionSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);
        CardRepository cardRepository = mock(CardRepository.class);

        User user = new User("Test User", "test@memorizez.com", "hashed-password");

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

    CreateCollectionRequest request = new CreateCollectionRequest();
    request.setName("Inglês");

    CollectionService service =
            new CollectionService(
                    collectionRepository,
                    userRepository,
                    cardRepository
                    );

    service.create(request, authentication);

        ArgumentCaptor<Collection> captor = ArgumentCaptor.forClass(Collection.class);

        verify(collectionRepository).save(captor.capture());

        Collection collection = captor.getValue();

        assertEquals("Inglês", collection.getName());
        assertEquals(user, collection.getUser());

        verify(userRepository)
                .findByEmail("test@memorizez.com");
        verifyNoInteractions(cardRepository);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInCreate() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);
        CardRepository cardRepository = mock(CardRepository.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        CreateCollectionRequest request = new CreateCollectionRequest();
        request.setName("Inglês");

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository
                        );

        assertThrows(UserNotFoundException.class, () -> service.create(request, authentication));

        verify(collectionRepository, never()).save(any());
        verify(userRepository)
                .findByEmail("unknown@memorizez.com");
        verifyNoInteractions(cardRepository);

    }

    @Test
    void shouldAllowCollectionsWithSameNameForSameUser() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        CreateCollectionRequest request = new CreateCollectionRequest();
        request.setName("Java");

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository
                );

        service.create(request, authentication);
        service.create(request, authentication);

        verify(collectionRepository, times(2))
                .save(any(Collection.class));
    }

    @Test
    void shouldFindAllCollectionsSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);
        CardRepository cardRepository = mock(CardRepository.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection1 = new Collection();
        collection1.setName("Inglês");
        collection1.setUser(user);

        Collection collection2 = new Collection();
        collection2.setName("Java");
        collection2.setUser(user);

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findAllByUserOrderByCreatedAtDesc(user))
                .thenReturn(List.of(collection1, collection2));

        when(cardRepository.countByCollection(collection1))
                .thenReturn(3L);

        when(cardRepository.countByCollection(collection2))
                .thenReturn(1L);

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository
                );


        List<CollectionResponse> response = service.findAll(authentication);

        assertEquals(2, response.size());
        assertEquals("Inglês", response.get(0).getName());
        assertEquals("Java", response.get(1).getName());

        assertEquals(3, response.get(0).getCardCount());
        assertEquals(1, response.get(1).getCardCount());
        assertEquals(
                collection1.getId(),
                response.get(0).getId()
        );
        assertEquals(
                collection2.getId(),
                response.get(1).getId()
        );

        verify(collectionRepository)
                .findAllByUserOrderByCreatedAtDesc(user);

        verify(cardRepository)
                .countByCollection(collection1);
        verify(cardRepository)
                .countByCollection(collection2);
    }

    @Test
    void shouldReturnEmptyListWhenUserHasNoCollections() {

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

        when(collectionRepository.findAllByUserOrderByCreatedAtDesc(user))
                .thenReturn(List.of());

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository
                );

        List<CollectionResponse> response =
                service.findAll(authentication);

        assertTrue(response.isEmpty());

        verify(userRepository)
                .findByEmail("test@memorizez.com");
        verify(collectionRepository)
                .findAllByUserOrderByCreatedAtDesc(user);
        verifyNoInteractions(cardRepository);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindAll() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);
        CardRepository cardRepository = mock(CardRepository.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository

                );

        assertThrows(UserNotFoundException.class, () -> service.findAll(authentication));

        verify(collectionRepository, never()).findAllByUserOrderByCreatedAtDesc(any());
        verify(userRepository)
                .findByEmail("unknown@memorizez.com");
        verifyNoInteractions(cardRepository);

    }

    @Test
    void shouldUpdateCollectionSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);
        CardRepository cardRepository = mock(CardRepository.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        String collectionId = "collection-1";

        UpdateCollectionRequest request = new UpdateCollectionRequest();
        request.setName("Java");

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                collectionId,
                user
        )).thenReturn(Optional.of(collection));

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository
                );

        service.update(
                collectionId,
                request,
                authentication
        );

        assertEquals(
                "Java",
                collection.getName()
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");
        verify(collectionRepository)
                .findByIdAndUser(
                        collectionId,
                        user
                );
        verify(collectionRepository)
                .save(collection);
        verifyNoInteractions(cardRepository);
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInUpdate() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);
        CardRepository cardRepository = mock(CardRepository.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        String collectionId = "collection-1";

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.empty());

        UpdateCollectionRequest request = new UpdateCollectionRequest();
        request.setName("Java");

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository
                        );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.update(collectionId, request, authentication)
        );

        verify(collectionRepository, never()).save(any());
        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInUpdate() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);
        CardRepository cardRepository = mock(CardRepository.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        String collectionId = "collection-1";

        UpdateCollectionRequest request = new UpdateCollectionRequest();
        request.setName("Java");

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository
                        );

        assertThrows(
                UserNotFoundException.class,
                () -> service.update(collectionId, request, authentication)
        );

        verify(collectionRepository, never())
                .findByIdAndUser(anyString(), any());

        verify(collectionRepository, never()).save(any());
        verify(userRepository)
                .findByEmail("unknown@memorizez.com");
        verifyNoInteractions(cardRepository);

    }

    @Test
    void shouldDeleteCollectionSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);
        CardRepository cardRepository = mock(CardRepository.class);

        User user = new User(
                "Test User",
                "test@memorizez.com",
                "hashed-password"
        );

        Collection collection = new Collection();
        collection.setName("Inglês");
        collection.setUser(user);

        String collectionId = "collection-1";

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

        when(collectionRepository.findByIdAndUser(
                collectionId,
                user
        )).thenReturn(Optional.of(collection));

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository
                );

        service.delete(collectionId, authentication);

        verify(userRepository)
                .findByEmail("test@memorizez.com");

        verify(collectionRepository)
                .findByIdAndUser(
                        collectionId,
                        user
                );
        verify(collectionRepository)
                .delete(collection);
        verifyNoInteractions(cardRepository);
    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInDelete() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);
        CardRepository cardRepository = mock(CardRepository.class);

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

        when(collectionRepository.findByIdAndUser(
                collectionId,
                user
        )).thenReturn(Optional.empty());

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository
                );

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.delete(
                        collectionId,
                        authentication
                )
        );

        verify(userRepository)
                .findByEmail("test@memorizez.com");
        verify(collectionRepository)
                .findByIdAndUser(
                        collectionId,
                        user
                );
        verify(collectionRepository, never())
                .delete(any(Collection.class));
        verifyNoInteractions(cardRepository);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInDelete() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);
        CardRepository cardRepository = mock(CardRepository.class);

        String collectionId = "collection-1";

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        CollectionService service =
                new CollectionService(
                        collectionRepository,
                        userRepository,
                        cardRepository
                );

        assertThrows(
                UserNotFoundException.class,
                () -> service.delete(
                        collectionId,
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

}
