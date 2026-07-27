package com.kinora.service;

import com.kinora.domain.Streaming;
import com.kinora.dto.StreamingMapper;
import com.kinora.dto.StreamingRequest;
import com.kinora.dto.StreamingResponse;
import com.kinora.repository.StreamingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StreamingService {

    private final StreamingRepository repository;

    public List<StreamingResponse> findAll() {
        return repository.findAll()
                .stream()
                .map(StreamingMapper::toResponse)
                .toList();
    }

    public StreamingResponse criar(StreamingRequest dto) {
        Streaming streaming = StreamingMapper.toRequest(dto);
        return StreamingMapper.toResponse(repository.save(streaming));

    }

    public StreamingResponse atualizar(Long id, StreamingRequest dto) {
        Optional<Streaming> streamingOptional = repository.findById(id);
        if (streamingOptional.isPresent()) {
            Streaming streaming = streamingOptional.get();
            streaming.setNome(dto.nome());
            return StreamingMapper.toResponse(repository.save(streaming));
        } else {
            throw new RuntimeException("Streaming não encontrado");
        }
    }

    public StreamingResponse findById(Long id){
        return repository.findById(id)
                .map(StreamingMapper::toResponse)
                .orElseThrow(() -> new RuntimeException("Streaming não encontrado"));
    }

    public void deletar(Long id){
        repository.deleteById(id);
    }


}
