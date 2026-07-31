package com.kinora.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(@NotBlank @Email String email,
                           @NotBlank @Size(max = 72) String senha) {

    // Ver UsuarioRequest: o @Email recusa espaço em volta, então o trim precisa
    // acontecer antes da validação.
    public LoginRequest {
        if (email != null) email = email.trim();
    }
}
