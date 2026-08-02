import { api, type FilmeRequest } from '../../api';
import type { CamposFilme } from './validarFilme';

/**
 * Monta o corpo e escolhe entre criar e atualizar.
 *
 * Fora do componente porque é tradução de dados, não interação: o formulário
 * guarda strings do que foi digitado, a API quer número em `nota` e campos já
 * aparados.
 */
export async function salvarFilme(modo: 'novo' | 'editar', id: string | undefined, campos: CamposFilme): Promise<void> {
  const body: FilmeRequest = {
    titulo: campos.titulo.trim(),
    descricao: campos.descricao.trim(),
    dataLancamento: campos.dataLancamento.trim(),
    nota: Number(campos.nota.trim().replace(',', '.')),
    tipo: campos.tipo,
    posterUrl: campos.posterUrl.trim(),
    categorias: campos.categorias,
    streamings: campos.streamings,
  };

  if (modo === 'editar' && id) {
    await api.atualizarFilme(Number(id), body);
    return;
  }
  await api.criarFilme(body);
}
