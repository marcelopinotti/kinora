type PillListProps = {
  titulo: string;
  itens: readonly { id: number; nome: string }[];
};

/**
 * Bloco "rótulo + lista de pílulas". Aparecia duas vezes seguidas no detalhe
 * (Categorias e Onde assistir), com doze linhas idênticas cada.
 *
 * Devolve null com a lista vazia, para o chamador não precisar do `length > 0 &&`
 * em volta — era justamente essa condição, repetida, que somava complexidade na
 * tela sem descrever nenhuma regra.
 */
export function PillList({ titulo, itens }: Readonly<PillListProps>) {
  if (itens.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="on-poster text-muted mb-2.5 text-xs font-bold tracking-[0.14em] uppercase">{titulo}</p>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {itens.map((i) => (
          <span key={i.id} className="pill">
            {i.nome}
          </span>
        ))}
      </div>
    </div>
  );
}
