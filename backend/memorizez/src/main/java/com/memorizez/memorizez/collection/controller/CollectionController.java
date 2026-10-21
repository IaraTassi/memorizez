package com.memorizez.memorizez.collection.controller;

import com.memorizez.memorizez.collection.dto.CollectionResponse;
import com.memorizez.memorizez.collection.dto.CreateCollectionRequest;
import com.memorizez.memorizez.collection.dto.UpdateCollectionRequest;
import com.memorizez.memorizez.collection.service.CollectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@SecurityRequirement(name = "sessionAuth")
@RestController
@RequestMapping("/collections")
@Tag(name = "Collections", description = "Endpoints para gerenciamento de coleções, incluindo criação, listagem, atualização e exclusão.")
public class CollectionController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @PostMapping
    @Operation(summary = "Criar coleção", description = "Cria uma nova coleção para o usuário autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Coleção criada com sucesso."),
            @ApiResponse(responseCode = "400", description = "Dados da coleção inválidos."),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado.")
    })
    public ResponseEntity<Void> create(@Valid @RequestBody CreateCollectionRequest request, Authentication authentication) {

        collectionService.create(request, authentication);

        return ResponseEntity.status(201).build();

    }

    @GetMapping
    @Operation(summary = "Listar coleções", description = "Retorna as coleções pertencentes ao usuário autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Coleções retornadas com sucesso."),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado.")
    })
    public ResponseEntity<List<CollectionResponse>> findAll(Authentication authentication) {

        return ResponseEntity.ok(collectionService.findAll(authentication));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar coleção", description = "Atualiza os dados de uma coleção do usuário autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Coleção atualizada com sucesso."),
            @ApiResponse(responseCode = "400", description = "Dados da coleção inválidos."),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado."),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada.")
    })
    public ResponseEntity<Void> update(@PathVariable String id, @Valid @RequestBody UpdateCollectionRequest request, Authentication authentication) {

        collectionService.update(id, request, authentication);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir coleção", description = "Exclui uma coleção do usuário autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Coleção excluída com sucesso."),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado."),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada.")
    })
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication authentication) {

        collectionService.delete(id, authentication);

        return ResponseEntity.noContent().build();
    }
}
