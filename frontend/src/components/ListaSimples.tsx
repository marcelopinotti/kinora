import { FormEvent, useState } from 'react';
import { ApiError, mensagemGenerica } from '../api';
import { useFetch } from '../hooks/useFetch';
import { ItemRow } from './ItemRow';

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

function mensagemErroNome(err: unknown): string {
  if (err instanceof ApiError && err.campos?.nome) return err.campos.nome;
  return mensagemGenerica(err);
}

/**
 * Lista genérica reutilizada por Categorias e Streamings em /gerenciar.
 *
 * Cuida da lista e do formulário de criação; o estado de cada linha (rascunho,
 * erro, ocupada) vive no ItemRow. `editingId` fica aqui de propósito, para
 * continuar valendo a regra de uma linha em edição por vez.
 */
export function ListaSimples({
  titulo,
  subtitulo,
  placeholder,
  entidade,
  fetchItens,
  criarItem,
  atualizarItem,
  excluirItem,
}: Readonly<ListaSimplesProps>) {
  const [novo, setNovo] = useState('');
  const [erroNovo, setErroNovo] = useState('');
  const [criando, setCriando] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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
    if (items === null || criando) return;
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
        {items?.map((it) => (
          <ItemRow
            key={it.id}
            item={it}
            entidade={entidade}
            editando={editingId === it.id}
            aoIniciarEdicao={setEditingId}
            aoCancelarEdicao={() => setEditingId(null)}
            validarNome={validarNome}
            atualizarItem={atualizarItem}
            excluirItem={excluirItem}
            aoAtualizado={(atualizado) =>
              setItems((atual) => (atual ?? []).map((x) => (x.id === atualizado.id ? atualizado : x)))
            }
            aoExcluido={(id) => setItems((atual) => (atual ?? []).filter((x) => x.id !== id))}
          />
        ))}
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
