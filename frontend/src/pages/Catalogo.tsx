import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../auth';
import { api, mensagemGenerica, type Categoria, type FilmeResponse, type Tipo } from '../api';

// Uma página só para /, /filmes e /series: muda a cópia e o param da API, não o
// componente. Chave undefined = catálogo inteiro.
const COPIA = {
  todos: { eyebrow: 'Catálogo', h2: 'Em alta hoje', vazio: 'Nenhum título encontrado.' },
  FILME: { eyebrow: 'Filmes', h2: 'Todos os filmes', vazio: 'Nenhum filme encontrado.' },
  SERIE: { eyebrow: 'Séries', h2: 'Todas as séries', vazio: 'Nenhuma série encontrada.' },
};

export function Catalogo({ tipo }: { tipo?: Tipo }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [filmes, setFilmes] = useState<FilmeResponse[] | null>(null);
  const [erro, setErro] = useState('');
  const [erroCategorias, setErroCategorias] = useState('');

  const copia = COPIA[tipo ?? 'todos'];

  useEffect(() => {
    api
      .categorias()
      .then(setCategorias)
      .catch(() => setErroCategorias('Não foi possível carregar os filtros.'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFilmes(null);
    setErro('');
    api
      .filmes({ tipo, categoria: selecionada ?? undefined })
      .then((data) => {
        if (!cancelled) setFilmes(data);
      })
      .catch((err) => {
        if (!cancelled) setErro(mensagemGenerica(err));
      });
    return () => {
      cancelled = true;
    };
  }, [tipo, selecionada]);

  const filtrados = useMemo(() => {
    if (!filmes) return [];
    if (!q) return filmes;
    return filmes.filter(
      (f) => f.titulo.toLowerCase().includes(q) || (f.descricao ?? '').toLowerCase().includes(q),
    );
  }, [filmes, q]);

  return (
    <div className="relative min-h-screen pb-[70px]">
      <TopBar />
      <div className="px-pad flex flex-wrap items-end justify-between gap-5 pt-3.5">
        <div>
          <p className="eyebrow">{copia.eyebrow}</p>
          <h2 className="text-[clamp(24px,5vw,30px)] font-extrabold tracking-[-0.02em]">{copia.h2}</h2>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            className={`chip chip-filter ${selecionada === null ? 'chip-on' : ''}`.trim()}
            onClick={() => setSelecionada(null)}
          >
            Todos
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip chip-filter ${selecionada === c.id ? 'chip-on' : ''}`.trim()}
              onClick={() => setSelecionada(c.id)}
            >
              {c.nome}
            </button>
          ))}
          {/* .field-error dá o tratamento visual de erro sem o padding de bloco do .state-msg */}
          {erroCategorias && <p className="field-error">{erroCategorias}</p>}
        </div>
      </div>

      {erro && <p className="state-msg state-error">{erro}</p>}
      {!erro && filmes === null && <p className="state-msg">Carregando catálogo...</p>}
      {!erro && filmes !== null && filtrados.length === 0 && <p className="state-msg">{copia.vazio}</p>}
      {!erro && filtrados.length > 0 && (
        // auto-fill mantém as 4 colunas do handoff no desktop e degrada sozinho
        <div className="px-pad grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[22px] pt-[26px] xl:grid-cols-4">
          {filtrados.map((f) => (
            // O badge de tipo só faz sentido na lista misturada.
            <FilmeCard key={f.id} filme={f} logado={!!user} mostrarBadge={tipo === undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilmeCard({
  filme,
  logado,
  mostrarBadge,
}: {
  filme: FilmeResponse;
  logado: boolean;
  mostrarBadge: boolean;
}) {
  const navigate = useNavigate();
  const top10 = filme.nota >= 9;
  const ano = filme.dataLancamento ? filme.dataLancamento.slice(-4) : null;

  // O card inteiro virou <a>: "Editar" não pode ser outro <a> aninhado (HTML
  // inválido), então é um span com papel de link e teclado no braço.
  function irParaEdicao(e: { preventDefault(): void; stopPropagation(): void }) {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/filme/${filme.id}/editar`);
  }

  return (
    // 'group' substitui as regras .card:hover / .card-link:focus-visible > .card:
    // o alvo do foco é o <a>, mas quem se pinta é o <article> dentro dele.
    <Link
      className="group focus-visible:outline-accent flex h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-[3px]"
      to={`/titulo/${filme.id}`}
    >
      <article className="border-border bg-surface group-hover:border-accent-line group-focus-visible:border-accent-line relative flex min-w-0 flex-1 flex-col gap-3.5 rounded-xl border p-[26px] pb-[22px] transition-[transform,border-color] duration-[180ms] group-hover:-translate-y-1">
        {top10 && (
          <div className="bg-accent absolute top-0 right-5 w-[30px] rounded-b-[3px] pt-[5px] pb-[7px] text-center text-[9px] leading-[1.15] font-extrabold">
            TOP
            <br />
            10
          </div>
        )}
        {/* pílula "Série": 8px dentro da arte (padding do card = 26px), à esquerda,
            longe do selo TOP 10 que mora no topo direito. */}
        {mostrarBadge && filme.tipo === 'SERIE' && (
          <span className="bg-scrim border-border-3 absolute top-[34px] left-[34px] z-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] text-white uppercase backdrop-blur-[6px]">
            Série
          </span>
        )}
        {/* moldura 2:3 com tamanho próprio: imagem quebrada não fura o layout */}
        {filme.posterUrl ? (
          <div className="border-border bg-surface-2 aspect-[2/3] overflow-hidden rounded-[10px] border">
            <img
              className="block size-full object-cover"
              src={filme.posterUrl}
              alt={`Pôster de ${filme.titulo}`}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="art-empty border-border flex aspect-[2/3] items-center justify-center overflow-hidden rounded-[10px] border">
            <span className="text-muted-2 font-mono text-[10px] tracking-[0.1em] uppercase">arte do título</span>
          </div>
        )}
        <h3 className="text-[22px] font-extrabold tracking-[-0.02em] [overflow-wrap:anywhere]">{filme.titulo}</h3>
        {filme.descricao && (
          <p className="text-sm leading-normal text-[#a2a2a9] [text-wrap:pretty]">{filme.descricao}</p>
        )}
        <div className="text-t2 mt-auto flex flex-wrap gap-3.5 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="bg-accent size-[11px] flex-none rounded-[3px]" aria-hidden="true" />
            {filme.nota.toFixed(1).replace('.', ',')} / 10
          </span>
          {ano && (
            <span className="flex items-center gap-1.5">
              <span className="border-accent size-[11px] flex-none rounded-full border-2" aria-hidden="true" />
              {ano}
            </span>
          )}
        </div>
        <div className="border-border mt-0.5 flex flex-wrap items-center justify-between gap-2.5 border-t pt-3.5">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {filme.streamings.map((s) => (
              <span key={s.id} className="pill">
                {s.nome}
              </span>
            ))}
          </div>
          {logado && (
            <span
              className="text-accent text-xs font-bold whitespace-nowrap"
              role="link"
              tabIndex={0}
              onClick={irParaEdicao}
              onKeyDown={(e) => {
                if (e.key === 'Enter') irParaEdicao(e);
              }}
            >
              Editar
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
