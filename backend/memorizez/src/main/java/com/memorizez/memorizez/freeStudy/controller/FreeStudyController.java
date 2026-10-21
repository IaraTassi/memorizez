package com.memorizez.memorizez.freeStudy.controller;

import com.memorizez.memorizez.freeStudy.dto.FreeStudyCollectionResponse;
import com.memorizez.memorizez.freeStudy.dto.FreeStudyResponse;
import com.memorizez.memorizez.freeStudy.service.FreeStudyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@SecurityRequirement(name = "sessionAuth")
@RestController
@RequestMapping("/free-study")
@Tag(name = "Free Study", description = "Endpoints para estudo livre dos cartões de uma coleção, sem interferir nos registros de revisão programada.")
public class FreeStudyController {

    private final FreeStudyService freeStudyService;

    public FreeStudyController(FreeStudyService freeStudyService) {
        this.freeStudyService = freeStudyService;
    }

    @GetMapping("/collections")
    @Operation(summary = "Listar coleções para estudo livre", description = "Retorna as coleções para estudo livre do usuário autenticado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Coleções retornadas com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido")
    })
    public ResponseEntity<List<FreeStudyCollectionResponse>> findCollectionsForFreeStudy(
            Authentication authentication) {

        return ResponseEntity.ok(
                freeStudyService.findCollectionsForFreeStudy(authentication)
        );
    }

    @GetMapping("/collections/{collectionId}")
    @Operation(summary = "Buscar primeiro cartão da coleção", description = "Retorna o conteúdo da frente do primeiro cartão da coleção selecionada para estudo livre.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Frente do cartão retornado com sucesso"),
            @ApiResponse(responseCode = "204", description = "Nenhum cartão disponível para retornar"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido")
    })
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
    @Operation(summary = "Consultar verso do cartão", description = "Retorna o conteúdo do cartão para estudo livre, incluindo o texto da frente, o texto do verso e as observações adicionais, quando disponíveis")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Verso do cartão retornado com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido"),
            @ApiResponse(responseCode = "404", description = "Coleção ou cartão não encontrada")
    })
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
    @Operation(summary = "Avançar para o próximo cartão", description = "Retorna o próximo cartão da coleção durante o estudo livre, considerando a posição do cartão informado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Próximo cartão retornado com sucesso"),
            @ApiResponse(responseCode = "204", description = "Não há próximo cartão disponível"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido")
    })
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