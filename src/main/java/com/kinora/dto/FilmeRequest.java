package com.kinora.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;
import java.util.List;


public record FilmeRequest(String titulo,
                           String descricao,
                           @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
                           LocalDate dataLancamento,
                           double nota,
                           List<Long> categorias,
                           List<Long> streamings) {
}
