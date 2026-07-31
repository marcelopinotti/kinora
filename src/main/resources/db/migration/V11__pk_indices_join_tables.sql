-- filme_categoria e filme_streaming nasceram (V4/V5) sem PK, sem unique e sem
-- índice nas FKs. Duas consequências reais:
--   1. nada no banco impede o mesmo par (filme, categoria) entrar duas vezes;
--   2. deletar uma categoria força sequential scan na join table para checar a FK,
--      porque o Postgres não indexa o lado referenciante automaticamente.
--
-- Roda depois da V10 de propósito: o repointe de duplicatas feito lá pode ter
-- gerado pares repetidos, que precisam sumir antes da PK ser criada.

-- 1. Linhas órfãs: as colunas eram nullable, então NULL é possível e impede o
--    SET NOT NULL exigido pela PK.
DELETE FROM filme_categoria WHERE filme_id IS NULL OR categoria_id IS NULL;
DELETE FROM filme_streaming WHERE filme_id IS NULL OR streaming_id IS NULL;

-- 2. Pares repetidos: mantém uma linha física de cada par (ctid é o endereço
--    físico da tupla — o único desempate disponível numa tabela sem PK).
DELETE FROM filme_categoria a
    USING filme_categoria b
WHERE a.ctid > b.ctid
  AND a.filme_id = b.filme_id
  AND a.categoria_id = b.categoria_id;

DELETE FROM filme_streaming a
    USING filme_streaming b
WHERE a.ctid > b.ctid
  AND a.filme_id = b.filme_id
  AND a.streaming_id = b.streaming_id;

-- 3. PK composta: além de barrar duplicata, o índice implícito atende as buscas
--    por filme_id (coluna à esquerda).
ALTER TABLE filme_categoria ALTER COLUMN filme_id SET NOT NULL;
ALTER TABLE filme_categoria ALTER COLUMN categoria_id SET NOT NULL;
ALTER TABLE filme_categoria ADD CONSTRAINT pk_filme_categoria PRIMARY KEY (filme_id, categoria_id);

ALTER TABLE filme_streaming ALTER COLUMN filme_id SET NOT NULL;
ALTER TABLE filme_streaming ALTER COLUMN streaming_id SET NOT NULL;
ALTER TABLE filme_streaming ADD CONSTRAINT pk_filme_streaming PRIMARY KEY (filme_id, streaming_id);

-- 4. O outro lado da FK não é coberto pela PK acima (não é coluna à esquerda),
--    e é justamente o lado consultado ao deletar uma categoria/streaming.
CREATE INDEX idx_filme_categoria_categoria ON filme_categoria (categoria_id);
CREATE INDEX idx_filme_streaming_streaming ON filme_streaming (streaming_id);
