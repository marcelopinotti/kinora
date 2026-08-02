import type { Tipo } from '../../api';

export const URL_HTTP = /^https?:\/\//i;

export type CamposFilme = {
  titulo: string;
  descricao: string;
  dataLancamento: string;
  nota: string;
  tipo: Tipo;
  posterUrl: string;
  categorias: number[];
  streamings: number[];
};

export const CAMPOS_VAZIOS: CamposFilme = {
  titulo: '',
  descricao: '',
  dataLancamento: '',
  nota: '',
  tipo: 'FILME',
  posterUrl: '',
  categorias: [],
  streamings: [],
};

export function maskData(raw: string): string {
  const digitos = raw.replace(/\D/g, '').slice(0, 8);
  return [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)].filter(Boolean).join('/');
}

export function dataValida(v: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return false;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  const d = new Date(ano, mes - 1, dia);
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
}

/**
 * Fora do componente e sem estado: era um método de 20 linhas com 15 pontos de
 * decisão dentro do FilmeForm, respondendo sozinho por boa parte da complexidade
 * da tela. Aqui é uma função pura — recebe os campos, devolve os erros.
 */
export function validarFilme(campos: CamposFilme): Record<string, string> {
  const erros: Record<string, string> = {};

  if (!campos.titulo.trim()) erros.titulo = 'O título é obrigatório.';
  if (!campos.descricao.trim()) erros.descricao = 'A descrição é obrigatória.';

  const data = campos.dataLancamento.trim();
  if (!data) erros.dataLancamento = 'A data de lançamento é obrigatória.';
  else if (!dataValida(data)) erros.dataLancamento = 'Use o formato dd/mm/aaaa.';

  const nota = campos.nota.trim();
  if (!nota) {
    erros.nota = 'A nota é obrigatória.';
  } else {
    const n = Number(nota.replace(',', '.'));
    if (Number.isNaN(n) || n < 0 || n > 10) erros.nota = 'A nota deve ser um número entre 0 e 10.';
  }

  // Pôster é opcional: vazio passa. Formato da imagem em si não se valida aqui
  // — quem reprova é o onError do preview.
  const poster = campos.posterUrl.trim();
  if (poster && !URL_HTTP.test(poster)) erros.posterUrl = 'Informe uma URL que comece com http:// ou https://.';
  else if (poster.length > 500) erros.posterUrl = 'A URL deve ter no máximo 500 caracteres.';

  if (campos.categorias.length === 0) erros.categorias = 'Selecione ao menos uma categoria.';
  if (campos.streamings.length === 0) erros.streamings = 'Selecione ao menos um streaming.';

  return erros;
}
