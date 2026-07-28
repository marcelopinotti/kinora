ALTER TABLE filme RENAME COLUMN datalancamento TO data_lancamento;
ALTER TABLE filme RENAME COLUMN criadoem TO criado_em;
ALTER TABLE filme RENAME COLUMN alteradoem TO alterado_em;
ALTER TABLE filme ALTER COLUMN nota TYPE double precision;
ALTER TABLE filme ALTER COLUMN nota SET NOT NULL;
