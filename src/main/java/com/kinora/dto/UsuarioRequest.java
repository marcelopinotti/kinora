package com.kinora.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(@NotBlank String nome,

                             @NotBlank @Email String email,

                             // max 72: acima disso o BCrypt lança IllegalArgumentException (=> 500)
                             @NotBlank @Size(min = 8, max = 72, message = "a senha deve ter entre 8 e 72 caracteres")
                             String senha) {

    // Trim antes da validação, não no service: o @Email não aceita espaço em volta,
    // então " ana@x.com " virava 400 antes de qualquer normalização ser aplicada.
    // O lowercase continua no UsuarioService — ali é regra de domínio, aqui é
    // saneamento de entrada. Guarda de null porque quem reclama de ausente é o
    // @NotBlank, e ele só roda depois deste construtor.
    public UsuarioRequest {
        if (email != null) email = email.trim();
    }
}
