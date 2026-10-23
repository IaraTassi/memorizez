package com.memorizez.memorizez.review.controller;

import com.memorizez.memorizez.review.dto.ReviewCollectionResponse;
import com.memorizez.memorizez.review.dto.ReviewResponse;
import com.memorizez.memorizez.review.dto.ReviewResultRequest;
import com.memorizez.memorizez.review.dto.ReviewResultResponse;
import com.memorizez.memorizez.review.service.ReviewService;
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
@RequestMapping("/reviews")
@Tag(name = "Review", description = "Endpoints para revisões programadas, permitindo avaliar o conhecimento, registrar respostas e acompanhar o progresso do usuário.")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    @Operation(summary = "Listar cartões disponíveis para revisão", description = "Retorna os cartões disponíveis para revisão do usuário autenticado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lista de revisões retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido")
    })
    public ResponseEntity<List<ReviewResponse>> findAvailableForReview(
            Authentication authentication) {

        return ResponseEntity.ok(
                reviewService.findAvailableForReview(authentication)
        );
    }

    @GetMapping("/collections")
    @Operation(summary = "Listar coleções disponíveis para revisão", description = "Retorna as coleções que possuem cartões disponíveis para revisão pelo usuário autenticado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Coleções retornadas com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido")
    })
    public ResponseEntity<List<ReviewCollectionResponse>> findCollectionsForReview(
            Authentication authentication) {

        return ResponseEntity.ok(
                reviewService.findCollectionsForReview(authentication)
        );
    }

    @GetMapping("/collections/{collectionId}/cards/{cardId}/review")
    @Operation(summary = "Revelar cartão para revisão", description = "Retorna o conteúdo do cartão para revisão, incluindo o texto da frente, o texto do verso e as observações adicionais, quando disponíveis.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cartão retornado com sucesso" ),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido" ),
            @ApiResponse(responseCode = "404", description = "Coleção ou cartão não encontrado")
    })
    public ResponseEntity<ReviewResponse> reveal(
            @PathVariable String collectionId,
            @PathVariable String cardId,
            Authentication authentication) {

        return ResponseEntity.ok(
                reviewService.reveal(
                        collectionId,
                        cardId,
                        authentication
                )
        );
    }

    @PostMapping("/collections/{collectionId}/cards/{cardId}/result")
    @Operation(summary = "Registrar resultado da revisão", description = "Registra o resultado informado pelo usuário para o cartão revisado.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resultado da revisão registrado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados da requisição inválidos" ),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido"),
            @ApiResponse(responseCode = "404", description = "Coleção ou cartão não encontrado")
    })
    public ResponseEntity<ReviewResultResponse> submitResult(
            @PathVariable("collectionId") String collectionId,
            @PathVariable("cardId") String cardId,
            @Valid @RequestBody ReviewResultRequest request,
            Authentication authentication) {

        ReviewResultResponse response =
                reviewService.submitResult(
                        collectionId,
                        cardId,
                        request,
                        authentication
                );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/collections/{collectionId}/start")
    @Operation(summary = "Iniciar revisão de coleção", description = "Inicia o processo de revisão da coleção selecionada, retornando o conteúdo da frente do cartão.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Revisão iniciada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Usuário não autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso não permitido"),
            @ApiResponse(responseCode = "404", description = "Coleção não encontrada")
    })
    public ResponseEntity<ReviewResponse> startReview(
            @PathVariable String collectionId,
            Authentication authentication) {

        return ResponseEntity.ok(
                reviewService.startReview(
                        collectionId,
                        authentication
                )
        );
    }
}