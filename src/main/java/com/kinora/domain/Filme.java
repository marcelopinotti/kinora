package com.kinora.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Table(name = "filme")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Filme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    private String descricao;

    @Column(name = "data_lancamento")
    private LocalDate dataLancamento;

    private double nota;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Tipo tipo;

    @Column(name = "poster_url", length = 500)
    private String posterUrl;

    @CreationTimestamp
    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "alterado_em")
    private LocalDateTime alteradoEm;

    // Inicializadas: FilmeMapper.toRequest monta o Filme pelo builder sem tocar
    // nestas duas, e quem chamasse toResponse antes do service preencher tomava NPE.
    @ManyToMany
    @JoinTable(
            name = "filme_categoria",
            joinColumns = @JoinColumn(name = "filme_id"),
            inverseJoinColumns = @JoinColumn(name = "categoria_id")
    )
    @Builder.Default
    private List<Categoria> categorias = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "filme_streaming",
            joinColumns = @JoinColumn(name = "filme_id"),
            inverseJoinColumns = @JoinColumn(name = "streaming_id")
    )
    @Builder.Default
    private List<Streaming> streamings = new ArrayList<>();

    // Getters manuais (o @Getter da classe cede a estes): devolvem view somente
    // leitura para que ninguém contorne a validação de ids do FilmeService
    // mutando a lista pelo getter. O Hibernate não passa por aqui — o access type
    // é FIELD, porque a @Id está no campo.
    public List<Categoria> getCategorias() {
        return categorias == null ? List.of() : Collections.unmodifiableList(categorias);
    }

    public List<Streaming> getStreamings() {
        return streamings == null ? List.of() : Collections.unmodifiableList(streamings);
    }
}