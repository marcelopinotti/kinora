package com.kinora.dto;

import com.kinora.domain.Categoria;


public class CategoriaMapper {

    private CategoriaMapper() {
    }

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
