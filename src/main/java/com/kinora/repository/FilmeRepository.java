package com.kinora.repository;

import com.kinora.domain.Filme;
import com.kinora.domain.Tipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FilmeRepository extends JpaRepository<Filme, Long> {

    // Um filtro só para tipo e categoria: as telas de Filmes e Séries combinam
    // os dois e passam null no que não filtram.
    @Query("""
            select f from Filme f
            where (:tipo is null or f.tipo = :tipo)
              and (:categoriaId is null or exists (select c from f.categorias c where c.id = :categoriaId))
            order by f.nota desc, f.titulo asc
            """)
    List<Filme> buscar(@Param("tipo") Tipo tipo, @Param("categoriaId") Long categoriaId);
}
