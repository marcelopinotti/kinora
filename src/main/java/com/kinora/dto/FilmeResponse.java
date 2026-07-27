package com.kinora.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
public record FilmeResponse(
        Long id,
        String titulo,
        String descricao,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
        LocalDate dataLancamento,
        double nota,
        List<CategoriaResponse> categorias,
        List<StreamingResponse> streamings) {

}
