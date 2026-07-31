-- Nome duplicado de categoria/streaming nunca foi barrado: nem o service checava,
-- nem havia unique no banco. Antes de criar a constraint é preciso consolidar o
-- que já entrou, senão a própria migration falha num banco com dados.
--
-- A ordem aqui é obrigatória: normalizar -> repontar vínculos -> apagar duplicatas
-- -> criar o índice. Inverter qualquer passo estoura FK ou violação de unicidade.

-- 1. Normaliza antes de comparar. O left(...,100) no streaming também prepara a
--    redução de varchar(255) para varchar(100) feita na V12 — truncar aqui, antes
--    do índice único, evita que a V12 gere duplicata que o índice recusaria.
UPDATE categoria SET nome = trim(nome) WHERE nome <> trim(nome);
UPDATE streaming SET nome = left(trim(nome), 100) WHERE nome <> left(trim(nome), 100);

-- 2. Reaponta os vínculos das duplicatas para o menor id de cada nome. Precisa vir
--    antes do DELETE, senão a FK impede apagar a categoria/streaming em uso.
UPDATE filme_categoria fc
SET categoria_id = sobrevivente.id
FROM categoria dup
         JOIN (SELECT lower(nome) AS chave, min(id) AS id
               FROM categoria
               GROUP BY lower(nome)) sobrevivente
              ON lower(dup.nome) = sobrevivente.chave
WHERE fc.categoria_id = dup.id
  AND dup.id <> sobrevivente.id;

UPDATE filme_streaming fs
SET streaming_id = sobrevivente.id
FROM streaming dup
         JOIN (SELECT lower(nome) AS chave, min(id) AS id
               FROM streaming
               GROUP BY lower(nome)) sobrevivente
              ON lower(dup.nome) = sobrevivente.chave
WHERE fs.streaming_id = dup.id
  AND dup.id <> sobrevivente.id;

-- 3. Sobra só o menor id de cada nome. O repointe acima pode ter criado linhas
--    repetidas nas join tables — quem limpa isso é a V11, que roda em seguida e
--    por isso precisa vir depois desta.
DELETE
FROM categoria c
WHERE c.id <> (SELECT min(o.id) FROM categoria o WHERE lower(o.nome) = lower(c.nome));

DELETE
FROM streaming s
WHERE s.id <> (SELECT min(o.id) FROM streaming o WHERE lower(o.nome) = lower(s.nome));

-- 4. Índice funcional em lower(nome), não UNIQUE(nome): o service checa com
--    existsByNomeIgnoreCase, e um unique case-sensitive deixaria passar
--    "Ação" e "ação" como registros distintos, contradizendo a checagem.
--    ddl-auto: validate não inspeciona índices, então isto não afeta o boot.
CREATE UNIQUE INDEX uk_categoria_nome ON categoria (lower(nome));
CREATE UNIQUE INDEX uk_streaming_nome ON streaming (lower(nome));
