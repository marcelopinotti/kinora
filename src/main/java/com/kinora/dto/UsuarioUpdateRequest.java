package com.kinora.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UsuarioUpdateRequest(@NotBlank String nome,
                                   @NotBlank @Email String email) {

    // Ver UsuarioRequest: o @Email recusa espaço em volta, então o trim precisa
    // acontecer antes da validação.
    public UsuarioUpdateRequest {
        if (email != null) email = email.trim();
    }
}
