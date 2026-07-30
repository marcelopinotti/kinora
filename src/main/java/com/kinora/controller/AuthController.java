package com.kinora.controller;


import com.kinora.dto.AlterarSenhaRequest;
import com.kinora.dto.LoginRequest;
import com.kinora.dto.LoginResponse;
import com.kinora.dto.UsuarioRequest;
import com.kinora.dto.UsuarioResponse;
import com.kinora.dto.UsuarioUpdateRequest;
import com.kinora.service.TokenService;
import com.kinora.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;
    private final TokenService tokenService;

    @PostMapping("/registrar")
    public ResponseEntity<UsuarioResponse> registrar(@RequestBody @Valid UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.registrar(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        return ResponseEntity.ok(usuarioService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok(usuarioService.findById(tokenService.usuarioId(authorization)));
    }

    @PutMapping("/me")
    public ResponseEntity<UsuarioResponse> atualizarMe(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                                       @RequestBody @Valid UsuarioUpdateRequest request) {
        return ResponseEntity.ok(usuarioService.atualizar(tokenService.usuarioId(authorization), request));
    }

    @PatchMapping("/me/senha")
    public ResponseEntity<Void> alterarSenha(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                             @RequestBody @Valid AlterarSenhaRequest request) {
        usuarioService.alterarSenha(tokenService.usuarioId(authorization), request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deletarMe(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        usuarioService.deletar(tokenService.usuarioId(authorization));
        return ResponseEntity.noContent().build();
    }
}
