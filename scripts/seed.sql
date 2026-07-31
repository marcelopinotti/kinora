-- Dados de demonstração do Kinora.
--
-- Idempotente: rodar duas vezes não duplica nada. Categorias e streamings se
-- apoiam no índice único em lower(nome) criado na V10; filmes são checados por
-- título, que não tem constraint própria.
--
-- Não cria usuário: a senha precisa do hash BCrypt que o backend gera. Registre
-- a conta por POST /api/auth/registrar ou pela tela de cadastro.

INSERT INTO categoria (nome)
VALUES ('Ação'),
       ('Aventura'),
       ('Comédia'),
       ('Documentário'),
       ('Drama'),
       ('Ficção Científica'),
       ('Romance'),
       ('Suspense'),
       ('Terror'),
       ('Animação')
ON CONFLICT (lower(nome)) DO NOTHING;

INSERT INTO streaming (nome)
VALUES ('Netflix'),
       ('Prime Video'),
       ('Disney+'),
       ('Max'),
       ('Apple TV+'),
       ('Globoplay')
ON CONFLICT (lower(nome)) DO NOTHING;

-- Um bloco só para os títulos: cada um traz as listas de categorias e streamings
-- por nome, e o laço resolve os ids. Evita repetir três INSERTs por filme.
DO
$$
    DECLARE
        t      RECORD;
        novo_id BIGINT;
    BEGIN
        FOR t IN
            SELECT *
            FROM (VALUES ('Duna', 'Paul Atreides lidera nômades numa guerra pela especiaria mais valiosa do universo.',
                          DATE '2021-10-21', 8.0, 'FILME', ARRAY ['Ficção Científica','Aventura'], ARRAY ['Max']),
                         ('Interestelar', 'Exploradores cruzam um buraco de minhoca em busca de um novo lar para a humanidade.',
                          DATE '2014-11-06', 8.7, 'FILME', ARRAY ['Ficção Científica','Drama'], ARRAY ['Netflix','Prime Video']),
                         ('Cidade de Deus', 'Dois garotos seguem caminhos opostos numa favela carioca dos anos 60 e 70.',
                          DATE '2002-08-30', 8.6, 'FILME', ARRAY ['Drama'], ARRAY ['Globoplay']),
                         ('Parasita', 'Uma família pobre se infiltra na casa de uma família rica e o plano sai do controle.',
                          DATE '2019-11-07', 8.5, 'FILME', ARRAY ['Suspense','Drama'], ARRAY ['Prime Video']),
                         ('O Poderoso Chefão', 'O patriarca de uma dinastia do crime transfere o controle ao filho relutante.',
                          DATE '1972-09-14', 9.2, 'FILME', ARRAY ['Drama'], ARRAY ['Netflix']),
                         ('Toy Story', 'Brinquedos ganham vida quando ninguém está olhando, e um novo rival chega ao quarto.',
                          DATE '1995-12-21', 8.3, 'FILME', ARRAY ['Animação','Comédia'], ARRAY ['Disney+']),
                         ('Breaking Bad', 'Um professor de química com câncer terminal passa a fabricar metanfetamina.',
                          DATE '2008-01-20', 9.5, 'SERIE', ARRAY ['Drama','Suspense'], ARRAY ['Netflix']),
                         ('Round 6', 'Endividados disputam jogos infantis mortais por um prêmio milionário.',
                          DATE '2021-09-17', 8.0, 'SERIE', ARRAY ['Suspense','Drama'], ARRAY ['Netflix']),
                         ('The Last of Us', 'Um contrabandista escolta uma adolescente imune por um EUA devastado.',
                          DATE '2023-01-15', 8.7, 'SERIE', ARRAY ['Drama','Terror'], ARRAY ['Max']),
                         ('Ted Lasso', 'Um técnico de futebol americano assume um time inglês sem entender de futebol.',
                          DATE '2020-08-14', 8.8, 'SERIE', ARRAY ['Comédia'], ARRAY ['Apple TV+'])
                 ) AS v(titulo, descricao, data_lancamento, nota, tipo, categorias, streamings)
            LOOP
                SELECT id INTO novo_id FROM filme WHERE titulo = t.titulo;

                IF novo_id IS NULL THEN
                    INSERT INTO filme (titulo, descricao, data_lancamento, nota, tipo, criado_em)
                    VALUES (t.titulo, t.descricao, t.data_lancamento, t.nota, t.tipo, now())
                    RETURNING id INTO novo_id;
                END IF;

                -- ON CONFLICT casa com a PK composta criada na V11.
                INSERT INTO filme_categoria (filme_id, categoria_id)
                SELECT novo_id, c.id
                FROM categoria c
                WHERE lower(c.nome) = ANY (SELECT lower(unnest(t.categorias)))
                ON CONFLICT DO NOTHING;

                INSERT INTO filme_streaming (filme_id, streaming_id)
                SELECT novo_id, s.id
                FROM streaming s
                WHERE lower(s.nome) = ANY (SELECT lower(unnest(t.streamings)))
                ON CONFLICT DO NOTHING;
            END LOOP;
    END
$$;
