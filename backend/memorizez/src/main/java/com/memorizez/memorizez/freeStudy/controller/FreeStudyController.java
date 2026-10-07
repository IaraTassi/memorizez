package com.memorizez.memorizez.freeStudy.controller;

import com.memorizez.memorizez.freeStudy.dto.FreeStudyCollectionResponse;
import com.memorizez.memorizez.freeStudy.dto.FreeStudyResponse;
import com.memorizez.memorizez.freeStudy.service.FreeStudyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/free-study")
public class FreeStudyController {

    private final FreeStudyService freeStudyService;

    public FreeStudyController(FreeStudyService freeStudyService) {
        this.freeStudyService = freeStudyService;
    }

    @GetMapping("/collections")
    public ResponseEntity<List<FreeStudyCollectionResponse>> findCollectionsForFreeStudy(
            Authentication authentication) {

        return ResponseEntity.ok(
                freeStudyService.findCollectionsForFreeStudy(authentication)
        );
    }

    @GetMapping("/collections/{collectionId}")
    public ResponseEntity<FreeStudyResponse> findFirstCard(
            @PathVariable String collectionId,
            Authentication authentication) {

        return freeStudyService
                .findFirstCard(collectionId, authentication)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.noContent().build()
                );
    }

    @GetMapping("/collections/{collectionId}/cards/{cardId}/back")
    public ResponseEntity<FreeStudyResponse> freeBack(
            @PathVariable String collectionId,
            @PathVariable String cardId,
            Authentication authentication) {

        return ResponseEntity.ok(
                freeStudyService.freeBack(
                        collectionId,
                        cardId,
                        authentication
                )
        );
    }


    @GetMapping("/collections/{collectionId}/cards/{cardId}")
    public ResponseEntity<FreeStudyResponse> freeNext(
            @PathVariable String collectionId,
            @PathVariable String cardId,
            Authentication authentication) {

        return freeStudyService
                .freeNext(collectionId, cardId, authentication)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.noContent().build()
                );
    }


}