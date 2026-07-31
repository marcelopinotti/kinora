import { FormEvent, useState } from 'react';
import { ApiError, mensagemGenerica } from '../api';
import { useFetch } from '../hooks/useFetch';

export type Item = { id: number; nome: string };

type ListaSimplesProps = {
  titulo: string;
  subtitulo: string;
  placeholder: string;
  entidade: 'categoria' | 'streaming';
  fetchItens: () => Promise<Item[]>;
  criarItem: (nome: string) => Promise<Item>;
  atualizarItem: (id: number, nome: string) => Promise<Item>;
  excluirItem: (id: number) => Promise<void>;
};

function mensagemEmUso(nome: string, entidade: 'categoria' | 'streaming'): string {
  const alvo = entidade === 'streaming' ? 'este streaming' : 'esta categoria';
  return `Não foi possível excluir: ${nome} está em uso por filmes do catálogo. Remova ${alvo} dos filmes antes.`;
}

function mensagemErroNome(err: unknown): string {
  if (err instanceof ApiError && err.campos?.nome) return err.campos.nome;
  return mensagemGenerica(err);
}

/** Lista genérica reutilizada por Categorias e Streamings em /gerenciar. */
export function ListaSimples({
  titulo,
  subtitulo,
  placeholder,
  entidade,
  fetchItens,
  criarItem,
  atualizarItem,
  excluirItem,
}: ListaSimplesProps) {
  const [novo, setNovo] = useState('');
  const [erroNovo, setErroNovo] = useState('');
  const [criando, setCriando] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [rowErr, setRowErr] = useState<Record<number, string>>({});
  const [rowBusy, setRowBusy] = useState<Record<number, boolean>>({});

  // setItems continua exposto porque criar/renomear/excluir atualizam a lista no
  // cliente, sem refazer a busca.
  // Deps vazias: fetchItens é api.categorias/api.streamings, referência estável
  // de um objeto de módulo, então incluí-la só provocaria refetch a cada render.
  const { data: items, setData: setItems, erro: loadError } = useFetch<Item[]>(() => fetchItens(), []);

  function validarNome(nome: string, ignorarId?: number): string | null {
    const v = nome.trim();
    if (!v) return 'Informe um nome.';
    if (v.length > 100) return 'O nome deve ter no máximo 100 caracteres.';
    const lower = v.toLowerCase();
    if ((items ?? []).some((i) => i.id !== ignorarId && i.nome.toLowerCase() === lower)) {
      return 'Já existe um item com esse nome.';
    }
    return null;
  }

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    if (items === null) return;
    const erro = validarNome(novo);
    if (erro) {
      setErroNovo(erro);
      return;
    }
    setCriando(true);
    try {
      const criado = await criarItem(novo.trim());
      setItems((atual) => (atual ?? []).concat(criado));
      setNovo('');
      setErroNovo('');
    } catch (err) {
      setErroNovo(mensagemErroNome(err));
    } finally {
      setCriando(false);
    }
  }

  function iniciarEdicao(it: Item) {
    setEditingId(it.id);
    setDraft(it.nome);
    setRowErr((r) => ({ ...r, [it.id]: '' }));
  }

  function cancelarEdicao() {
    // Limpa também o erro da linha: cancelar não pode deixar a linha vermelha.
    if (editingId !== null) setRowErr((r) => ({ ...r, [editingId]: '' }));
    setEditingId(null);
  }

  async function salvarEdicao(it: Item) {
    const erro = validarNome(draft, it.id);
    if (erro) {
      setRowErr((r) => ({ ...r, [it.id]: erro }));
      return;
    }
    setRowBusy((b) => ({ ...b, [it.id]: true }));
    try {
      const atualizado = await atualizarItem(it.id, draft.trim());
      setItems((atual) => (atual ?? []).map((x) => (x.id === it.id ? atualizado : x)));
      setEditingId(null);
      setRowErr((r) => ({ ...r, [it.id]: '' }));
    } catch (err) {
      setRowErr((r) => ({ ...r, [it.id]: mensagemErroNome(err) }));
    } finally {
      setRowBusy((b) => ({ ...b, [it.id]: false }));
    }
  }

  async function excluir(it: Item) {
    setRowBusy((b) => ({ ...b, [it.id]: true }));
    try {
      await excluirItem(it.id);
      setItems((atual) => (atual ?? []).filter((x) => x.id !== it.id));
      // Descarta as entradas em vez de zerá-las: mantê-las faz os mapas crescerem
      // pela sessão inteira, e um item futuro que reutilize o id herdaria o estado.
      setRowErr(({ [it.id]: _descartado, ...resto }) => resto);
      setRowBusy(({ [it.id]: _descartado, ...resto }) => resto);
      return;
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 409 ? mensagemEmUso(it.nome, entidade) : mensagemGenerica(err);
      setRowErr((r) => ({ ...r, [it.id]: msg }));
      setRowBusy((b) => ({ ...b, [it.id]: false }));
    }
  }

  const n = items?.length ?? 0;
  const novoId = `lista-novo-${entidade}`;
  // Sem a lista carregada (carregando ou falha) a checagem de duplicado é no-op e
  // criar trocaria o estado de erro por uma lista de um item só.
  const criacaoBloqueada = items === null;

  return (
    <section className="bg-surface border-border flex flex-col gap-5 rounded-[14px] border px-[clamp(20px,4vw,30px)] pt-[clamp(22px,4vw,30px)] pb-[26px]">
      <div>
        <h2 className="text-2xl font-extrabold tracking-[-0.02em]">{titulo}</h2>
        <p className="text-t3 mt-1.5 text-sm">{subtitulo}</p>
      </div>

      <form className="flex min-w-0 flex-col gap-[7px]" onSubmit={handleCriar}>
        <div className="flex gap-2.5">
          <label className="sr-only" htmlFor={novoId}>
            {placeholder}
          </label>
          <input
            id={novoId}
            className={`input h-13 min-w-0 flex-1 text-[15px] ${erroNovo ? 'input-invalid' : ''}`.trim()}
            value={novo}
            maxLength={100}
            placeholder={placeholder}
            onChange={(e) => {
              setNovo(e.target.value);
              setErroNovo('');
            }}
            disabled={criando || criacaoBloqueada}
            aria-invalid={!!erroNovo}
            aria-describedby={erroNovo ? `${novoId}-erro` : undefined}
          />
          <button type="submit" className="btn btn-primary" disabled={criando || criacaoBloqueada}>
            Adicionar
          </button>
        </div>
        {erroNovo && (
          <p className="field-error" id={`${novoId}-erro`}>
            {erroNovo}
          </p>
        )}
      </form>

      <div className="flex flex-col gap-2">
        {items === null && !loadError && <p className="state-msg">Carregando...</p>}
        {loadError && <p className="state-msg state-error">{loadError}</p>}
        {items && items.length === 0 && <p className="state-msg">Nenhum item cadastrado.</p>}
        {items?.map((it) => {
          const editing = editingId === it.id;
          const erro = rowErr[it.id];
          const busy = !!rowBusy[it.id];
          const editId = `lista-edit-${entidade}-${it.id}`;
          return (
            <div
              key={it.id}
              className={`bg-surface-2 flex flex-col gap-[9px] rounded-[10px] border py-[13px] pr-3.5 pl-4 ${
                erro ? 'border-[rgba(255,106,74,0.4)]' : 'border-[rgba(255,255,255,0.05)]'
              }`}
            >
              {editing ? (
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
                  <button type="button" className="btn-row btn-row-solid" onClick={() => salvarEdicao(it)} disabled={busy}>
                    Salvar
                  </button>
                  <button type="button" className="btn-row btn-row-plain" onClick={cancelarEdicao} disabled={busy}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3.5">
                  <span className="min-w-[120px] flex-1 text-[15px] font-semibold text-[#eaeaef] [overflow-wrap:anywhere]">
                    {it.nome}
                  </span>
                  <span className="text-muted-2 font-mono text-[11px]">#{it.id}</span>
                  <div className="flex gap-2">
                    <button type="button" className="btn-row" onClick={() => iniciarEdicao(it)} disabled={busy}>
                      Editar
                    </button>
                    <button type="button" className="btn-row btn-row-danger" onClick={() => excluir(it)} disabled={busy}>
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
        })}
      </div>

      {/* Só depois de carregar: antes, "0 itens cadastrados" aparecia ao lado de
          "Carregando..." e da mensagem de falha, afirmando algo que não se sabe. */}
      {items !== null && (
        <p className="text-muted-2 text-xs font-bold tracking-[0.1em] uppercase">
          {n} {n === 1 ? 'item cadastrado' : 'itens cadastrados'}
        </p>
      )}
    </section>
  );
}
