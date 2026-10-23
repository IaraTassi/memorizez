package com.memorizez.memorizez.card.controller;

import com.memorizez.memorizez.card.dto.CardResponse;
import com.memorizez.memorizez.card.dto.CreateCardRequest;
import com.memorizez.memorizez.card.dto.UpdateCardRequest;
import com.memorizez.memorizez.card.service.CardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@SecurityRequirement(name = "sessionAuth")
@RestController
@RequestMapping("/collections/{collectionId}/cards")
@Tag(name = "Cards", description = "Endpoints para gerenciamento de cartões de estudo, incluindo criação, listagem, atualização e exclusão dentro de uma coleção.")
public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @PostMapping
    @Operation(summary = "Criar cartão", description = "Cria um cartão na coleção do usuário autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Cartão criado com sucesso."),
            @ApiResponse(responseCode = "400", description = "Dados do cartão inválidos."),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado."),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada.")
    })
    public ResponseEntity<Void> create(@PathVariable String collectionId, @Valid @RequestBody CreateCardRequest request, Authentication authentication) {

        cardService.create(collectionId, request, authentication);

        return ResponseEntity.status(201).build();
    }

    @GetMapping
    @Operation(summary = "Listar cartões", description = "Retorna os cartões da coleção informada, com suporte à paginação.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cartões retornados com sucesso."),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado."),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada.")
    })
    public ResponseEntity<Page<CardResponse>> findAll(@PathVariable String collectionId, @ParameterObject Pageable pageable, Authentication authentication) {

        return ResponseEntity.ok(cardService.findAll(collectionId, pageable, authentication));
    }

    @PutMapping("/{cardId}")
    @Operation(summary = "Atualizar cartão", description = "Atualiza os dados de um cartão pertencente a uma coleção do usuário autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Cartão atualizado com sucesso."),
            @ApiResponse(responseCode = "400", description = "Dados do cartão inválidos."),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado."),
            @ApiResponse(responseCode = "404", description = "Coleção ou cartão não encontrado.")
    })
    public ResponseEntity<Void> update(@PathVariable String collectionId, @PathVariable String cardId, @Valid @RequestBody UpdateCardRequest request, Authentication authentication) {

        cardService.update(collectionId, cardId, request, authentication);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{cardId}")
    @Operation(summary = "Excluir cartão", description = "Exclui um cartão pertencente a uma coleção do usuário autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Cartão excluído com sucesso."),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado."),
            @ApiResponse(responseCode = "404", description = "Coleção ou cartão não encontrado.")
    })
    public ResponseEntity<Void> delete(@PathVariable String collectionId, @PathVariable String cardId, Authentication authentication) {

        cardService.delete(collectionId, cardId, authentication);

        return ResponseEntity.noContent().build();
    }
}
