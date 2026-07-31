package com.kinora.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuario")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "senha", nullable = false)
    private String senha;

    @CreationTimestamp
    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    // Espelha o que Filme já tinha. Sem isto não havia registro de quando a conta
    // — ou a senha — mudou pela última vez.
    @UpdateTimestamp
    @Column(name = "alterado_em")
    private LocalDateTime alteradoEm;
}
