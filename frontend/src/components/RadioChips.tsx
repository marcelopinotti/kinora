type Opcao<T> = { valor: T; rotulo: string };

type RadioChipsProps<T> = {
  legenda: string;
  /** Quando true, o rótulo do grupo some da tela mas continua no leitor de tela. */
  legendaOculta?: boolean;
  opcoes: readonly Opcao<T>[];
  valor: T;
  aoSelecionar: (valor: T) => void;
  chipClassName?: string;
};

/**
 * Chips de seleção única — o irmão do ChipGroup, que é de seleção múltipla.
 *
 * São componentes separados de propósito: o ChipGroup usa `aria-pressed`, que
 * descreve alternância independente; aqui a semântica correta é radiogroup com
 * `aria-checked`, porque escolher uma opção desmarca a outra. Enfiar os dois casos
 * no mesmo componente economizaria um arquivo e mentiria para o leitor de tela.
 *
 * Genérico no tipo do valor para servir tanto ao Tipo do formulário quanto ao
 * filtro de categoria do catálogo, cujo valor é `number | null`.
 */
export function RadioChips<T extends string | number | null>({
  legenda,
  legendaOculta,
  opcoes,
  valor,
  aoSelecionar,
  chipClassName = '',
}: Readonly<RadioChipsProps<T>>) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className={legendaOculta ? 'sr-only' : 'field-label'}>{legenda}</legend>
      <div className="flex flex-wrap gap-2.5" role="radiogroup">
        {opcoes.map((o) => {
          const on = o.valor === valor;
          return (
            <button
              key={String(o.valor)}
              type="button"
              className={`chip ${chipClassName} ${on ? 'chip-on' : ''}`.replace(/\s+/g, ' ').trim()}
              role="radio"
              aria-checked={on}
              onClick={() => aoSelecionar(o.valor)}
            >
              {o.rotulo}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
