package com.memorizez.memorizez.review.service;

import com.memorizez.memorizez.card.Card;
import com.memorizez.memorizez.card.exception.CardNotFoundException;
import com.memorizez.memorizez.card.repository.CardRepository;
import com.memorizez.memorizez.collection.Collection;
import com.memorizez.memorizez.collection.exeption.CollectionNotFoundException;
import com.memorizez.memorizez.collection.repository.CollectionRepository;
import com.memorizez.memorizez.review.Review;
import com.memorizez.memorizez.review.ReviewResult;
import com.memorizez.memorizez.review.ReviewStage;
import com.memorizez.memorizez.review.dto.ReviewResponse;
import com.memorizez.memorizez.review.dto.ReviewResultRequest;
import com.memorizez.memorizez.review.dto.ReviewResultResponse;
import com.memorizez.memorizez.review.exception.CardNotAvailableForReviewException;
import com.memorizez.memorizez.review.exception.CardNotRevealedException;
import com.memorizez.memorizez.review.repository.ReviewRepository;
import com.memorizez.memorizez.user.User;
import com.memorizez.memorizez.user.exception.UserNotFoundException;
import com.memorizez.memorizez.user.repository.UserRepository;
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
                        userRepository
                );

        List<ReviewResponse> response =
                service.findAvailableForReview(authentication);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFoundInFindAvailableForReview() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        Authentication authentication = mock(Authentication.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);

        when(authentication.getName())
                .thenReturn("unknown@memorizez.com");

        when(userRepository.findByEmail("unknown@memorizez.com"))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository
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
                        userRepository
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
    }

    @Test
    void shouldRevealExistingReviewSuccessfully() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
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
                        userRepository
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
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotAvailableForReview() {
        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
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
                        userRepository
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
                        userRepository
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
                        userRepository
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
                        userRepository
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

        verify(cardRepository, never())
                .save(any());
    }

    @Test
    void shouldThrowExceptionWhenReviewIsNotFoundInSubmitResult() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
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
        card.setBack("O que é encapsulamento");
        card.setCollection(collection);

        String collectionId = "collection-1";
        String cardId = "card-1";

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

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
                        userRepository
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

        verify(reviewRepository)
                .findByCard(card);

        verify(reviewRepository, never())
                .save(any(Review.class));

        verify(cardRepository, never())
                .save(any(Card.class));
    }

    @Test
    void shouldThrowExceptionWhenCardIsNotRevealedInSubmitResult() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
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
                        userRepository
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

        verify(reviewRepository)
                .findByCard(card);

        verify(reviewRepository, never())
                .save(any(Review.class));

        verify(cardRepository, never())
                .save(any(Card.class));
    }

    @Test
    void shouldProcessFirstRememberedResultSuccessfully() {

        UserRepository userRepository = mock(UserRepository.class);
        CollectionRepository collectionRepository = mock(CollectionRepository.class);
        CardRepository cardRepository = mock(CardRepository.class);
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
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

        Card nextCard = new Card();
        nextCard.setFront("What is inheritance?");
        nextCard.setBack("O que é herança");
        nextCard.setNotes("Inheritance allows reuse.");
        nextCard.setCollection(collection);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

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

        when(cardRepository.findAvailableForReview(user, LocalDate.now()))
                .thenReturn(List.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository
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
                ReviewStage.ONE_DAY,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(1),
                review.getNextReviewDate()
        );

        assertNull(review.getRevealedAt());

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

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findAvailableForReview(
                        user,
                        LocalDate.now()
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
        review.setStage(null);
        review.setNextReviewDate(null);
        review.setRevealedAt(LocalDateTime.now());

        Card nextCard = new Card();
        nextCard.setFront("What is inheritance?");
        nextCard.setBack("O que é herança");
        nextCard.setNotes("Inheritance allows reuse.");
        nextCard.setCollection(collection);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.NOT_REMEMBERED);

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

        when(cardRepository.findAvailableForReview(user, LocalDate.now()))
                .thenReturn(List.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository
                );

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
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

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findAvailableForReview(
                        user,
                        LocalDate.now()
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
        review.setStage(ReviewStage.ONE_DAY);
        review.setNextReviewDate(LocalDate.now().plusDays(1));
        review.setRevealedAt(LocalDateTime.now());

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        Card nextCard = new Card();
        nextCard.setFront("What is inheritance?");
        nextCard.setBack("O que é herança");
        nextCard.setNotes("Inheritance allows reuse.");
        nextCard.setCollection(collection);

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

        when(cardRepository.findAvailableForReview(user, LocalDate.now()))
                .thenReturn(List.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository
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

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findAvailableForReview(
                        user,
                        LocalDate.now()
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
        review.setNextReviewDate(LocalDate.now().plusDays(1));
        review.setRevealedAt(LocalDateTime.now());

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        Card nextCard = new Card();
        nextCard.setFront("What is inheritance?");
        nextCard.setBack("O que é herança");
        nextCard.setNotes("Inheritance allows reuse.");
        nextCard.setCollection(collection);

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

        when(cardRepository.findAvailableForReview(user, LocalDate.now()))
                .thenReturn(List.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository
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

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findAvailableForReview(
                        user,
                        LocalDate.now()
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
        review.setStage(ReviewStage.FIFTEEN_DAYS);
        review.setNextReviewDate(LocalDate.now().plusDays(1));
        review.setRevealedAt(LocalDateTime.now());

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        Card nextCard = new Card();
        nextCard.setFront("What is inheritance?");
        nextCard.setBack("O que é herança");
        nextCard.setNotes("Inheritance allows reuse.");
        nextCard.setCollection(collection);

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

        when(cardRepository.findAvailableForReview(user, LocalDate.now()))
                .thenReturn(List.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository
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

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findAvailableForReview(
                        user,
                        LocalDate.now()
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
        review.setStage(ReviewStage.THIRTY_DAYS);
        review.setNextReviewDate(LocalDate.now().plusDays(1));
        review.setRevealedAt(LocalDateTime.now());

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.REMEMBERED);

        Card nextCard = new Card();
        nextCard.setFront("What is inheritance?");
        nextCard.setBack("O que é herança");
        nextCard.setNotes("Inheritance allows reuse.");
        nextCard.setCollection(collection);

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

        when(cardRepository.findAvailableForReview(user, LocalDate.now()))
                .thenReturn(List.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository
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

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findAvailableForReview(
                        user,
                        LocalDate.now()
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
        review.setStage(ReviewStage.FIFTEEN_DAYS);
        review.setNextReviewDate(LocalDate.now().plusDays(15));
        review.setRevealedAt(LocalDateTime.now());

        Card nextCard = new Card();
        nextCard.setFront("What is inheritance?");
        nextCard.setBack("O que é herança");
        nextCard.setNotes("Inheritance allows reuse.");
        nextCard.setCollection(collection);

        ReviewResultRequest request = new ReviewResultRequest();
        request.setResult(ReviewResult.NOT_REMEMBERED);

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

        when(cardRepository.findAvailableForReview(user, LocalDate.now()))
                .thenReturn(List.of(nextCard));

        when(reviewRepository.findByCard(nextCard))
                .thenReturn(Optional.empty());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository
                );

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
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

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findAvailableForReview(
                        user,
                        LocalDate.now()
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

        when(cardRepository.findAvailableForReview(user, LocalDate.now()))
                .thenReturn(List.of());

        ReviewService service =
                new ReviewService(
                        reviewRepository,
                        cardRepository,
                        collectionRepository,
                        userRepository
                );

        ReviewResultResponse response =
                service.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        assertTrue(response.isCompleted());
        assertNull(response.getNextCard());

        assertEquals(1, card.getRememberedCount());

        assertEquals(
                ReviewStage.FIFTEEN_DAYS,
                review.getStage()
        );

        assertEquals(
                LocalDate.now().plusDays(15),
                review.getNextReviewDate()
        );

        assertNull(review.getRevealedAt());

        verify(reviewRepository)
                .save(review);

        verify(cardRepository)
                .save(card);

        verify(cardRepository)
                .findAvailableForReview(
                        user,
                        LocalDate.now()
                );
    }

}
