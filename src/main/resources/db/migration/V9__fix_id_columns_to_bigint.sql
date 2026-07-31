-- V1/V2/V3/V7 criaram os ids como SERIAL (integer), mas toda entidade usa
-- Long + GenerationType.IDENTITY, que o Hibernate valida como bigint. Passou
-- despercebido porque nenhum banco tinha sido criado do zero só pelas
-- migrations até agora; num Postgres novo (ex.: volume do Docker) o boot
-- derruba na validação do schema.
ALTER TABLE categoria ALTER COLUMN id TYPE bigint;
ALTER TABLE streaming ALTER COLUMN id TYPE bigint;
ALTER TABLE filme ALTER COLUMN id TYPE bigint;
ALTER TABLE usuario ALTER COLUMN id TYPE bigint;

ALTER TABLE filme_categoria ALTER COLUMN filme_id TYPE bigint;
ALTER TABLE filme_categoria ALTER COLUMN categoria_id TYPE bigint;
ALTER TABLE filme_streaming ALTER COLUMN filme_id TYPE bigint;
ALTER TABLE filme_streaming ALTER COLUMN streaming_id TYPE bigint;
