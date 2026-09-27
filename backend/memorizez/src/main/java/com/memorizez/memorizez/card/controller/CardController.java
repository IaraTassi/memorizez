package com.memorizez.memorizez.card.controller;

import com.memorizez.memorizez.card.dto.CardResponse;
import com.memorizez.memorizez.card.dto.CreateCardRequest;
import com.memorizez.memorizez.card.dto.UpdateCardRequest;
import com.memorizez.memorizez.card.service.CardService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/collections/{collectionId}/cards")
public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @PostMapping
    public ResponseEntity<Void> create(@PathVariable String collectionId, @Valid @RequestBody CreateCardRequest request, Authentication authentication) {

        cardService.create(collectionId, request, authentication);

        return ResponseEntity.status(201).build();
    }

    @GetMapping
    public ResponseEntity<Page<CardResponse>> findAll(@PathVariable String collectionId, Pageable pageable, Authentication authentication) {

        return ResponseEntity.ok(cardService.findAll(collectionId, pageable, authentication));
    }

    @PutMapping("/{cardId}")
    public ResponseEntity<Void> update(@PathVariable String collectionId, @PathVariable String cardId, @Valid @RequestBody UpdateCardRequest request, Authentication authentication) {

        cardService.update(collectionId, cardId, request, authentication);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<Void> delete(@PathVariable String collectionId, @PathVariable String cardId, Authentication authentication) {

        cardService.delete(collectionId, cardId, authentication);

        return ResponseEntity.noContent().build();
    }
}
