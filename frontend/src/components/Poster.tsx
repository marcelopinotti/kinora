type PosterProps = {
  url: string | null;
  alt: string;
  /** Moldura: raio, borda e sombra mudam entre o card do catálogo e o detalhe. */
  className?: string;
  textoVazioClassName?: string;
  lazy?: boolean;
};

/**
 * Moldura 2:3 com fallback para "sem arte". O par imagem/placeholder estava
 * escrito três vezes — card do catálogo, detalhe e preview do formulário — sempre
 * com a mesma estrutura e classes ligeiramente diferentes.
 *
 * A moldura de tamanho fixo é o que impede imagem quebrada de furar o layout.
 */
export function Poster({ url, alt, className = '', textoVazioClassName = 'text-[10px]', lazy }: Readonly<PosterProps>) {
  const moldura = `aspect-[2/3] overflow-hidden border ${className}`.trim();

  if (!url) {
    return (
      <div className={`art-empty flex items-center justify-center ${moldura}`}>
        <span className={`text-muted-2 font-mono tracking-[0.1em] uppercase ${textoVazioClassName}`}>
          arte do título
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-surface-2 ${moldura}`}>
      <img className="block size-full object-cover" src={url} alt={alt} loading={lazy ? 'lazy' : undefined} />
    </div>
  );
}
