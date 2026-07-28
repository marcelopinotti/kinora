package com.kinora.controller;


import com.kinora.dto.FilmeRequest;
import com.kinora.dto.FilmeResponse;
import com.kinora.service.FilmeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/filme")
@RequiredArgsConstructor
public class FilmeController {

    private final FilmeService service;

    @PostMapping
    public ResponseEntity<FilmeResponse> save(@RequestBody FilmeRequest req) {
        FilmeResponse response = service.save(req);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<FilmeResponse>> findAll() {
       return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FilmeResponse> findById(@PathVariable Long id) {
        FilmeResponse response = service.findById(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<FilmeResponse> update(@PathVariable Long id, @RequestBody FilmeRequest req) {
        return ResponseEntity.ok(service.atualizar(id, req));
    }
}
