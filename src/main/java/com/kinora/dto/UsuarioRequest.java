package com.kinora.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(@NotBlank String nome,

                             @NotBlank @Email String email,

                             // max 72: acima disso o BCrypt lança IllegalArgumentException (=> 500)
                             @NotBlank @Size(min = 8, max = 72, message = "a senha deve ter entre 8 e 72 caracteres")
                             String senha) {
}
