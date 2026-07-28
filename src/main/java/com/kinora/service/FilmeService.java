package com.kinora.service;

import com.kinora.domain.Categoria;
import com.kinora.domain.Filme;
import com.kinora.domain.Streaming;
import com.kinora.dto.FilmeMapper;
import com.kinora.dto.FilmeRequest;
import com.kinora.dto.FilmeResponse;
import com.kinora.repository.CategoriaRepository;
import com.kinora.repository.FilmeRepository;
import com.kinora.repository.StreamingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FilmeService {

    private final FilmeRepository filmeRepository;
    private final CategoriaRepository categoriaRepository;
    private final StreamingRepository streamingRepository;

    public FilmeResponse save(FilmeRequest request) {
        Filme filme = FilmeMapper.toRequest(request);
        filme.setCategorias(buscarCategorias(request.categorias()));
        filme.setStreamings(buscarStreamings(request.streamings()));
        Filme filmeSalvo = filmeRepository.save(filme);
        return FilmeMapper.toResponse(filmeSalvo);
    }


    public List<FilmeResponse> findAll() {
        List<Filme> filmes = filmeRepository.findAll();
        return filmes.stream()
                .map(FilmeMapper::toResponse)
                .toList();

    }


    public FilmeResponse findById(Long id) {
        Filme filme = filmeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filme não encontrado"));
        return FilmeMapper.toResponse(filme);
    }


    public void deleteById(Long id) {
        filmeRepository.deleteById(id);

    }

    public FilmeResponse atualizar(Long id, FilmeRequest request) {
        Filme filme = filmeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Filme não encontrado"));

        filme.setTitulo(request.titulo());
        filme.setDescricao(request.descricao());
        filme.setDataLancamento(request.dataLancamento());
        filme.setNota(request.nota());
        filme.setCategorias(buscarCategorias(request.categorias()));
        filme.setStreamings(buscarStreamings(request.streamings()));

        Filme filmeAtualizado = filmeRepository.save(filme);
        return FilmeMapper.toResponse(filmeAtualizado);

    }

    private List<Categoria> buscarCategorias(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        List<Categoria> categorias = categoriaRepository.findAllById(ids);
        if (categorias.size() != Set.copyOf(ids).size()) {
            throw new RuntimeException("Categoria não encontrada");
        }
        return categorias;
    }

    private List<Streaming> buscarStreamings(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        List<Streaming> streamings = streamingRepository.findAllById(ids);
        if (streamings.size() != Set.copyOf(ids).size()) {
            throw new RuntimeException("Streaming não encontrado");
        }
        return streamings;
    }
}