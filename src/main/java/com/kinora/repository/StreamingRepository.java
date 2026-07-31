package com.kinora.repository;

import com.kinora.domain.Streaming;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StreamingRepository extends JpaRepository<Streaming, Long> {

    // IgnoreCase para casar com o índice único em lower(nome) criado na V10.
    boolean existsByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCaseAndIdNot(String nome, Long id);
}
