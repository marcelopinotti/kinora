import { useEffect, useState } from 'react';
import { api, mensagemGenerica, type FilmeResponse } from '../../api';
import { CAMPOS_VAZIOS, type CamposFilme } from './validarFilme';
import * as React from "react";

/**
 * Resposta da API → campos do formulário: nulo vira string vazia e a nota troca
 * o ponto pela vírgula, que é o separador que o input mostra e valida.
 */
function camposDe(f: FilmeResponse): CamposFilme {
  return {
    titulo: f.titulo,
    descricao: f.descricao ?? '',
    dataLancamento: f.dataLancamento ?? '',
    nota: String(f.nota).replace('.', ','),
    tipo: f.tipo,
    posterUrl: f.posterUrl ?? '',
    categorias: f.categorias.map((c) => c.id),
    streamings: f.streamings.map((s) => s.id),
  };
}

/**
 * Devolve o erro em vez de lançar: quem chama é um efeito, que assim tem um
 * único ponto de saída em vez de then/catch/finally com três guardas iguais.
 */
async function carregarCampos(id: string): Promise<{ campos?: CamposFilme; erro?: string }> {
  const idNum = Number(id);
  // /filme/abc/editar virava GET /api/filme/NaN, devolvendo o erro genérico
  // em vez de "não encontrado".
  if (!Number.isInteger(idNum) || idNum <= 0) return { erro: 'Título não encontrado.' };

  try {
    return { campos: camposDe(await api.filme(idNum)) };
  } catch (err) {
    return { erro: mensagemGenerica(err) };
  }
}

type Resultado = {
  campos: CamposFilme;
  setCampos: React.Dispatch<React.SetStateAction<CamposFilme>>;
  carregando: boolean;
  erro: string;
};

/**
 * Estado dos campos do formulário, já semeado com o título quando em modo de
 * edição. Não usa o useFetch genérico porque aqui o resultado não é dado para
 * exibir: vira o estado editável da tela, e o componente precisa continuar dono
 * do setCampos.
 *
 * Tirar isto do FilmeForm foi o que mais derrubou a complexidade da tela — só
 * este efeito respondia por um terço dos pontos de decisão do componente.
 */
export function useCamposFilme(id: string | undefined, modo: 'novo' | 'editar'): Resultado {
  const [campos, setCampos] = useState<CamposFilme>(CAMPOS_VAZIOS);
  const [carregando, setCarregando] = useState(modo === 'editar');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (modo !== 'editar' || !id) return;

    let cancelled = false;
    setCarregando(true);
    // Sem este reset, ir direto de uma URL de edição para outra (mesmo <Route>,
    // sem remontar) mantém a tela de erro anterior mesmo com o carregamento novo
    // bem-sucedido.
    setErro('');

    void carregarCampos(id).then(({ campos, erro }) => {
      if (cancelled) return;
      if (campos) setCampos(campos);
      setErro(erro ?? '');
      setCarregando(false);
    });

    return () => {
      cancelled = true;
    };
  }, [modo, id]);

  return { campos, setCampos, carregando, erro };
}
