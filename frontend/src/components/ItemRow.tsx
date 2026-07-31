import { useState } from 'react';
import { ApiError, mensagemGenerica } from '../api';
import type { Item } from './ListaSimples';

function mensagemEmUso(nome: string, entidade: 'categoria' | 'streaming'): string {
  const alvo = entidade === 'streaming' ? 'este streaming' : 'esta categoria';
  return `Não foi possível excluir: ${nome} está em uso por filmes do catálogo. Remova ${alvo} dos filmes antes.`;
}

function mensagemErroNome(err: unknown): string {
  if (err instanceof ApiError && err.campos?.nome) return err.campos.nome;
  return mensagemGenerica(err);
}

type ItemRowProps = {
  item: Item;
  entidade: 'categoria' | 'streaming';
  /** Quem manda no modo de edição é o pai, para só uma linha editar por vez. */
  editando: boolean;
  aoIniciarEdicao: (id: number) => void;
  aoCancelarEdicao: () => void;
  /** Precisa da lista inteira para detectar nome repetido, então mora no pai. */
  validarNome: (nome: string, ignorarId: number) => string | null;
  atualizarItem: (id: number, nome: string) => Promise<Item>;
  excluirItem: (id: number) => Promise<void>;
  aoAtualizado: (item: Item) => void;
  aoExcluido: (id: number) => void;
};

/**
 * Uma linha da lista, dona do próprio rascunho, erro e estado de ocupada.
 *
 * Antes esses três viviam no pai como dois `Record<number, …>` paralelos, que
 * cresciam pela sessão inteira e nunca eram limpos ao excluir um item — um id
 * reaproveitado herdava o estado do anterior. Com o estado dentro da linha, o
 * problema deixa de existir por construção: a linha some, o estado vai junto.
 */
export function ItemRow({
  item,
  entidade,
  editando,
  aoIniciarEdicao,
  aoCancelarEdicao,
  validarNome,
  atualizarItem,
  excluirItem,
  aoAtualizado,
  aoExcluido,
}: Readonly<ItemRowProps>) {
  const [draft, setDraft] = useState(item.nome);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  const editId = `lista-edit-${entidade}-${item.id}`;

  function iniciar() {
    setDraft(item.nome);
    setErro('');
    aoIniciarEdicao(item.id);
  }

  function cancelar() {
    // Cancelar não pode deixar a linha vermelha.
    setErro('');
    aoCancelarEdicao();
  }

  async function salvar() {
    const invalido = validarNome(draft, item.id);
    if (invalido) {
      setErro(invalido);
      return;
    }
    setBusy(true);
    try {
      const atualizado = await atualizarItem(item.id, draft.trim());
      aoAtualizado(atualizado);
      setErro('');
      aoCancelarEdicao();
    } catch (err) {
      setErro(mensagemErroNome(err));
    } finally {
      setBusy(false);
    }
  }

  async function excluir() {
    setBusy(true);
    try {
      await excluirItem(item.id);
      aoExcluido(item.id);
      // Sem setBusy(false): a linha é desmontada pelo pai ao sair da lista.
    } catch (err) {
      setErro(err instanceof ApiError && err.status === 409 ? mensagemEmUso(item.nome, entidade) : mensagemGenerica(err));
      setBusy(false);
    }
  }

  return (
    <div
      className={`bg-surface-2 flex flex-col gap-[9px] rounded-[10px] border py-[13px] pr-3.5 pl-4 ${
        erro ? 'border-[rgba(255,106,74,0.4)]' : 'border-[rgba(255,255,255,0.05)]'
      }`}
    >
      {editando ? (
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="sr-only" htmlFor={editId}>
            Nome
          </label>
          <input
            id={editId}
            className="input border-accent h-10 min-w-[160px] flex-1 rounded-[7px] px-3.5 text-[15px]"
            value={draft}
            maxLength={100}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
            aria-invalid={!!erro}
            aria-describedby={erro ? `${editId}-erro` : undefined}
          />
          <button type="button" className="btn-row btn-row-solid" onClick={salvar} disabled={busy}>
            Salvar
          </button>
          <button type="button" className="btn-row btn-row-plain" onClick={cancelar} disabled={busy}>
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3.5">
          <span className="min-w-[120px] flex-1 text-[15px] font-semibold text-[#eaeaef] [overflow-wrap:anywhere]">
            {item.nome}
          </span>
          <span className="text-muted-2 font-mono text-[11px]">#{item.id}</span>
          <div className="flex gap-2">
            <button type="button" className="btn-row" onClick={iniciar} disabled={busy}>
              Editar
            </button>
            <button type="button" className="btn-row btn-row-danger" onClick={excluir} disabled={busy}>
              Excluir
            </button>
          </div>
        </div>
      )}
      {erro && (
        <p className="field-error" id={`${editId}-erro`}>
          {erro}
        </p>
      )}
    </div>
  );
}
