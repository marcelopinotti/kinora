package com.kinora.controller;


import com.kinora.dto.AlterarSenhaRequest;
import com.kinora.dto.LoginRequest;
import com.kinora.dto.LoginResponse;
import com.kinora.dto.UsuarioRequest;
import com.kinora.dto.UsuarioResponse;
import com.kinora.dto.UsuarioUpdateRequest;
import com.kinora.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;

    @PostMapping("/registrar")
    public ResponseEntity<UsuarioResponse> registrar(@RequestBody @Valid UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.registrar(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(usuarioService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me(@AuthenticationPrincipal Long usuarioId) {
        return ResponseEntity.ok(usuarioService.findById(usuarioId));
    }

    @PutMapping("/me")
    public ResponseEntity<UsuarioResponse> atualizarMe(@AuthenticationPrincipal Long usuarioId,
                                                       @RequestBody @Valid UsuarioUpdateRequest request) {
        return ResponseEntity.ok(usuarioService.atualizar(usuarioId, request));
    }

    @PatchMapping("/me/senha")
    public ResponseEntity<Void> alterarSenha(@AuthenticationPrincipal Long usuarioId,
                                             @RequestBody @Valid AlterarSenhaRequest request) {
        usuarioService.alterarSenha(usuarioId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deletarMe(@AuthenticationPrincipal Long usuarioId) {
        usuarioService.deletar(usuarioId);
        return ResponseEntity.noContent().build();
    }
}
