package com.memorizez.memorizez.history.controller;

import com.memorizez.memorizez.history.HistoryAction;
import com.memorizez.memorizez.history.dto.HistoryCardDetailResponse;
import com.memorizez.memorizez.history.dto.HistoryCardResponse;
import com.memorizez.memorizez.history.dto.HistoryCollectionResponse;
import com.memorizez.memorizez.history.dto.HistoryResponse;
import com.memorizez.memorizez.history.service.HistoryService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class HistoryControllerTest {

    @Test
    void shouldFindAllHistoryCollectionsSuccessfully() throws Exception {

        HistoryService historyService = mock(HistoryService.class);
        Authentication authentication = mock(Authentication.class);

        HistoryCollectionResponse collection1 =
                new HistoryCollectionResponse(
                        "collection-1",
                        "Java",
                        36
                );

        HistoryCollectionResponse collection2 =
                new HistoryCollectionResponse(
                        "collection-2",
                        "POO",
                        56
                );

        when(historyService.findAllCollections(authentication))
                .thenReturn(List.of(collection1, collection2));

        HistoryController controller =
                new HistoryController(historyService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(
                        get("/history/collections")
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("collection-1"))
                .andExpect(jsonPath("$[0].name").value("Java"))
                .andExpect(jsonPath("$[0].cardCount").value(36))
                .andExpect(jsonPath("$[1].id").value("collection-2"))
                .andExpect(jsonPath("$[1].name").value("POO"))
                .andExpect(jsonPath("$[1].cardCount").value(56));

        verify(historyService)
                .findAllCollections(authentication);
    }

    @Test
    void shouldFindAllHistoryCardsSuccessfully() throws Exception {

        HistoryService historyService = mock(HistoryService.class);
        Authentication authentication = mock(Authentication.class);

        HistoryCardResponse card1 =
                new HistoryCardResponse(
                        "card-1",
                        "O que é encapsulamento?",
                        12,
                        3,
                        2
                );

        HistoryCardResponse card2 =
                new HistoryCardResponse(
                        "card-2",
                        "O que é herança?",
                        8,
                        2,
                        1
                );

        Page<HistoryCardResponse> page =
                new PageImpl<>(
                        List.of(card1, card2),
                        PageRequest.of(0, 10),
                        2
                );

        when(historyService.findAllCards(
                authentication,
                "collection-1",
                PageRequest.of(0, 10)
        )).thenReturn(page);

        HistoryController controller =
                new HistoryController(historyService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver()
                )
                .build();

        mockMvc.perform(
                        get("/history/collections/collection-1/cards")
                                .param("page", "0")
                                .param("size", "10")
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].id").value("card-1"))
                .andExpect(jsonPath("$.content[0].front")
                        .value("O que é encapsulamento?"))
                .andExpect(jsonPath("$.content[0].rememberedCount").value(12))
                .andExpect(jsonPath("$.content[0].notRememberedCount").value(3))
                .andExpect(jsonPath("$.content[0].editCount").value(2))
                .andExpect(jsonPath("$.content[1].id").value("card-2"))
                .andExpect(jsonPath("$.content[1].front")
                        .value("O que é herança?"))
                .andExpect(jsonPath("$.content[1].rememberedCount").value(8))
                .andExpect(jsonPath("$.content[1].notRememberedCount").value(2))
                .andExpect(jsonPath("$.content[1].editCount").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1));

        verify(historyService)
                .findAllCards(
                        authentication,
                        "collection-1",
                        PageRequest.of(0, 10)
                );
    }

    @Test
    void shouldFindHistoryCardSuccessfully() throws Exception {

        HistoryService historyService = mock(HistoryService.class);
        Authentication authentication = mock(Authentication.class);

        HistoryCardDetailResponse response =
                new HistoryCardDetailResponse(
                        "card-1",
                        "O que é encapsulamento?",
                        12,
                        3,
                        2,
                        LocalDate.of(2026, 9, 15),
                        LocalDate.of(2026, 10, 7)
                );

        when(historyService.findCard(
                authentication,
                "collection-1",
                "card-1"
        )).thenReturn(response);

        HistoryController controller =
                new HistoryController(historyService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(
                        get("/history/collections/collection-1/cards/card-1")
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("card-1"))
                .andExpect(jsonPath("$.front")
                        .value("O que é encapsulamento?"))
                .andExpect(jsonPath("$.rememberedCount").value(12))
                .andExpect(jsonPath("$.notRememberedCount").value(3))
                .andExpect(jsonPath("$.editCount").value(2))
                .andExpect(jsonPath("$.createdAt")
                        .value("2026-09-15"))
                .andExpect(jsonPath("$.nextReviewDate")
                        .value("2026-10-07"));

        verify(historyService)
                .findCard(
                        authentication,
                        "collection-1",
                        "card-1"
                );
    }

    @Test
    void shouldFindHistorySuccessfully() throws Exception {

        HistoryService historyService = mock(HistoryService.class);
        Authentication authentication = mock(Authentication.class);

        HistoryResponse history1 =
                new HistoryResponse(
                        HistoryAction.EDITED,
                        LocalDateTime.of(2026, 9, 29, 10, 30)
                );

        HistoryResponse history2 =
                new HistoryResponse(
                        HistoryAction.REMEMBERED,
                        LocalDateTime.of(2026, 9, 28, 14, 0)
                );

        Page<HistoryResponse> page =
                new PageImpl<>(
                        List.of(history1, history2),
                        PageRequest.of(0, 10),
                        2
                );

        when(historyService.findHistory(
                authentication,
                "collection-1",
                "card-1",
                PageRequest.of(0, 10)
        )).thenReturn(page);

        HistoryController controller =
                new HistoryController(historyService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setCustomArgumentResolvers(
                        new PageableHandlerMethodArgumentResolver()
                )
                .build();

        mockMvc.perform(
                        get("/history/collections/collection-1/cards/card-1/history")
                                .param("page", "0")
                                .param("size", "10")
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].action")
                        .value("EDITED"))
                .andExpect(jsonPath("$.content[0].createdAt")
                        .value("2026-09-29T10:30:00"))
                .andExpect(jsonPath("$.content[1].action")
                        .value("REMEMBERED"))
                .andExpect(jsonPath("$.content[1].createdAt")
                        .value("2026-09-28T14:00:00"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1));

        verify(historyService)
                .findHistory(
                        authentication,
                        "collection-1",
                        "card-1",
                        PageRequest.of(0, 10)
                );
    }

}
