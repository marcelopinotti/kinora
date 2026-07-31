import { FormEvent, useState } from 'react';
import { api, mensagemGenerica } from '../../api';

export function ExcluirConta({ aoExcluir }: Readonly<{ aoExcluir: () => void }>) {
  // `confirmando` é o estado da caixa aberta; o texto digitado vive junto porque
  // fechar a caixa tem que descartar os dois.
  const [confirmando, setConfirmando] = useState(false);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  function abrir() {
    setConfirmando(true);
    setTexto('');
    setErro('');
  }

  function fechar() {
    setConfirmando(false);
    setTexto('');
    setErro('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (excluindo) return;
    if (texto.trim().toUpperCase() !== 'EXCLUIR') {
      setErro('Digite EXCLUIR para confirmar a exclusão.');
      return;
    }
    setExcluindo(true);
    try {
      await api.excluirConta();
      aoExcluir();
    } catch (err) {
      setErro(mensagemGenerica(err));
      setExcluindo(false);
    }
    // Sem finally: no caminho de sucesso o componente é desmontado pela navegação,
    // e reabilitar o botão abriria janela para um segundo DELETE.
  }

  return (
    <section className="rounded-[14px] border border-[rgba(255,106,74,0.28)] bg-linear-to-b from-[rgba(232,80,42,0.09)] to-[rgba(20,20,23,0.9)] px-[clamp(20px,4vw,32px)] pt-[clamp(22px,4vw,30px)] pb-[clamp(24px,4vw,32px)]">
      <h2 className="text-error-soft mb-2 text-[21px] font-extrabold tracking-[-0.02em]">Excluir conta</h2>
      <p className="text-t2 max-w-[560px] text-[15px] leading-[1.55] [text-wrap:pretty]">
        Sua conta e seu histórico são apagados de forma permanente. Os filmes, categorias e streamings que você
        cadastrou continuam no catálogo.
      </p>
      {/* o botão que abre a confirmação tem o mesmo respiro que o painel que ele abre */}
      {!confirmando && (
        <button type="button" className="btn btn-danger-outline mt-6" onClick={abrir}>
          Excluir minha conta
        </button>
      )}
      {confirmando && (
        <div className="mt-6 rounded-xl border border-[rgba(255,106,74,0.34)] bg-[#1b1416] px-6 py-[22px]">
          <h3 className="mb-1.5 text-base font-extrabold">Tem certeza que deseja excluir sua conta?</h3>
          <p className="text-t4 mb-5 text-sm">
            Esta ação não pode ser desfeita. Digite <strong className="text-white">EXCLUIR</strong> para confirmar.
          </p>
          <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="conta-confirmar-exclusao">
              Digite EXCLUIR para confirmar a exclusão
            </label>
            <input
              id="conta-confirmar-exclusao"
              className={`input h-[50px] min-w-[180px] flex-1 px-4 text-[15px] ${erro ? 'input-invalid' : ''}`.trim()}
              placeholder="EXCLUIR"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                setErro('');
              }}
              disabled={excluindo}
              aria-invalid={!!erro}
              aria-describedby={erro ? 'conta-confirmar-exclusao-erro' : undefined}
            />
            <button type="submit" className="btn btn-danger" disabled={excluindo}>
              Excluir definitivamente
            </button>
            <button type="button" className="btn btn-ghost" onClick={fechar} disabled={excluindo}>
              Cancelar
            </button>
          </form>
          {erro && (
            <p className="field-error" id="conta-confirmar-exclusao-erro">
              {erro}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
