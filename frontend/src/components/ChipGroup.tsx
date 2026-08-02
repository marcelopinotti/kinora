type Opcao = { id: number; nome: string };

type ChipGroupProps = {
  legenda: string;
  opcoes: readonly Opcao[];
  selecionados: readonly number[];
  aoAlternar: (id: number) => void;
  erro?: string;
  erroId?: string;
  vazio?: string;
};

/**
 * Grupo de chips selecionáveis. O mesmo mapa de `chip ${sel ? 'chip-on' : ''}`
 * aparecia em quatro lugares: categorias, streamings e tipo no formulário, mais
 * o filtro do catálogo.
 *
 * `fieldset`/`legend` em vez de div: é uma seleção múltipla de verdade, e assim o
 * leitor de tela anuncia o rótulo do grupo antes de cada opção. aria-pressed dá o
 * estado de cada botão, que antes era transmitido só pela cor.
 */
export function ChipGroup({
  legenda,
  opcoes,
  selecionados,
  aoAlternar,
  erro,
  erroId,
  vazio,
}: Readonly<ChipGroupProps>) {
  return (
    <fieldset className="min-w-0 border-0 p-0" aria-describedby={erro && erroId ? erroId : undefined}>
      <legend className="field-label">{legenda}</legend>
      {opcoes.length === 0 && vazio ? (
        <p className="text-t3 text-sm">{vazio}</p>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {opcoes.map((o) => {
            const on = selecionados.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                className={`chip ${on ? 'chip-on' : ''}`.trim()}
                aria-pressed={on}
                onClick={() => aoAlternar(o.id)}
              >
                {o.nome}
              </button>
            );
          })}
        </div>
      )}
      {erro && (
        <p className="field-error" id={erroId}>
          {erro}
        </p>
      )}
    </fieldset>
  );
}
