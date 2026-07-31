package com.kinora.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "streaming")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Streaming {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String nome;



}
