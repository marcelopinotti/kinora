CREATE TABLE filme
(
    id             serial PRIMARY KEY,
    titulo         VARCHAR(255) NOT NULL,
    descricao      text,
    dataLancamento date,
    nota           numeric,
    criadoEm       timestamp,
    alteradoEm     timestamp
);