import { useEffect, useState, type DependencyList } from 'react';
import { mensagemGenerica } from '../api';

type Resultado<T> = {
  data: T | null;
  /** Para telas que mutam a lista localmente após criar/renomear/excluir. */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  erro: string;
  carregando: boolean;
};

/**
 * O trio "buscar / cancelar no unmount / traduzir o erro" estava escrito à mão em
 * cinco lugares, com quatro variações — um deles sem cancel flag e outro sem zerar
 * o erro anterior ao refazer a busca, o que prendia a tela de erro do FilmeForm.
 *
 * `aoErrar` existe porque algumas telas têm mensagem própria para certos status
 * (o Detalhe distingue 404 de falha genérica).
 */
export function useFetch<T>(
  buscar: () => Promise<T>,
  deps: DependencyList,
  aoErrar: (err: unknown) => string = mensagemGenerica,
): Resultado<T> {
  const [data, setData] = useState<T | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Zerar os três é o que impede estado da busca anterior sobreviver a uma nova.
    setData(null);
    setErro('');
    setCarregando(true);

    buscar()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setErro(aoErrar(err));
      })
      .finally(() => {
        if (!cancelled) setCarregando(false);
      });

    return () => {
      cancelled = true;
    };
    // As deps são responsabilidade de quem chama: `buscar` e `aoErrar` são closures
    // novas a cada render e entrariam em laço infinito se fossem incluídas aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, erro, carregando };
}
