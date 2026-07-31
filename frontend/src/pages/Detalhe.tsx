import {type CSSProperties} from 'react';
import {Link, useParams} from 'react-router-dom';
import {Estado} from '../components/Estado';
import {PillList} from '../components/PillList';
import {Poster} from '../components/Poster';
import {useAuth} from '../auth';
import {ApiError, api, mensagemGenerica, type FilmeResponse} from '../api';
import {useFetch} from '../hooks/useFetch';

// 404 tem mensagem própria: "tente novamente" não ajuda quem digitou um id inexistente.
function mensagemDoDetalhe(err: unknown): string {
    return err instanceof ApiError && err.status === 404 ? 'Título não encontrado.' : mensagemGenerica(err);
}

const MOLDURA_POSTER =
    'border-border-2 shadow-card rounded-xl max-[860px]:w-[min(210px,55%)]';

/** Fundo desfocado feito do próprio pôster; sem pôster a tela cai no fundo padrão. */
function FundoPoster({url}: Readonly<{ url: string }>) {
    return (
        <div
            className="detalhe-bg"
            aria-hidden="true"
            // encodeURI escapa as aspas: a URL vem do usuário e não pode fechar o
            // url(") e emendar CSS. CSSProperties não aceita custom property no
            // tipo, então a asserção é no objeto inteiro em vez de `as any` na
            // chave, para não desligar a checagem das demais propriedades.
            style={{'--poster': `url("${encodeURI(url)}")`} as CSSProperties}
        />
    );
}

/**
 * Coluna de texto. Separada do Detalhe porque era ela que concentrava os ramos:
 * nota, ano, gênero, sinopse, duas listas de pílulas e o botão de editar, cada um
 * com sua condição.
 */
function InfoTitulo({filme, logado}: Readonly<{ filme: FilmeResponse; logado: boolean }>) {
    const ano = filme.dataLancamento?.slice(-4) ?? null;
    const genero = filme.categorias[0]?.nome ?? null;

    return (
        // .on-poster reforça a legibilidade sobre o desfoque, além do véu.
        // Só no texto: sombra em rótulo de botão ou pílula é sujeira.
        <div className="min-w-0">
            <p className="eyebrow on-poster">{filme.tipo === 'SERIE' ? 'Série' : 'Filme'}</p>
            <h1 className="on-poster mt-1 text-[clamp(30px,6vw,50px)] leading-[1.05] font-extrabold tracking-[-0.02em] text-balance [overflow-wrap:anywhere]">
                {filme.titulo}
            </h1>

            <div className="text-t2 on-poster mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="bg-accent-soft border-accent-line rounded-full border px-3 py-[5px] text-[15px] font-extrabold text-white">
          {filme.nota.toFixed(1).replace('.', ',')}
        </span>
                {/* .dot-sep põe o • só ENTRE os metadados de texto — a nota é um bloco à parte */}
                <span className="dot-sep flex flex-wrap items-center gap-3">
          {ano && <span>{ano}</span>}
                    {genero && <span>{genero}</span>}
        </span>
            </div>

            {filme.descricao && (
                <p className="on-poster text-t2 mt-5 max-w-[62ch] text-base leading-[1.65] [text-wrap:pretty]">
                    {filme.descricao}
                </p>
            )}

            <PillList titulo="Categorias" itens={filme.categorias}/>
            <PillList titulo="Onde assistir" itens={filme.streamings}/>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
                {logado && (
                    <Link to={`/filme/${filme.id}/editar`} className="btn btn-primary btn-tall">
                        Editar
                    </Link>
                )}
                <Link to="/" className="btn btn-ghost btn-tall">
                    Voltar ao catálogo
                </Link>
            </div>
        </div>
    );
}

export function Detalhe() {
    const {id} = useParams<{ id: string }>();
    const {user} = useAuth();

    const idNum = Number(id);
    const idValido = Number.isInteger(idNum) && idNum > 0;

    const {data: filme, erro, carregando} = useFetch<FilmeResponse>(
        // /titulo/abc virava GET /api/filme/NaN, que volta 400 e caía na mensagem
        // genérica. Rejeitar como 404 aqui reaproveita o tradutor acima.
        () => (idValido ? api.filme(idNum) : Promise.reject(new ApiError(404))),
        [id],
        mensagemDoDetalhe,
    );

    return (
        <Estado carregando={carregando} erro={erro} mensagemCarregando="Carregando título...">
            {filme && (
                <section className="relative pb-6">
                    {filme.posterUrl && <FundoPoster url={filme.posterUrl}/>}
                    {/* Empilha antes de o texto ficar espremido ao lado do pôster de 300px. */}
                    <div
                        className="px-pad relative z-1 mx-auto grid w-full max-w-[calc(1180px+var(--spacing-pad)*2)] grid-cols-[minmax(0,300px)_minmax(0,1fr)] items-start gap-[clamp(22px,4vw,48px)] pt-[clamp(22px,4vw,44px)] max-[860px]:grid-cols-[minmax(0,1fr)]">
                        {/* o pôster nítido é o herói da tela: 2:3, raio e sombra do handoff */}
                        <Poster
                            url={filme.posterUrl}
                            alt={`Pôster de ${filme.titulo}`}
                            className={MOLDURA_POSTER}
                            textoVazioClassName="text-[11px]"
                        />
                        <InfoTitulo filme={filme} logado={!!user}/>
                    </div>
                </section>
            )}
        </Estado>
    );
}
