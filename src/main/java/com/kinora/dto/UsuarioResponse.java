package com.kinora.dto;

import lombok.Builder;

@Builder
public record UsuarioResponse(Long id, String nome, String email) {
}
