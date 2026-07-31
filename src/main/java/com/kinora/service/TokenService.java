package com.kinora.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.kinora.domain.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
public class TokenService {

    private static final String ISSUER = "kinora";

    /** HS256 usa chave de 256 bits; abaixo disso o segredo é o elo fraco da assinatura. */
    private static final int TAMANHO_MINIMO_SEGREDO = 32;

    private final Algorithm algorithm;
    private final Duration expiracao;

    public TokenService(@Value("${jwt.secret}") String secret,
                        @Value("${jwt.expiracao}") Duration expiracao) {
        // Algorithm.HMAC256 aceita qualquer string, inclusive "secret": derruba o boot
        // aqui, pela mesma razão de JWT_SECRET não ter default — token assinado com
        // segredo fraco é pior do que aplicação que não sobe.
        int bytes = secret == null ? 0 : secret.getBytes(StandardCharsets.UTF_8).length;
        if (bytes < TAMANHO_MINIMO_SEGREDO) {
            throw new IllegalStateException(
                    "jwt.secret precisa de ao menos " + TAMANHO_MINIMO_SEGREDO + " bytes (tem " + bytes + ")");
        }
        this.algorithm = Algorithm.HMAC256(secret);
        this.expiracao = expiracao;
    }

    public String gerar(Usuario usuario) {
        return JWT.create()
                .withIssuer(ISSUER)
                .withSubject(usuario.getId().toString())
                .withIssuedAt(Instant.now())
                .withExpiresAt(Instant.now().plus(expiracao))
                .sign(algorithm);
    }

    /** Id do usuário dono do token, ou vazio se o header faltar ou o token for inválido/expirado. */
    public Optional<Long> usuarioId(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        try {
            String subject = JWT.require(algorithm)
                    .withIssuer(ISSUER)
                    .build()
                    .verify(authorizationHeader.substring(7))
                    .getSubject();
            return Optional.of(Long.valueOf(subject));
        } catch (JWTVerificationException | NumberFormatException e) {
            return Optional.empty();
        }
    }
}
