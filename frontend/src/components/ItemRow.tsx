import { Ref, useEffect, useRef, useState } from 'react';
import { ApiError, mensagemGenerica } from '../api';
import { ConfirmarExclusao } from './ConfirmarExclusao';
import type { Item } from './ListaSimples';

function mensagemEmUso(nome: string, entidade: 'categoria' | 'streaming'): string {
  const alvo = entidade === 'streaming' ? 'este streaming' : 'esta categoria';
  return `Não foi possível excluir: ${nome} está em uso por filmes do catálogo. Remova ${alvo} dos filmes antes.`;
}

function mensagemErroNome(err: unknown): string {
  if (err instanceof ApiError && err.campos?.nome) return err.campos.nome;
  return mensagemGenerica(err);
}

/** Linha em repouso: o nome e os dois botões. */
function LinhaLeitura({
  nome,
  ocupada,
  botaoEditarRef,
  aoEditar,
  aoExcluir,
}: Readonly<{
  nome: string;
  ocupada: boolean;
  botaoEditarRef: Ref<HTMLButtonElement>;
  aoEditar: () => void;
  aoExcluir: () => void;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-3.5">
      <span className="min-w-30 flex-1 text-[15px] font-semibold text-t1-soft wrap-anywhere">{nome}</span>
      <div className="flex gap-2">
        <button type="button" ref={botaoEditarRef} className="btn-row" onClick={aoEditar} disabled={ocupada}>
          Editar
        </button>
        <button type="button" className="btn-row btn-row-danger" onClick={aoExcluir} disabled={ocupada}>
          Excluir
        </button>
      </div>
    </div>
  );
}

/** Linha em edição: o campo de nome e as duas saídas. */
function FormEdicao({
  id,
  inputRef,
  valor,
  erro,
  ocupada,
  aoDigitar,
  aoSalvar,
  aoCancelar,
}: Readonly<{
  id: string;
  inputRef: Ref<HTMLInputElement>;
  valor: string;
  erro: string;
  ocupada: boolean;
  aoDigitar: (valor: string) => void;
  aoSalvar: () => void;
  aoCancelar: () => void;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <label className="sr-only" htmlFor={id}>
        Nome
      </label>
      <input
        ref={inputRef}
        id={id}
        className="input border-accent h-10 min-w-40 flex-1 rounded-[7px] px-3.5 text-[15px]"
        value={valor}
        maxLength={100}
        onChange={(e) => aoDigitar(e.target.value)}
        disabled={ocupada}
        aria-invalid={!!erro}
        aria-describedby={erro ? `${id}-erro` : undefined}
      />
      <button type="button" className="btn-row btn-row-solid" onClick={aoSalvar} disabled={ocupada}>
        Salvar
      </button>
      <button type="button" className="btn-row btn-row-plain" onClick={aoCancelar} disabled={ocupada}>
        Cancelar
      </button>
    </div>
  );
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
 *
 * O que fica aqui é só o estado e as transições; os dois layouts e o diálogo de
 * confirmação são componentes próprios, para este não voltar a acumular todos os
 * ramos de uma vez.
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
  const [ocupada, setOcupada] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const botaoEditarRef = useRef<HTMLButtonElement>(null);
  // Ao sair da edição o foco volta para "Editar", mas só se a saída partiu daqui:
  // sem esta marca, uma linha qualquer roubaria o foco quando outra entrasse em
  // edição, porque `editando` muda em todas as linhas ao mesmo tempo.
  const saindoDaEdicao = useRef(false);

  const editId = `lista-edit-${entidade}-${item.id}`;

  // Entrar em edição troca o botão por um input: sem levar o foco junto, ele fica
  // no botão que acabou de sair do DOM e cai no <body>.
  useEffect(() => {
    if (editando) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (saindoDaEdicao.current) {
      saindoDaEdicao.current = false;
      botaoEditarRef.current?.focus();
    }
  }, [editando]);

  // Salvar e cancelar são as duas saídas da edição, e as duas precisam marcar a
  // ref antes de avisar o pai — estava escrito nos dois lugares.
  function sairDaEdicao() {
    saindoDaEdicao.current = true;
    aoCancelarEdicao();
  }

  function iniciar() {
    setDraft(item.nome);
    setErro('');
    aoIniciarEdicao(item.id);
  }

  function cancelar() {
    // Cancelar não pode deixar a linha vermelha.
    setErro('');
    sairDaEdicao();
  }

  async function salvar() {
    const invalido = validarNome(draft, item.id);
    if (invalido) {
      setErro(invalido);
      return;
    }
    setOcupada(true);
    try {
      aoAtualizado(await atualizarItem(item.id, draft.trim()));
      setErro('');
      sairDaEdicao();
    } catch (err) {
      setErro(mensagemErroNome(err));
    } finally {
      setOcupada(false);
    }
  }

  async function excluir() {
    // Fecha o diálogo antes de chamar a API: um 409 de item em uso vira mensagem
    // na linha, e o modal por cima esconderia justamente essa mensagem.
    setConfirmando(false);
    setOcupada(true);
    try {
      await excluirItem(item.id);
      aoExcluido(item.id);
      // Sem setOcupada(false): a linha é desmontada pelo pai ao sair da lista.
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 409 ? mensagemEmUso(item.nome, entidade) : mensagemGenerica(err),
      );
      setOcupada(false);
    }
  }

  return (
    <div
      className={`bg-surface-2 flex flex-col gap-2.25 rounded-[10px] border py-3.25 pr-3.5 pl-4 ${
        erro ? 'border-[rgba(255,106,74,0.4)]' : 'border-[rgba(255,255,255,0.05)]'
      }`}
    >
      {editando ? (
        <FormEdicao
          id={editId}
          inputRef={inputRef}
          valor={draft}
          erro={erro}
          ocupada={ocupada}
          aoDigitar={setDraft}
          aoSalvar={salvar}
          aoCancelar={cancelar}
        />
      ) : (
        <LinhaLeitura
          nome={item.nome}
          ocupada={ocupada}
          botaoEditarRef={botaoEditarRef}
          aoEditar={iniciar}
          aoExcluir={() => setConfirmando(true)}
        />
      )}

      {erro && (
        <p className="field-error" id={`${editId}-erro`} role="alert">
          {erro}
        </p>
      )}

      <ConfirmarExclusao
        aberto={confirmando}
        alvo={entidade === 'streaming' ? 'streaming' : 'categoria'}
        nome={item.nome}
        tituloId={`${editId}-confirmar`}
        aoConfirmar={excluir}
        aoFechar={() => setConfirmando(false)}
      />
    </div>
  );
}
