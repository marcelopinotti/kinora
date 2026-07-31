import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../auth';
import { ApiError, api, mensagemGenerica, type FilmeResponse } from '../api';

export function Detalhe() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [filme, setFilme] = useState<FilmeResponse | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let cancelled = false;
    setFilme(null);
    setErro('');
    api
      .filme(Number(id))
      .then((f) => {
        if (!cancelled) setFilme(f);
      })
      .catch((err) => {
        if (cancelled) return;
        // 404 tem mensagem própria: "tente novamente" não ajuda quem digitou um id que não existe.
        setErro(err instanceof ApiError && err.status === 404 ? 'Título não encontrado.' : mensagemGenerica(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (erro) {
    return (
      <div className="relative min-h-screen pb-[70px]">
        <TopBar />
        <p className="state-msg state-error">{erro}</p>
      </div>
    );
  }

  if (!filme) {
    return (
      <div className="relative min-h-screen pb-[70px]">
        <TopBar />
        <p className="state-msg">Carregando título...</p>
      </div>
    );
  }

  const ano = filme.dataLancamento ? filme.dataLancamento.slice(-4) : null;
  const genero = filme.categorias[0]?.nome ?? null;

  return (
    <div className="relative min-h-screen pb-[70px]">
      <TopBar />
      <section className="relative pb-6">
        {/* O fundo é o próprio pôster, injetado como custom property; sem pôster o
            elemento nem existe e a tela cai no fundo padrão. encodeURI escapa as
            aspas: a URL vem do usuário e não pode fechar o url(") e emendar CSS. */}
        {filme.posterUrl && (
          <div
            className="detalhe-bg"
            aria-hidden="true"
            style={{ ['--poster' as any]: `url("${encodeURI(filme.posterUrl)}")` }}
          />
        )}
        {/* Empilha antes de o texto ficar espremido ao lado do pôster de 300px. */}
        <div className="px-pad relative z-1 mx-auto grid w-full max-w-[calc(1180px+var(--spacing-pad)*2)] grid-cols-[minmax(0,300px)_minmax(0,1fr)] items-start gap-[clamp(22px,4vw,48px)] pt-[clamp(22px,4vw,44px)] max-[860px]:grid-cols-[minmax(0,1fr)]">
          {/* o pôster nítido é o herói da tela: 2:3, raio e sombra do handoff */}
          {filme.posterUrl ? (
            <div className="border-border-2 bg-surface-2 shadow-card aspect-[2/3] overflow-hidden rounded-xl border max-[860px]:w-[min(210px,55%)]">
              <img className="block size-full object-cover" src={filme.posterUrl} alt={`Pôster de ${filme.titulo}`} />
            </div>
          ) : (
            // sem pôster não há .detalhe-bg: a moldura sozinha segura a composição
            <div className="art-empty border-border-2 shadow-card flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl border max-[860px]:w-[min(210px,55%)]">
              <span className="text-muted-2 font-mono text-[11px] tracking-[0.1em] uppercase">arte do título</span>
            </div>
          )}
          {/* .on-poster reforça a legibilidade sobre o desfoque, além do véu.
              Só no texto: sombra em rótulo de botão ou pílula é sujeira. */}
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
            {filme.categorias.length > 0 && (
              <div className="mt-6">
                <p className="on-poster text-muted mb-2.5 text-xs font-bold tracking-[0.14em] uppercase">Categorias</p>
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {filme.categorias.map((c) => (
                    <span key={c.id} className="pill">
                      {c.nome}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {filme.streamings.length > 0 && (
              <div className="mt-6">
                <p className="on-poster text-muted mb-2.5 text-xs font-bold tracking-[0.14em] uppercase">
                  Onde assistir
                </p>
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {filme.streamings.map((s) => (
                    <span key={s.id} className="pill">
                      {s.nome}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              {user && (
                <Link to={`/filme/${filme.id}/editar`} className="btn btn-primary btn-tall">
                  Editar
                </Link>
              )}
              <Link to="/" className="btn btn-ghost btn-tall">
                Voltar ao catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
