package com.kinora.dto;

import com.kinora.domain.Filme;

import java.util.List;


public class FilmeMapper {

    private FilmeMapper() {
    }

    public static Filme toRequest(FilmeRequest request) {

        return Filme.builder()
                .titulo(request.titulo())
                .descricao(request.descricao())
                .dataLancamento(request.dataLancamento())
                .nota(request.nota())
                .tipo(request.tipo())
                .posterUrl(request.posterUrl())
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
                .tipo(filme.getTipo())
                .posterUrl(filme.getPosterUrl())
                .categorias(categories)
                .streamings(streamings)
                .build();
    }
}