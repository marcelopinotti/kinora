package com.kinora.dto;

import com.kinora.domain.Streaming;
import lombok.experimental.UtilityClass;

@UtilityClass
public class StreamingMapper {

    public static Streaming toRequest(StreamingRequest res){
        return Streaming.builder()
                .nome(res.nome())
                .build();
    }

    public static StreamingResponse toResponse(Streaming streaming){
        return new StreamingResponse(
                streaming.getId(),
                streaming.getNome()
        );
    }
}
