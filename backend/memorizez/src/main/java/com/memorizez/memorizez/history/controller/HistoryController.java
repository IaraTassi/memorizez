package com.memorizez.memorizez.history.controller;

import com.memorizez.memorizez.history.dto.HistoryCardDetailResponse;
import com.memorizez.memorizez.history.dto.HistoryCardResponse;
import com.memorizez.memorizez.history.dto.HistoryCollectionResponse;
import com.memorizez.memorizez.history.dto.HistoryResponse;
import com.memorizez.memorizez.history.service.HistoryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/history")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/collections")
    public ResponseEntity<List<HistoryCollectionResponse>> findAllCollections(
            Authentication authentication) {

        return ResponseEntity.ok(
                historyService.findAllCollections(authentication)
        );
    }

    @GetMapping("/collections/{collectionId}/cards")
    public ResponseEntity<Page<HistoryCardResponse>> findAllCards(
            @PathVariable String collectionId,
            Pageable pageable,
            Authentication authentication) {

        return ResponseEntity.ok(
                historyService.findAllCards(
                        authentication,
                        collectionId,
                        pageable
                )
        );
    }

    @GetMapping("/collections/{collectionId}/cards/{cardId}")
    public ResponseEntity<HistoryCardDetailResponse> findCard(
            @PathVariable String collectionId,
            @PathVariable String cardId,
            Authentication authentication) {

        return ResponseEntity.ok(
                historyService.findCard(
                        authentication,
                        collectionId,
                        cardId
                )
        );
    }

    @GetMapping("/collections/{collectionId}/cards/{cardId}/history")
    public ResponseEntity<Page<HistoryResponse>> findHistory(
            @PathVariable String collectionId,
            @PathVariable String cardId,
            Pageable pageable,
            Authentication authentication) {

        return ResponseEntity.ok(
                historyService.findHistory(
                        authentication,
                        collectionId,
                        cardId,
                        pageable
                )
        );
    }
}


