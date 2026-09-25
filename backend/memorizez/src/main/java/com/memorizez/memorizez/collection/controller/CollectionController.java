package com.memorizez.memorizez.collection.controller;

import com.memorizez.memorizez.collection.dto.CollectionResponse;
import com.memorizez.memorizez.collection.dto.CreateCollectionRequest;
import com.memorizez.memorizez.collection.dto.UpdateCollectionRequest;
import com.memorizez.memorizez.collection.service.CollectionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/collections")
public class CollectionController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping
    public ResponseEntity<Void> create(@Valid @RequestBody CreateCollectionRequest request, Authentication authentication) {

        collectionService.create(request, authentication);

        return ResponseEntity.status(201).build();

    }

    @GetMapping
    public ResponseEntity<List<CollectionResponse>> findAll(Authentication authentication) {

        return ResponseEntity.ok(collectionService.findAll(authentication));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable String id, @Valid @RequestBody UpdateCollectionRequest request, Authentication authentication) {

        collectionService.update(id, request, authentication);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication authentication) {

        collectionService.delete(id, authentication);

        return ResponseEntity.noContent().build();
    }
}
