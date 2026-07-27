CREATE TABLE filme_streaming
(
    filme_id     INTEGER,
    streaming_id INTEGER,
    CONSTRAINT fk_filme_streaming_filme FOREIGN KEY (filme_id) REFERENCES filme (id),
    CONSTRAINT fk_filme_streaming_streaming FOREIGN KEY (streaming_id) REFERENCES streaming (id)

);