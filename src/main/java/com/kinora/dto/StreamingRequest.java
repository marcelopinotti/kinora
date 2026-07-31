package com.kinora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;


public record StreamingRequest(@NotBlank @Size(max = 100) String nome) {
}
