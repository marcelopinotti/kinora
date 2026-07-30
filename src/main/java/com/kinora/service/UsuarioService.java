package com.kinora.service;

import com.kinora.domain.Usuario;
import com.kinora.dto.*;
import com.kinora.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;
    private final TokenService tokenService;


    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    public UsuarioResponse registrar(UsuarioRequest request) {
        if (repository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }
        Usuario usuario = UsuarioMapper.toRequest(request);
        usuario.setSenha(encoder.encode(request.senha()));
        return UsuarioMapper.toResponse(repository.save(usuario));
    }

    public LoginResponse login(LoginRequest request) {
        Usuario usuario = repository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));

        if (!encoder.matches(request.senha(), usuario.getSenha())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos");
        }

        return LoginResponse.builder()
                .token(tokenService.gerar(usuario))
                .usuario(UsuarioMapper.toResponse(usuario))
                .build();
    }

    public UsuarioResponse findById(Long id) {
        return UsuarioMapper.toResponse(buscar(id));
    }

    public UsuarioResponse atualizar(Long id, UsuarioUpdateRequest request) {
        Usuario usuario = buscar(id);

        if (repository.existsByEmailAndIdNot(request.email(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }

        usuario.setNome(request.nome());
        usuario.setEmail(request.email());
        return UsuarioMapper.toResponse(repository.save(usuario));
    }

    public void alterarSenha(Long id, AlterarSenhaRequest request) {
        Usuario usuario = buscar(id);

        if (!encoder.matches(request.senhaAtual(), usuario.getSenha())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Senha atual incorreta");
        }

        usuario.setSenha(encoder.encode(request.novaSenha()));
        repository.save(usuario);
    }

    public void deletar(Long id) {
        repository.delete(buscar(id));
    }

    private Usuario buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
    }
}
