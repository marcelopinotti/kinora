package com.kinora.dto;

import com.kinora.domain.Categoria;
import lombok.experimental.UtilityClass;

@UtilityClass
public class CategoriaMapper {

    public static Categoria toRequest(CategoriaRequest res){
        return Categoria.builder()
                .nome(res.nome())
                .build();
    }

    public static CategoriaResponse toResponse(Categoria categoria){
        return new CategoriaResponse(
                categoria.getId(),
                categoria.getNome()
        );
    }

}
