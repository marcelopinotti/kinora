import { api, type Categoria, type Streaming } from '../../api';
import { useFetch } from '../../hooks/useFetch';

/**
 * Categorias e streamings disponíveis para seleção.
 *
 * Sem as duas o formulário é insubmissível (validarFilme exige uma de cada), então
 * a falha precisa aparecer e travar o envio, não passar em silêncio.
 */
export function useListasDoFormulario(): { categorias: Categoria[]; streamings: Streaming[]; erro: string } {
  const { data, erro } = useFetch<[Categoria[], Streaming[]]>(
    () => Promise.all([api.categorias(), api.streamings()]),
    [],
    () => 'Não foi possível carregar as categorias e os streamings. Recarregue a página.',
  );

  const [categorias = [], streamings = []] = data ?? [];
  return { categorias, streamings, erro };
}
