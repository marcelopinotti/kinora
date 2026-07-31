package com.kinora.service;

import com.kinora.domain.Usuario;
import com.kinora.dto.AlterarSenhaRequest;
import com.kinora.dto.LoginRequest;
import com.kinora.dto.LoginResponse;
import com.kinora.dto.UsuarioMapper;
import com.kinora.dto.UsuarioRequest;
import com.kinora.dto.UsuarioResponse;
import com.kinora.dto.UsuarioUpdateRequest;
import com.kinora.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repository;
    private final TokenService tokenService;


    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    @Transactional
    public UsuarioResponse registrar(UsuarioRequest request) {
        String email = normalizarEmail(request.email());

        if (repository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }
        Usuario usuario = UsuarioMapper.toRequest(request);
        usuario.setEmail(email);
        usuario.setSenha(encoder.encode(request.senha()));
        return UsuarioMapper.toResponse(repository.save(usuario));
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = repository.findByEmail(normalizarEmail(request.email()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));

        if (!encoder.matches(request.senha(), usuario.getSenha())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos");
        }

        return LoginResponse.builder()
                .token(tokenService.gerar(usuario))
                .usuario(UsuarioMapper.toResponse(usuario))
                .build();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse findById(Long id) {
        return UsuarioMapper.toResponse(buscar(id));
    }

    @Transactional
    public UsuarioResponse atualizar(Long id, UsuarioUpdateRequest request) {
        Usuario usuario = buscar(id);
        String email = normalizarEmail(request.email());

        if (repository.existsByEmailAndIdNot(email, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }

        usuario.setNome(request.nome());
        usuario.setEmail(email);
        return UsuarioMapper.toResponse(repository.save(usuario));
    }

    @Transactional
    public void alterarSenha(Long id, AlterarSenhaRequest request) {
        Usuario usuario = buscar(id);

        if (!encoder.matches(request.senhaAtual(), usuario.getSenha())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Senha atual incorreta");
        }

        usuario.setSenha(encoder.encode(request.novaSenha()));
        repository.save(usuario);
    }

    @Transactional
    public void deletar(Long id) {
        repository.delete(buscar(id));
    }

    private Usuario buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
    }

    /**
     * A comparação do Postgres é case-sensitive: sem normalizar, "Ana@x.com" e
     * "ana@x.com" viravam contas distintas que não se enxergavam no login.
     * Locale.ROOT para o lowercase não depender do locale da JVM (no turco, "I"
     * minúsculo não é "i", e o mesmo e-mail mudaria de forma conforme o servidor).
     */
    private String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
