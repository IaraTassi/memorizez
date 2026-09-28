package com.memorizez.memorizez.card.controller;

import com.memorizez.memorizez.card.dto.CardResponse;
import com.memorizez.memorizez.card.dto.CreateCardRequest;
import com.memorizez.memorizez.card.dto.UpdateCardRequest;
import com.memorizez.memorizez.card.service.CardService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class CardControllerTest {

    private final CardService cardService = mock(CardService.class);
    private final CardController cardController = new CardController(cardService);
    private final MockMvc mockMvc =
            MockMvcBuilders
                    .standaloneSetup(cardController)
                    .setCustomArgumentResolvers(
                            new PageableHandlerMethodArgumentResolver()
                    )
                    .build();

    @Test
    void shouldCreateCardSuccessfully() throws Exception {
        Authentication authentication = mock(Authentication.class);

        String collectionId = "collection-1";

        mockMvc.perform(
                        post("/collections/{collectionId}/cards", collectionId)
                                .principal(authentication)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                            "front": "What is inheritance in OOP?",
                                            "back": "What is inheritance in object-oriented programming?",
                                            "notes": "Inheritance allows a class to reuse attributes and methods from another class."                            }
                                        """)
                )
                .andExpect(status().isCreated());

        verify(cardService).create(eq(collectionId), any(CreateCardRequest.class), eq(authentication));
    }


    @Test
    void shouldFindAllCardsSuccessfully() throws Exception {
        Authentication authentication = mock(Authentication.class);

        String collectionId = "collection-1";
        CardResponse card1 =
                new CardResponse(
                        "1",
                        "What is inheritance in OOP?",
                        "What is inheritance in object-oriented programming?",
                        "Inheritance allows a class to reuse attributes and methods from another class.",
                        LocalDate.now(),
                        0, 0, 0
                );

        CardResponse card2 =
                new CardResponse(
                        "2",
                        "O que é Spring Boot?",
                        "Framework Java para desenvolvimento de aplicações",
                        "Usado no desenvolvimento da API do projeto",
                        LocalDate.now(),
                        0, 0, 0
                );

        Pageable pageable = PageRequest.of(0, 20);

        Page<CardResponse> cards =
                new PageImpl<>(
                        List.of(card1, card2),
                        pageable,
                        2
                );

        when(cardService.findAll(eq(collectionId), any(Pageable.class), eq(authentication)))
                .thenReturn(cards);

        mockMvc.perform(
                        get("/collections/{collectionId}/cards", collectionId)
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].front").value("What is inheritance in OOP?"))
                .andExpect(jsonPath("$.content[1].front").value("O que é Spring Boot?"));

        verify(cardService)
                .findAll(
                        eq(collectionId),
                        any(Pageable.class),
                        eq(authentication)
                );
    }

    @Test
    void shouldUpdateCardSuccessfully() throws Exception {

        Authentication authentication = mock(Authentication.class);

        String collectionId = "collection-1";
        String cardId = "card-1";

        mockMvc.perform(
                        put("/collections/{collectionId}/cards/{cardId}", collectionId, cardId)
                                .principal(authentication)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {
                                            "front": "What is inheritance in OOP?",
                                            "back": "What is inheritance in object-oriented programming?",
                                            "notes": ""
                                        }
                                        """)
                )
                .andExpect(status().isNoContent());

        verify(cardService)
                .update(
                        eq(collectionId),
                        eq(cardId),
                        any(UpdateCardRequest.class),
                        eq(authentication)
                );
    }


    @Test
    void shouldDeleteCardSuccessfully() throws Exception {
        Authentication authentication = mock(Authentication.class);

        String collectionId = "collection-1";
        String cardId = "card-1";

        mockMvc.perform(
                        delete("/collections/{collectionId}/cards/{cardId}", collectionId, cardId)
                                .principal(authentication)
                )
                .andExpect(status().isNoContent());

        verify(cardService)
                .delete(eq(collectionId), eq(cardId), eq(authentication));
    }
}
