package com.kinora.dto;

import com.kinora.domain.Categoria;
import com.kinora.domain.Filme;
import com.kinora.domain.Streaming;
import lombok.experimental.UtilityClass;

import java.util.List;

@UtilityClass
public class MovieMapper {

    public static Filme toMovie(FilmeRequest request) {


        List<Categoria> categories = request.categorias().stream()
                .map(categoryId -> Categoria.builder().id(categoryId).build())
                .toList();

        List<Streaming> streamings = request.streamings().stream()
                .map(streamingId -> Streaming.builder().id(streamingId).build())
                .toList();

        return Filme.builder()
                .titulo(request.titulo())
                .descricao(request.descricao())
                .dataLancamento(request.dataLancamento())
                .nota(request.nota())
                .categorias(categories)
                .streamings(streamings)
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