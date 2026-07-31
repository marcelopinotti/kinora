import { useEffect, type RefObject } from 'react';

/**
 * Leva o foco ao primeiro campo inválido sempre que os erros mudam.
 *
 * Sem isto, recusar o formulário deixava o foco onde estava — normalmente no
 * botão de enviar, no fim da página. Quem usa teclado tinha que percorrer o
 * formulário de novo para descobrir qual campo falhou, e quem usa leitor de tela
 * não recebia nem indicação de que algo havia falhado.
 *
 * Procura por `[aria-invalid="true"]` em vez de casar nome de campo com id: os
 * ids não seguem o mesmo padrão das chaves de erro (`senhaAtual` vira
 * `conta-senha-atual`), e o atributo já está lá porque o Field o define.
 */
export function useFocoNoErro(erros: Record<string, string>, formRef: RefObject<HTMLFormElement | null>): void {
  useEffect(() => {
    // Erro sem campo (`geral`, falha de rede) não tem para onde levar o foco.
    const temCampo = Object.keys(erros).some((k) => k !== 'geral');
    if (!temCampo) return;

    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [erros, formRef]);
}
