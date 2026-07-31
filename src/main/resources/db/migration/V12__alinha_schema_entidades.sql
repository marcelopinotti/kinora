-- Ajustes onde o banco e a entidade discordavam, ou onde a única defesa contra
-- valor inválido estava no DTO (e portanto sumia em qualquer escrita futura que
-- não passasse por ele).

-- 1. Streaming.nome declara length=100 desde sempre, mas a V2 criou varchar(255).
--    ddl-auto: validate não compara tamanho de coluna, então o descompasso passou
--    batido. A V10 já truncou os valores em 100, então este ALTER não perde dado.
ALTER TABLE streaming ALTER COLUMN nome TYPE VARCHAR(100);

-- 2. A faixa 0..10 de nota só era validada em FilmeRequest. Qualquer escrita que
--    não passe pelo DTO gravava nota negativa ou acima de 10 sem reclamar.
--    Os UPDATEs prendem o que já está fora da faixa na borda mais próxima —
--    sem eles o ADD CONSTRAINT falha num banco com dado sujo.
UPDATE filme SET nota = 0 WHERE nota < 0;
UPDATE filme SET nota = 10 WHERE nota > 10;
ALTER TABLE filme ADD CONSTRAINT ck_filme_nota CHECK (nota >= 0 AND nota <= 10);

-- 3. Filme tem criado_em e alterado_em; usuario só tinha criado_em. Sem esta
--    coluna não há registro de quando a conta (ou a senha) mudou pela última vez.
--    Nullable de propósito: linha existente não tem como saber a data real.
ALTER TABLE usuario ADD COLUMN alterado_em TIMESTAMP;

-- 4. E-mail nunca foi normalizado na escrita, e a comparação do Postgres é
--    case-sensitive: "Ana@x.com" e "ana@x.com" viravam contas distintas que não
--    se enxergavam no login. A normalização passa a valer na aplicação
--    (UsuarioService); aqui só o passivo é acertado.
--
--    O NOT EXISTS evita apagar ou sobrescrever conta: se dois registros colidem
--    ao normalizar, o mais antigo é normalizado e o outro fica intocado, para
--    resolução manual. Migration que apaga conta de usuário é pior que o bug.
UPDATE usuario u
SET email = lower(trim(u.email))
WHERE u.email <> lower(trim(u.email))
  AND NOT EXISTS (SELECT 1
                  FROM usuario o
                  WHERE o.id <> u.id
                    AND lower(trim(o.email)) = lower(trim(u.email)));
