package com.memorizez.memorizez.collection.controller;

import com.memorizez.memorizez.collection.dto.CollectionResponse;
import com.memorizez.memorizez.collection.dto.CreateCollectionRequest;
import com.memorizez.memorizez.collection.dto.UpdateCollectionRequest;
import com.memorizez.memorizez.collection.service.CollectionService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class CollectionControllerTest {

    private final CollectionService collectionService = mock(CollectionService.class);
    private final CollectionController collectionController = new CollectionController(collectionService);
    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(collectionController).build();

    @Test
    void shouldCreateCollectionSuccessfully() throws Exception {
        Authentication authentication = mock(Authentication.class);

        mockMvc.perform(
                        post("/collections")
                                .principal(authentication)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                            {
                                "name": "Inglês"
                            }
                            """)
                )
                .andExpect(status().isCreated());

        verify(collectionService).create(any(CreateCollectionRequest.class), eq(authentication));
    }

    @Test
    void
    shouldFindAllCollectionsSuccessfully() throws Exception {
        Authentication authentication = mock(Authentication.class);

        CollectionResponse collection1 =
                new CollectionResponse("1", "Inglês", LocalDate.now(), 0);

        CollectionResponse collection2 =
                new CollectionResponse("2", "Java", LocalDate.now(), 0);

        when(collectionService.findAll(authentication))
                .thenReturn(List.of(collection1, collection2));

        mockMvc.perform(
                get("/collections")
                        .principal(authentication)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Inglês"))
                .andExpect(jsonPath("$[1].name").value("Java"));

        verify(collectionService).findAll(authentication);

    }

    @Test
    void shouldUpdateCollectionSuccessfully() throws Exception {

        Authentication authentication = mock(Authentication.class);

        String collectionId = "collection-1";

        mockMvc.perform(
                        put("/collections/{id}", collectionId)
                                .principal(authentication)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                    {
                                        "name": "Java"
                                    }
                                    """)
                )
                .andExpect(status().isNoContent());

        verify(collectionService)
                .update(
                        eq(collectionId),
                        any(UpdateCollectionRequest.class),
                        eq(authentication)
                );
    }

    @Test
    void shouldDeleteCollectionSuccessfully() throws Exception {
        Authentication authentication = mock(Authentication.class);

        String collectionId = "collection-1";

        mockMvc.perform(
                        delete("/collections/{id}", collectionId)
                                .principal(authentication)
                )
                .andExpect(status().isNoContent());

        verify(collectionService)
                .delete(eq(collectionId), eq(authentication));
    }

}
