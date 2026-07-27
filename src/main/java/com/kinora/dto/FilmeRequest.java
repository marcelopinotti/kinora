package com.kinora.dto;

import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Builder
public record FilmeRequest(String titulo,
                           String descricao,
                           LocalDate dataLancamento,
                           double nota,
                           List<Long> categorias,
                           List<Long> streamings) {
}
