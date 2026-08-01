import {useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
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

export function Catalogo({tipo}: Readonly<{ tipo?: Tipo }>) {
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
                    className="px-pad grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5.5 pt-6.5 xl:grid-cols-4">
                    {filtrados.map((f) => (
                        <FilmeCard key={f.id} filme={f} logado={!!user}/>
                    ))}
                </div>
            </Estado>
        </>
    );
}

function FilmeCard({
                       filme,
                       logado,
                   }: Readonly<{
    filme: FilmeResponse;
    logado: boolean;
}>) {
    const ano = filme.dataLancamento ? filme.dataLancamento.slice(-4) : null;

    return (
        // Nada de <a> envolvendo o card: "Editar" é um link de verdade e link
        // dentro de link é HTML inválido. O card é um <article> e quem cobre a
        // área clicável é o ::after do link do título (padrão "stretched link"),
        // que também desenha o anel de foco no tamanho do card.
        <article
            className="bg-surface hover:border-accent-line has-[a:focus-visible]:border-accent-line relative flex h-full min-w-0 flex-col gap-3.5 rounded-xl border p-6.5 pb-5.5 transition-[transform,border-color] duration-180 hover:-translate-y-1">
                {/* pílula "Série": 8px dentro da arte (padding do card = 26px), à esquerda.
            Aparece em toda lista, inclusive em /series. Condicionar à lista
            misturada fazia a mesma série ter plaquinha na home e não ter na aba
            Séries — o que se lia como falha, não como economia de tinta. */}
                {filme.tipo === 'SERIE' && (
                    <span
                        className="bg-scrim border-border-3 absolute top-8.5 left-8.5 z-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] text-white uppercase backdrop-blur-[6px]">
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
                <h3 className="text-[22px] font-extrabold tracking-[-0.02em] wrap-anywhere">
                    <Link
                        to={`/titulo/${filme.id}`}
                        className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-accent focus-visible:after:outline-2 focus-visible:after:outline-offset-[3px]"
                    >
                        {filme.titulo}
                    </Link>
                </h3>
                {filme.descricao && (
                    <p className="text-sm leading-normal text-[#a2a2a9] text-pretty">{filme.descricao}</p>
                )}
                <div className="text-t2 mt-auto flex flex-wrap gap-3.5 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="bg-accent size-2.75 flex-none rounded-[3px]" aria-hidden="true"/>
              {filme.nota.toFixed(1).replace('.', ',')} / 10
          </span>
                    {ano && (
                        <span className="flex items-center gap-1.5">
              <span className="border-accent size-2.75 flex-none rounded-full border-2" aria-hidden="true"/>
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
                    {/* relative z-1: fica acima do ::after que cobre o card, senão
                        o clique em "Editar" cairia no link do título. */}
                    {logado && (
                        <Link
                            to={`/filme/${filme.id}/editar`}
                            className="text-accent relative z-1 text-xs font-bold whitespace-nowrap"
                        >
                            Editar
                        </Link>
                    )}
                </div>
        </article>
    );
}
