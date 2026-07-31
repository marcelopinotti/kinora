package com.kinora.service;

import com.kinora.domain.Categoria;
import com.kinora.dto.CategoriaMapper;
import com.kinora.dto.CategoriaRequest;
import com.kinora.dto.CategoriaResponse;
import com.kinora.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;


@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository repository;

    @Transactional(readOnly = true)
    public List<CategoriaResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(CategoriaMapper::toResponse)
                .toList();
    }

    @Transactional
    public CategoriaResponse criar(CategoriaRequest dto) {
        String nome = dto.nome().trim();
        if (repository.existsByNomeIgnoreCase(nome)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Categoria já cadastrada");
        }
        Categoria categoria = CategoriaMapper.toRequest(dto);
        categoria.setNome(nome);
        return CategoriaMapper.toResponse(repository.save(categoria));
    }

    @Transactional
    public CategoriaResponse atualizar(Long id, CategoriaRequest dto) {
        Categoria categoria = buscar(id);

        String nome = dto.nome().trim();
        if (repository.existsByNomeIgnoreCaseAndIdNot(nome, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Categoria já cadastrada");
        }

        categoria.setNome(nome);
        return CategoriaMapper.toResponse(repository.save(categoria));
    }

    @Transactional
    public void deletar(Long id) {
        // Categoria em uso estoura FK, que o GlobalExceptionHandler converte em 409.
        repository.delete(buscar(id));
    }

    private Categoria buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));
    }
}
