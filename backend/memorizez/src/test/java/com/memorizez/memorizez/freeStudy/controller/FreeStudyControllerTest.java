package com.memorizez.memorizez.freeStudy.controller;

import com.memorizez.memorizez.freeStudy.dto.FreeStudyCollectionResponse;
import com.memorizez.memorizez.freeStudy.dto.FreeStudyResponse;
import com.memorizez.memorizez.freeStudy.service.FreeStudyService;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class FreeStudyControllerTest {

    @Test
    void shouldFindCollectionsForFreeStudySuccessfully() throws Exception {

        FreeStudyService freeStudyService = mock(FreeStudyService.class);
        Authentication authentication = mock(Authentication.class);

        List<FreeStudyCollectionResponse> responses =
                List.of(
                        new FreeStudyCollectionResponse(
                                "collection-1",
                                "POO",
                                56
                        ),
                        new FreeStudyCollectionResponse(
                                "collection-2",
                                "Java",
                                32
                        )
                );

        when(freeStudyService.findCollectionsForFreeStudy(
                authentication
        )).thenReturn(responses);

        FreeStudyController controller =
                new FreeStudyController(freeStudyService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(
                        get("/free-study/collections")
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("collection-1"))
                .andExpect(jsonPath("$[0].name").value("POO"))
                .andExpect(jsonPath("$[0].cardCount").value(56))
                .andExpect(jsonPath("$[1].id").value("collection-2"))
                .andExpect(jsonPath("$[1].name").value("Java"))
                .andExpect(jsonPath("$[1].cardCount").value(32));

        verify(freeStudyService)
                .findCollectionsForFreeStudy(authentication);
    }

    @Test
    void shouldFindFirstCardForFreeStudySuccessfully() throws Exception {

        FreeStudyService freeStudyService = mock(FreeStudyService.class);
        Authentication authentication = mock(Authentication.class);

        FreeStudyResponse response =
                new FreeStudyResponse(
                        "card-1",
                        "collection-1",
                        "What is encapsulation?",
                        null,
                        null
                );

        when(freeStudyService.findFirstCard(
                "collection-1",
                authentication
        )).thenReturn(Optional.of(response));

        FreeStudyController controller =
                new FreeStudyController(freeStudyService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(
                        get("/free-study/collections/collection-1")
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cardId").value("card-1"))
                .andExpect(jsonPath("$.collectionId").value("collection-1"))
                .andExpect(jsonPath("$.front")
                        .value("What is encapsulation?"))
                .andExpect(jsonPath("$.back").doesNotExist())
                .andExpect(jsonPath("$.notes").doesNotExist());

        verify(freeStudyService)
                .findFirstCard(
                        "collection-1",
                        authentication
                );
    }

    @Test
    void shouldReturnNoContentWhenCollectionHasNoCards() throws Exception {

        FreeStudyService freeStudyService = mock(FreeStudyService.class);
        Authentication authentication = mock(Authentication.class);

        when(freeStudyService.findFirstCard(
                "collection-1",
                authentication
        )).thenReturn(Optional.empty());

        FreeStudyController controller =
                new FreeStudyController(freeStudyService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(
                        get("/free-study/collections/collection-1")
                                .principal(authentication)
                )
                .andExpect(status().isNoContent());

        verify(freeStudyService)
                .findFirstCard(
                        "collection-1",
                        authentication
                );
    }

    @Test
    void shouldRevealCardSuccessfullyInFreeBack() throws Exception {

        FreeStudyService freeStudyService = mock(FreeStudyService.class);
        Authentication authentication = mock(Authentication.class);

        FreeStudyResponse response =
                new FreeStudyResponse(
                        "card-1",
                        "collection-1",
                        "What is encapsulation?",
                        "O que é encapsulamento",
                        "Princípio da POO."
                );

        when(freeStudyService.freeBack(
                "collection-1",
                "card-1",
                authentication
        )).thenReturn(response);

        FreeStudyController controller =
                new FreeStudyController(freeStudyService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(
                        get("/free-study/collections/collection-1/cards/card-1/back")
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cardId").value("card-1"))
                .andExpect(jsonPath("$.collectionId").value("collection-1"))
                .andExpect(jsonPath("$.front")
                        .value("What is encapsulation?"))
                .andExpect(jsonPath("$.back")
                        .value("O que é encapsulamento"))
                .andExpect(jsonPath("$.notes")
                        .value("Princípio da POO."));

        verify(freeStudyService)
                .freeBack(
                        "collection-1",
                        "card-1",
                        authentication
                );
    }

    @Test
    void shouldFindNextCardSuccessfullyInFreeNext() throws Exception {

        FreeStudyService freeStudyService = mock(FreeStudyService.class);
        Authentication authentication = mock(Authentication.class);

        FreeStudyResponse response =
                new FreeStudyResponse(
                        "card-2",
                        "collection-1",
                        "What is encapsulation?",
                        null,
                        null
                );

        when(freeStudyService.freeNext(
                "collection-1",
                "card-1",
                authentication
        )).thenReturn(Optional.of(response));

        FreeStudyController controller =
                new FreeStudyController(freeStudyService);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();

        mockMvc.perform(
                        get("/free-study/collections/collection-1/cards/card-1")
                                .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cardId").value("card-2"))
                .andExpect(jsonPath("$.collectionId").value("collection-1"))
                .andExpect(jsonPath("$.front")
                        .value("What is encapsulation?"))
                .andExpect(jsonPath("$.back").value(nullValue()))
                .andExpect(jsonPath("$.notes").value(nullValue()));

        verify(freeStudyService)
                .freeNext(
                        "collection-1",
                        "card-1",
                        authentication
                );
    }

}
