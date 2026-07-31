package com.kinora.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.kinora.domain.Tipo;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;


public record FilmeRequest(@NotBlank @Size(max = 255) String titulo,
                           String descricao,
                           @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
                           LocalDate dataLancamento,
                           @DecimalMin("0.0") @DecimalMax("10.0") double nota,
                           Tipo tipo,
                           @Size(max = 500) String posterUrl,
                           List<Long> categorias,
                           List<Long> streamings) {

    // Default aqui e não no service: save e atualizar pegam de graça, e request
    // sem tipo (clientes antigos) continua valendo como filme.
    public FilmeRequest {
        if (tipo == null) tipo = Tipo.FILME;
    }
}
