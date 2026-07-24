package com.kinora.service;

import com.kinora.domain.Categoria;
import com.kinora.dto.CategoriaMapper;
import com.kinora.dto.CategoriaRequest;
import com.kinora.dto.CategoriaResponse;
import com.kinora.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository repository;


    public List<CategoriaResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(CategoriaMapper::toResponse)
                .toList();
    }

    public CategoriaResponse criar(CategoriaRequest dto) {
        Categoria categoria = CategoriaMapper.toRequest(dto);
        return CategoriaMapper.toResponse(repository.save(categoria));

    }

    public CategoriaResponse atualizar(Long id, CategoriaRequest dto) {
        Optional<Categoria> categoriaOptional = repository.findById(id);
        if (categoriaOptional.isPresent()) {
            Categoria categoria = categoriaOptional.get();
            categoria.setNome(dto.nome());
            return CategoriaMapper.toResponse(repository.save(categoria));
        } else {
            throw new RuntimeException("Categoria não encontrada");
        }
    }

    public CategoriaResponse findById(Long id){
        return repository.findById(id)
                .map(CategoriaMapper::toResponse)
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
    }

    public void deletar(Long id){
        repository.deleteById(id);
    }

}
