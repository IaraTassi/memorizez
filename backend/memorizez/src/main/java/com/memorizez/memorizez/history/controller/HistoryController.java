package com.memorizez.memorizez.history.controller;

import com.memorizez.memorizez.history.dto.HistoryCardDetailResponse;
import com.memorizez.memorizez.history.dto.HistoryCardResponse;
import com.memorizez.memorizez.history.dto.HistoryCollectionResponse;
import com.memorizez.memorizez.history.dto.HistoryResponse;
import com.memorizez.memorizez.history.service.HistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@SecurityRequirement(name = "sessionAuth")
@RestController
@RequestMapping("/history")
@Tag(name = "History", description = "Endpoints para consulta do histórico de revisões programadas, permitindo acompanhar o desempenho e identificar lacunas no aprendizado.")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/collections")
    @Operation(summary = "Listar coleções do histórico", description = "Retorna as coleções com registros de revisão disponíveis para consulta no histórico do usuário autenticado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Coleções retornadas com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido")
    })
    public ResponseEntity<List<HistoryCollectionResponse>> findAllCollections(
            Authentication authentication) {

        return ResponseEntity.ok(
                historyService.findAllCollections(authentication)
        );
    }

    @GetMapping("/collections/{collectionId}/cards")
    @Operation(summary = "Listar cartões de uma coleção", description = "Retorna os cartões da coleção informada que estão disponíveis no histórico, com suporte à paginação.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cartões retornados com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido"),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada")
    })
    public ResponseEntity<Page<HistoryCardResponse>> findAllCards(
            @PathVariable String collectionId,
            @ParameterObject Pageable pageable,
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
    @Operation(summary = "Consultar detalhes de uma cartão", description = "Retorna os detalhes do cartão informado no contexto da coleção selecionada.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalhes do cartão retornados com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido"),
            @ApiResponse(responseCode = "404", description = "Coleção ou cartão não encontrado")
    })
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
    @Operation(summary = "Consultar histórico de revisões de um cartão", description = "Retorna os registros das revisões do cartão informado, com suporte à paginação.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Histórico retornado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido"),
            @ApiResponse(responseCode = "404", description = "Coleção ou cartão não encontrado")
    })
    public ResponseEntity<Page<HistoryResponse>> findHistory(
            @PathVariable String collectionId,
            @PathVariable String cardId,
            @ParameterObject Pageable pageable,
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


