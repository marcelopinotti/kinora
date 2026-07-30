package com.kinora.repository;

import com.kinora.domain.Filme;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FilmeRepository extends JpaRepository<Filme, Long> {
    List<Filme> findByCategorias_Id(Long categoriaId);

}