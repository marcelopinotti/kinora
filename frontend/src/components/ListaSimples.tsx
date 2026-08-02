import { useMemo, useState } from 'react';
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
  const [alfabetica, setAlfabetica] = useState(false);

  // setItems continua exposto porque criar/renomear/excluir atualizam a lista no
  // cliente, sem refazer a busca.
  // Deps vazias: fetchItens é api.categorias/api.streamings, referência estável
  // de um objeto de módulo, então incluí-la só provocaria refetch a cada render.
  const { data: items, setData: setItems, erro: loadError } = useFetch<Item[]>(() => fetchItens(), []);

  const n = items?.length ?? 0;

  // sort() muta o array, e `items` é o estado do useFetch — daí a cópia.
  // localeCompare com pt-BR para acento não jogar "Ação" e "Ficção" para o fim,
  // que é o que a comparação bruta de code points faria.
  const visiveis = useMemo(
    () => (alfabetica && items ? [...items].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) : items),
    [items, alfabetica],
  );

  // Handlers nomeados em vez de arrows dentro do JSX: era o aninhamento do map
  // com o updater de setItems que empilhava cinco níveis de função.
  const validarNome = (nome: string, ignorarId?: number) => validarNomeEm(items ?? [], nome, ignorarId);
  const aoCriado = (criado: Item) => setItems((atual) => (atual ?? []).concat(criado));
  const aoAtualizado = (item: Item) => setItems((atual) => (atual ?? []).map((x) => (x.id === item.id ? item : x)));
  const aoExcluido = (id: number) => setItems((atual) => (atual ?? []).filter((x) => x.id !== id));

  return (
    <section className="surface flex flex-col gap-5 px-[clamp(20px,4vw,30px)] pt-[clamp(22px,4vw,30px)] pb-6.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-[-0.02em]">{titulo}</h2>
          <p className="text-t3 mt-1.5 text-sm">{subtitulo}</p>
        </div>
        {/* aria-pressed e não dois rótulos: o botão é um alternador, e o estado
            ligado/desligado é o que o leitor de tela precisa anunciar. */}
        <button
          type="button"
          className={`btn-row ${alfabetica ? 'border-accent text-white' : ''}`.trim()}
          aria-pressed={alfabetica}
          onClick={() => setAlfabetica((v) => !v)}
          disabled={items === null}
        >
          Ordenar A–Z
        </button>
      </div>

      <FormNovoItem
        placeholder={placeholder}
        entidade={entidade}
        bloqueado={items === null}
        validarNome={validarNome}
        criarItem={criarItem}
        aoCriado={aoCriado}
      />

      <div className="flex flex-col gap-2">
        <Estado
          carregando={items === null}
          erro={loadError}
          vazio={items?.length === 0}
          mensagemVazio="Nenhum item cadastrado."
          classNameMensagem=""
        >
          {visiveis?.map((it) => (
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
              aoAtualizado={aoAtualizado}
              aoExcluido={aoExcluido}
            />
          ))}
        </Estado>
      </div>

      {/* Só depois de carregar: antes, "0 itens cadastrados" aparecia ao lado de
          "Carregando..." e da mensagem de falha, afirmando algo que não se sabe. */}
      {items !== null && (
        <p className="text-muted-2 text-xs font-bold tracking-widest uppercase">
          {n} {n === 1 ? 'item cadastrado' : 'itens cadastrados'}
        </p>
      )}
    </section>
  );
}
