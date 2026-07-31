package com.kinora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlterarSenhaRequest(@NotBlank @Size(max = 72) String senhaAtual,
                                  // max 72: acima disso o BCrypt lança IllegalArgumentException (=> 500)
                                  @NotBlank @Size(min = 8, max = 72, message = "a senha deve ter entre 8 e 72 caracteres")
                                  String novaSenha) {
}
