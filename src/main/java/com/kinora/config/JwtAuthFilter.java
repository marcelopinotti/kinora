package com.kinora.config;

import com.kinora.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final TokenService tokenService;

    /**
     * Token ausente ou inválido não vira erro aqui: só não autentica. Quem devolve 401
     * é o {@code authorizeHttpRequests}, que já sabe se a rota é pública ou não.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        Optional<Long> usuarioId = tokenService.usuarioId(header);

        if (usuarioId.isPresent()) {
            SecurityContextHolder.getContext()
                    .setAuthentication(new UsernamePasswordAuthenticationToken(usuarioId.get(), null, List.of()));
        } else if (header != null) {
            logger.debug("Authorization presente mas recusado: formato errado, expirado ou assinado com outro segredo");
        }

        chain.doFilter(request, response);
    }
}
