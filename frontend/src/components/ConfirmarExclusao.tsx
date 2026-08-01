import { useEffect, useRef } from 'react';

type ConfirmarExclusaoProps = {
  aberto: boolean;
  /** Entra no título: "Excluir {alvo} permanentemente?". */
  alvo: string;
  /** Nome do registro, citado no corpo para não restar dúvida de qual é. */
  nome: string;
  /** Id do <h2>, para o aria-labelledby não colidir entre linhas da mesma lista. */
  tituloId: string;
  aoConfirmar: () => void;
  aoFechar: () => void;
};

/**
 * Confirmação de exclusão num <dialog> nativo.
 *
 * showModal() entrega foco preso, Esc para fechar, o resto da página inerte e
 * ::backdrop sem que nada disso precise ser reimplementado — é o motivo de não
 * haver um overlay feito à mão aqui.
 */
export function ConfirmarExclusao({
  aberto,
  alvo,
  nome,
  tituloId,
  aoConfirmar,
  aoFechar,
}: Readonly<ConfirmarExclusaoProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // O <dialog> só abre por chamada imperativa. Este efeito é o que deixa quem
  // usa o componente pensar em estado (`aberto`) e não em ref. close() em diálogo
  // já fechado é no-op, então não precisa de guarda própria.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (aberto) dialog?.showModal();
    else dialog?.close();
  }, [aberto]);

  return (
    <dialog
      ref={dialogRef}
      onClose={aoFechar}
      aria-labelledby={tituloId}
      className="border-border-3 m-auto w-[min(430px,calc(100vw-32px))] rounded-xl border p-0 backdrop:bg-scrim"
    >
      <div className="px-6.5 py-6">
        <h2 id={tituloId} className="mb-2 text-[17px] font-extrabold text-white">
          Excluir {alvo} permanentemente?
        </h2>
        <p className="text-t3 mb-6 text-sm leading-[1.55] wrap-anywhere">
          “{nome}” será removido de forma permanente. Esta ação não pode ser desfeita.
        </p>
        {/* Cancelar primeiro no DOM: é ele que o <dialog> foca ao abrir, e o foco
            tem que cair na saída segura, não no botão destrutivo. */}
        <div className="flex flex-wrap justify-end gap-2.5">
          <button type="button" className="btn btn-ghost btn-sm" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={aoConfirmar}>
            Excluir permanentemente
          </button>
        </div>
      </div>
    </dialog>
  );
}
