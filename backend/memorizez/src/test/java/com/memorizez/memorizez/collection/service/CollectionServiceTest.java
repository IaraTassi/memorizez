package com.memorizez.memorizez.collection.service;

import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.dto.CollectionResponse;
import com.memorizez.memorizez.collection.dto.CreateCollectionRequest;
import com.memorizez.memorizez.collection.dto.UpdateCollectionRequest;
import com.memorizez.memorizez.collection.exeption.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

public class CollectionServiceTest {

    @Test
    void shouldCreateCollectionSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);

        User user = new User("Test User", "test@memorizez.com", "hashed-password");

        when(authentication.getName())
                .thenReturn("test@memorizez.com");

        when(userRepository.findByEmail("test@memorizez.com"))
                .thenReturn(Optional.of(user));

    CreateCollectionRequest request = new CreateCollectionRequest();
    request.setName("Inglês");

    CollectionService service =
            new CollectionService(collectionRepository, userRepository);

    service.create(request, authentication);

        ArgumentCaptor<Collection> captor = ArgumentCaptor.forClass(Collection.class);

        verify(collectionRepository).save(captor.capture());

        Collection collection = captor.getValue();

        assertEquals("Inglês", collection.getName());
        assertEquals(user, collection.getUser());
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInCreate() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        CreateCollectionRequest request = new CreateCollectionRequest();
        request.setName("Inglês");

        CollectionService service = new CollectionService(collectionRepository, userRepository);

        assertThrows(UserNotFoundException.class, () -> service.create(request, authentication));

        verify(collectionRepository, never()).save(any());

    }

    @Test
    void shouldFindAllCollectionsSuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);

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

        CollectionService service =
                new CollectionService(collectionRepository, userRepository);

        List<CollectionResponse> response = service.findAll(authentication);

        assertEquals(2, response.size());
        assertEquals("Inglês", response.get(0).getName());
        assertEquals("Java", response.get(1).getName());

        verify(collectionRepository)
                .findAllByUserOrderByCreatedAtDesc(user);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindAll() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        CollectionService service =
                new CollectionService(collectionRepository, userRepository);

        assertThrows(UserNotFoundException.class, () -> service.findAll(authentication));

        verify(collectionRepository, never()).findAllByUserOrderByCreatedAtDesc(any());

    }

    @Test
    void shouldUpdateCollectionSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
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

        String collectionId = "collection-1";

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        UpdateCollectionRequest request = new UpdateCollectionRequest();
        request.setName("Java");

        CollectionService service =
                new CollectionService(collectionRepository, userRepository);

        service.update(collectionId, request, authentication);

        ArgumentCaptor<Collection> captor =
                ArgumentCaptor.forClass(Collection.class);

        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

        verify(collectionRepository).save(captor.capture());

        Collection updatedCollection = captor.getValue();

        assertEquals("Java", updatedCollection.getName());
        assertEquals(user, updatedCollection.getUser());

    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInUpdate() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
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

        String collectionId = "collection-1";

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.empty());

        UpdateCollectionRequest request = new UpdateCollectionRequest();
        request.setName("Java");

        CollectionService service = new CollectionService(collectionRepository, userRepository);

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

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        String collectionId = "collection-1";

        UpdateCollectionRequest request = new UpdateCollectionRequest();
        request.setName("Java");

        CollectionService service =
                new CollectionService(collectionRepository, userRepository);

        assertThrows(
                UserNotFoundException.class,
                () -> service.update(collectionId, request, authentication)
        );

        verify(collectionRepository, never())
                .findByIdAndUser(anyString(), any());

        verify(collectionRepository, never()).save(any());

    }

    @Test
    void shouldDeleteCollectionSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
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

        String collectionId = "collection-1";

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.of(collection));

        CollectionService service =
                new CollectionService(collectionRepository, userRepository);

        service.delete(collectionId, authentication);

        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

        verify(collectionRepository)
                .delete(collection);

    }

    @Test
    void shouldThrowExceptionWhenCollectionIsNotFoundInDelete() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
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

        String collectionId = "collection-1";

        when(collectionRepository.findByIdAndUser(collectionId, user))
                .thenReturn(Optional.empty());

        CollectionService service = new CollectionService(collectionRepository, userRepository);

        assertThrows(
                CollectionNotFoundException.class,
                () -> service.delete(collectionId, authentication)
        );

        verify(collectionRepository, never()).delete(any());
        verify(collectionRepository)
                .findByIdAndUser(collectionId, user);

    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInDelete() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        Authentication authentication = mock(Authentication.class);

       when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        String collectionId = "collection-1";

       CollectionService service = new CollectionService(collectionRepository, userRepository);

        assertThrows(
                UserNotFoundException.class,
                () -> service.delete(collectionId, authentication)
        );

        verify(collectionRepository, never()).delete(any());
        verify(collectionRepository, never())
                .findByIdAndUser(anyString(), any());

    }

}
