package com.kinora.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Corpo de erro da API em RFC 9457 ({@code application/problem+json}).
 *
 * <p>A herança faz o trabalho: {@link ResponseEntityExceptionHandler} já trata as ~20
 * exceções de MVC e o {@code ResponseStatusException} que os services lançam (ele estende
 * {@code ErrorResponseException} no Spring 7 e já usa a {@code reason} como {@code detail}).
 * Não ligue {@code spring.mvc.problemdetails.enabled}: o advice do Boot é
 * {@code @ControllerAdvice} sem {@code @Order}, mesma precedência deste, e os dois
 * disputariam as mesmas exceções.
 *
 * <p>401 e 403 do Spring Security não passam por aqui — nascem no filter chain, fora do
 * DispatcherServlet.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Único motivo de sobrescrever: dizer qual campo falhou, em vez de só contar quantos. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException e,
                                                                  HttpHeaders headers,
                                                                  HttpStatusCode status,
                                                                  WebRequest request) {
        Map<String, String> campos = new LinkedHashMap<>();
        // putIfAbsent: um campo pode violar @NotBlank e @Size ao mesmo tempo; a primeira basta
        e.getBindingResult().getFieldErrors()
                .forEach(erro -> campos.putIfAbsent(erro.getField(), erro.getDefaultMessage()));

        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Campos inválidos");
        problema.setProperty("campos", campos);
        return handleExceptionInternal(e, problema, headers, status, request);
    }

    /** O único status que nada nativo acerta: violação de unique ou FK sairia 500. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> integridade(DataIntegrityViolationException e, WebRequest request) {
        log.warn("Violação de integridade: {}", e.getMostSpecificCause().getMessage());
        return handleExceptionInternal(e,
                ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Operação viola uma restrição de integridade"),
                new HttpHeaders(), HttpStatus.CONFLICT, request);
    }

    /** Ponto único por onde passam os handlers herdados e os daqui. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception e, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        ResponseEntity<Object> resposta = super.handleExceptionInternal(e, body, headers, statusCode, request);
        if (resposta != null && resposta.getBody() instanceof ProblemDetail problema) {
            HttpStatus status = HttpStatus.resolve(problema.getStatus());
            if (problema.getTitle() == null && status != null) {
                problema.setTitle(status.getReasonPhrase());
            }
            if (request instanceof ServletWebRequest servletRequest) {
                problema.setInstance(URI.create(servletRequest.getRequest().getRequestURI()));
            }
        }
        return resposta;
    }
}
