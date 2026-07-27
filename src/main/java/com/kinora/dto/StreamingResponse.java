package com.kinora.dto;

import lombok.Builder;

@Builder
public record StreamingResponse(Long id, String Name) {
}
