package com.kinora.service;

import com.kinora.domain.Categoria;
import com.kinora.domain.Filme;
import com.kinora.domain.Streaming;
import com.kinora.domain.Tipo;
import com.kinora.dto.FilmeMapper;
import com.kinora.dto.FilmeRequest;
import com.kinora.dto.FilmeResponse;
import com.kinora.repository.CategoriaRepository;
import com.kinora.repository.FilmeRepository;
import com.kinora.repository.StreamingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FilmeService {

    private final FilmeRepository filmeRepository;
    private final CategoriaRepository categoriaRepository;
    private final StreamingRepository streamingRepository;

    @Transactional
    public FilmeResponse criar(FilmeRequest request) {
        Filme filme = FilmeMapper.toRequest(request);
        filme.setCategorias(buscarCategorias(request.categorias()));
        filme.setStreamings(buscarStreamings(request.streamings()));
        Filme filmeSalvo = filmeRepository.save(filme);
        return FilmeMapper.toResponse(filmeSalvo);
    }

    // readOnly: sem open-in-view, o toResponse precisa da transação ainda aberta
    // para inicializar categorias/streamings (lazy).
    @Transactional(readOnly = true)
    public List<FilmeResponse> buscar(Tipo tipo, Long categoriaId) {
        return filmeRepository.buscar(tipo, categoriaId).stream()
                .map(FilmeMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FilmeResponse findById(Long id) {
        return FilmeMapper.toResponse(buscarFilme(id));
    }

    @Transactional
    public void deletar(Long id) {
        // deleteById cru some com id inexistente (findById().ifPresent()), devolvendo
        // 204 para algo que nunca existiu. Aqui alinha com UsuarioService: 404.
        filmeRepository.delete(buscarFilme(id));
    }

    @Transactional
    public FilmeResponse atualizar(Long id, FilmeRequest request) {
        Filme filme = buscarFilme(id);

        filme.setTitulo(request.titulo());
        filme.setDescricao(request.descricao());
        filme.setDataLancamento(request.dataLancamento());
        filme.setNota(request.nota());
        filme.setTipo(request.tipo());
        filme.setPosterUrl(request.posterUrl());
        filme.setCategorias(buscarCategorias(request.categorias()));
        filme.setStreamings(buscarStreamings(request.streamings()));

        return FilmeMapper.toResponse(filme);
    }

    private Filme buscarFilme(Long id) {
        return filmeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Filme não encontrado"));
    }

    // ArrayList e não List.of(): a lista é entregue ao Hibernate, que a envolve numa
    // PersistentBag — coleção imutável aqui vira erro se ele precisar escrever nela.
    private List<Categoria> buscarCategorias(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        List<Categoria> categorias = categoriaRepository.findAllById(ids);
        if (categorias.size() != Set.copyOf(ids).size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada");
        }
        return new ArrayList<>(categorias);
    }

    private List<Streaming> buscarStreamings(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();
        List<Streaming> streamings = streamingRepository.findAllById(ids);
        if (streamings.size() != Set.copyOf(ids).size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Streaming não encontrado");
        }
        return new ArrayList<>(streamings);
    }
}
