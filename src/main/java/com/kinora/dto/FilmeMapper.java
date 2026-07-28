package com.kinora.dto;

import com.kinora.domain.Filme;

import java.util.List;


public class FilmeMapper {

    public static Filme toRequest(FilmeRequest request) {

        return Filme.builder()
                .titulo(request.titulo())
                .descricao(request.descricao())
                .dataLancamento(request.dataLancamento())
                .nota(request.nota())
                .build();

    }


    public static FilmeResponse toResponse(Filme filme) {

        List<CategoriaResponse> categories = filme.getCategorias().stream()
                .map(CategoriaMapper::toResponse)
                .toList();

        List<StreamingResponse> streamings = filme.getStreamings().stream()
                .map(StreamingMapper::toResponse)
                .toList();


        return FilmeResponse.builder()
                .id(filme.getId())
                .descricao(filme.getDescricao())
                .nota(filme.getNota())
                .titulo(filme.getTitulo())
                .dataLancamento(filme.getDataLancamento())
                .categorias(categories)
                .streamings(streamings)
                .build();
    }
}