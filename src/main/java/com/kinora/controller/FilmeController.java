package com.kinora.controller;


import com.kinora.domain.Tipo;
import com.kinora.dto.FilmeRequest;
import com.kinora.dto.FilmeResponse;
import com.kinora.service.FilmeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/filme")
@RequiredArgsConstructor
public class FilmeController {

    private final FilmeService service;

    @PostMapping
    public ResponseEntity<FilmeResponse> criar(@Valid @RequestBody FilmeRequest req) {
        FilmeResponse response = service.criar(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<FilmeResponse>> buscar(
            @RequestParam(required = false) Tipo tipo,
            @RequestParam(required = false) Long categoria) {
       return ResponseEntity.ok(service.buscar(tipo, categoria));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FilmeResponse> findById(@PathVariable Long id) {
        FilmeResponse response = service.findById(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<FilmeResponse> atualizar(@PathVariable Long id, @Valid @RequestBody FilmeRequest req) {
        return ResponseEntity.ok(service.atualizar(id, req));
    }

}