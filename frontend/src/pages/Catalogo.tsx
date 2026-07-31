import {useMemo, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {Estado} from '../components/Estado';
import {Poster} from '../components/Poster';
import {RadioChips} from '../components/RadioChips';
import {useAuth} from '../auth';
import {api, type Categoria, type FilmeResponse, type Tipo} from '../api';
import {useFetch} from '../hooks/useFetch';

// Uma página só para /, /filmes e /series: muda a cópia e o param da API, não o
// componente. Chave undefined = catálogo inteiro.
const COPIA = {
    todos: {eyebrow: 'Catálogo', h2: 'Em alta hoje', vazio: 'Nenhum título encontrado.'},
    FILME: {eyebrow: 'Filmes', h2: 'Todos os filmes', vazio: 'Nenhum filme encontrado.'},
    SERIE: {eyebrow: 'Séries', h2: 'Todas as séries', vazio: 'Nenhuma série encontrada.'},
};

export function Catalogo({tipo}: { tipo?: Tipo }) {
    const {user} = useAuth();
    const [searchParams] = useSearchParams();
    const q = (searchParams.get('q') ?? '').trim().toLowerCase();

    const [selecionada, setSelecionada] = useState<number | null>(null);

    const copia = COPIA[tipo ?? 'todos'];

    const {data: categorias, erro: erroCategorias} = useFetch<Categoria[]>(
        () => api.categorias(),
        [],
        () => 'Não foi possível carregar os filtros.',
    );

    const {data: filmes, erro} = useFetch<FilmeResponse[]>(
        () => api.filmes({tipo, categoria: selecionada ?? undefined}),
        [tipo, selecionada],
    );

    const filtrados = useMemo(() => {
        if (!filmes) return [];
        if (!q) return filmes;
        return filmes.filter(
            (f) => f.titulo.toLowerCase().includes(q) || (f.descricao ?? '').toLowerCase().includes(q),
        );
    }, [filmes, q]);

    return (
        <>
            <div className="px-pad flex flex-wrap items-end justify-between gap-5 pt-3.5">
                <div>
                    <p className="eyebrow">{copia.eyebrow}</p>
                    <h2 className="text-[clamp(24px,5vw,30px)] font-extrabold tracking-[-0.02em]">{copia.h2}</h2>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {/* Filtrar por categoria é seleção única — escolher uma desmarca a
                        anterior — mas o estado só era transmitido pela cor do chip. */}
                    <RadioChips
                        legenda="Filtrar por categoria"
                        legendaOculta
                        opcoes={[
                            {valor: null, rotulo: 'Todos'},
                            ...(categorias ?? []).map((c) => ({valor: c.id, rotulo: c.nome})),
                        ]}
                        valor={selecionada}
                        aoSelecionar={setSelecionada}
                        chipClassName="chip-filter"
                    />
                    {/* .field-error dá o tratamento visual de erro sem o padding de bloco do .state-msg */}
                    {erroCategorias && <p className="field-error" role="alert">{erroCategorias}</p>}
                </div>
            </div>

            <Estado
                carregando={filmes === null}
                erro={erro}
                vazio={filtrados.length === 0}
                mensagemCarregando="Carregando catálogo..."
                mensagemVazio={copia.vazio}
            >
                {/* auto-fill mantém as 4 colunas do handoff no desktop e degrada sozinho */}
                <div
                    className="px-pad grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-[22px] pt-[26px] xl:grid-cols-4">
                    {filtrados.map((f) => (
                        // O badge de tipo só faz sentido na lista misturada.
                        <FilmeCard key={f.id} filme={f} logado={!!user} mostrarBadge={tipo === undefined}/>
                    ))}
                </div>
            </Estado>
        </>
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
            <article
                className="border-border bg-surface group-hover:border-accent-line group-focus-visible:border-accent-line relative flex min-w-0 flex-1 flex-col gap-3.5 rounded-xl border p-[26px] pb-[22px] transition-[transform,border-color] duration-[180ms] group-hover:-translate-y-1">
                {top10 && (
                    <div
                        className="bg-accent absolute top-0 right-5 w-[30px] rounded-b-[3px] pt-[5px] pb-[7px] text-center text-[9px] leading-[1.15] font-extrabold">
                        TOP
                        <br/>
                        10
                    </div>
                )}
                {/* pílula "Série": 8px dentro da arte (padding do card = 26px), à esquerda,
            longe do selo TOP 10 que mora no topo direito. */}
                {mostrarBadge && filme.tipo === 'SERIE' && (
                    <span
                        className="bg-scrim border-border-3 absolute top-[34px] left-[34px] z-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] text-white uppercase backdrop-blur-[6px]">
            Série
          </span>
                )}
                {/* moldura 2:3 com tamanho próprio: imagem quebrada não fura o layout */}
                <Poster
                    url={filme.posterUrl}
                    alt={`Pôster de ${filme.titulo}`}
                    className="border-border rounded-[10px]"
                    lazy
                />
                <h3 className="text-[22px] font-extrabold tracking-[-0.02em] [overflow-wrap:anywhere]">{filme.titulo}</h3>
                {filme.descricao && (
                    <p className="text-sm leading-normal text-[#a2a2a9] [text-wrap:pretty]">{filme.descricao}</p>
                )}
                <div className="text-t2 mt-auto flex flex-wrap gap-3.5 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="bg-accent size-[11px] flex-none rounded-[3px]" aria-hidden="true"/>
              {filme.nota.toFixed(1).replace('.', ',')} / 10
          </span>
                    {ano && (
                        <span className="flex items-center gap-1.5">
              <span className="border-accent size-[11px] flex-none rounded-full border-2" aria-hidden="true"/>
                            {ano}
            </span>
                    )}
                </div>
                <div
                    className="border-border mt-0.5 flex flex-wrap items-center justify-between gap-2.5 border-t pt-3.5">
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
