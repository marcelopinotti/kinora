import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Estado } from './Estado';
import { FormNovoItem } from './FormNovoItem';
import { ItemRow } from './ItemRow';

export type Item = { id: number; nome: string };

/**
 * Nome válido e ainda não usado. Pura e fora do componente: depende só da lista
 * atual e do texto, não de nada do React.
 */
function validarNomeEm(items: readonly Item[], nome: string, ignorarId?: number): string | null {
  const v = nome.trim();
  if (!v) return 'Informe um nome.';
  if (v.length > 100) return 'O nome deve ter no máximo 100 caracteres.';
  const lower = v.toLowerCase();
  const repetido = items.some((i) => i.id !== ignorarId && i.nome.toLowerCase() === lower);
  return repetido ? 'Já existe um item com esse nome.' : null;
}

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

/**
 * Lista genérica reutilizada por Categorias e Streamings em /gerenciar.
 *
 * Guarda só a lista e a regra de nome duplicado, que é a única coisa que depende
 * de enxergar todos os itens. Criação vive no FormNovoItem e o estado de cada
 * linha no ItemRow; `editingId` fica aqui para valer a regra de uma linha em
 * edição por vez.
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
  const [editingId, setEditingId] = useState<number | null>(null);

  // setItems continua exposto porque criar/renomear/excluir atualizam a lista no
  // cliente, sem refazer a busca.
  // Deps vazias: fetchItens é api.categorias/api.streamings, referência estável
  // de um objeto de módulo, então incluí-la só provocaria refetch a cada render.
  const { data: items, setData: setItems, erro: loadError } = useFetch<Item[]>(() => fetchItens(), []);

  const n = items?.length ?? 0;

  return (
    <section className="bg-surface border-border flex flex-col gap-5 rounded-[14px] border px-[clamp(20px,4vw,30px)] pt-[clamp(22px,4vw,30px)] pb-[26px]">
      <div>
        <h2 className="text-2xl font-extrabold tracking-[-0.02em]">{titulo}</h2>
        <p className="text-t3 mt-1.5 text-sm">{subtitulo}</p>
      </div>

      <FormNovoItem
        placeholder={placeholder}
        entidade={entidade}
        bloqueado={items === null}
        validarNome={(nome) => validarNomeEm(items ?? [], nome)}
        criarItem={criarItem}
        aoCriado={(criado) => setItems((atual) => (atual ?? []).concat(criado))}
      />

      <div className="flex flex-col gap-2">
        <Estado
          carregando={items === null}
          erro={loadError}
          vazio={items?.length === 0}
          mensagemVazio="Nenhum item cadastrado."
        >
          {items?.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              entidade={entidade}
              editando={editingId === it.id}
              aoIniciarEdicao={setEditingId}
              aoCancelarEdicao={() => setEditingId(null)}
              validarNome={(nome, ignorarId) => validarNomeEm(items ?? [], nome, ignorarId)}
              atualizarItem={atualizarItem}
              excluirItem={excluirItem}
              aoAtualizado={(atualizado) =>
                setItems((atual) => (atual ?? []).map((x) => (x.id === atualizado.id ? atualizado : x)))
              }
              aoExcluido={(id) => setItems((atual) => (atual ?? []).filter((x) => x.id !== id))}
            />
          ))}
        </Estado>
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
