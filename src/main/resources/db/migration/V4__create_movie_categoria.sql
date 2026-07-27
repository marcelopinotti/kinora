CREATE TABLE filme_categoria
(
    filme_id     INTEGER,
    categoria_id INTEGER,
    CONSTRAINT fk_filme_categoria_filme FOREIGN KEY (filme_id) REFERENCES filme (id),
    CONSTRAINT fk_filme_categoria_categoria FOREIGN KEY (categoria_id) REFERENCES categoria (id)
);