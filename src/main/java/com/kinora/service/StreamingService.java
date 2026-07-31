package com.kinora.service;

import com.kinora.domain.Streaming;
import com.kinora.dto.StreamingMapper;
import com.kinora.dto.StreamingRequest;
import com.kinora.dto.StreamingResponse;
import com.kinora.repository.StreamingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StreamingService {

    private final StreamingRepository repository;

    @Transactional(readOnly = true)
    public List<StreamingResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(StreamingMapper::toResponse)
                .toList();
    }

    @Transactional
    public StreamingResponse criar(StreamingRequest dto) {
        String nome = dto.nome().trim();
        if (repository.existsByNomeIgnoreCase(nome)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Streaming já cadastrado");
        }
        Streaming streaming = StreamingMapper.toRequest(dto);
        streaming.setNome(nome);
        return StreamingMapper.toResponse(repository.save(streaming));
    }

    @Transactional
    public StreamingResponse atualizar(Long id, StreamingRequest dto) {
        Streaming streaming = buscar(id);

        String nome = dto.nome().trim();
        if (repository.existsByNomeIgnoreCaseAndIdNot(nome, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Streaming já cadastrado");
        }

        streaming.setNome(nome);
        return StreamingMapper.toResponse(repository.save(streaming));
    }

    @Transactional
    public void deletar(Long id) {
        // Streaming em uso estoura FK, que o GlobalExceptionHandler converte em 409.
        repository.delete(buscar(id));
    }

    private Streaming buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Streaming não encontrado"));
    }
}
