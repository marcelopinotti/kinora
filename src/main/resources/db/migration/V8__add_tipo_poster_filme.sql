-- Série não é entidade nova: é o mesmo título com outro tipo. Reaproveita
-- categorias, streamings, service e formulário.
ALTER TABLE filme ADD COLUMN tipo VARCHAR(10) NOT NULL DEFAULT 'FILME';
ALTER TABLE filme ADD COLUMN poster_url VARCHAR(500);
