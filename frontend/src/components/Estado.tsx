import type { ReactNode } from 'react';

type EstadoProps = {
  carregando: boolean;
  erro?: string;
  /** Quando true e sem erro nem carregamento, mostra `mensagemVazio` no lugar do conteúdo. */
  vazio?: boolean;
  mensagemCarregando?: string;
  mensagemVazio?: string;
  /**
   * Calha lateral da mensagem. `px-pad` (padrão) alinha com o resto da página;
   * dentro de um card, que já tem padding próprio, precisa ser '' — senão o texto
   * fica deslocado até 48px do conteúdo vizinho.
   */
  classNameMensagem?: string;
  children: ReactNode;
};

/**
 * Erro, carregando, vazio ou conteúdo — nesta ordem, exclusivos entre si.
 *
 * Substitui a cadeia de `&&` que cada tela reescrevia à mão. No catálogo eram
 * quatro linhas reavaliando `!erro` em todas elas: um if/else-if fantasiado, com
 * nove condições onde bastam quatro estados.
 */
export function Estado({
  carregando,
  erro,
  vazio,
  mensagemCarregando = 'Carregando...',
  mensagemVazio,
  classNameMensagem = 'px-pad',
  children,
}: Readonly<EstadoProps>) {
  const classe = `state-msg ${classNameMensagem}`.trim();

  // role="alert" só no erro: falha de carga precisa ser anunciada, "Carregando..."
  // e "nenhum resultado" não — seriam interrupções a cada troca de filtro.
  if (erro) {
    return (
      <p className={`${classe} state-error`} role="alert">
        {erro}
      </p>
    );
  }
  if (carregando) return <p className={classe}>{mensagemCarregando}</p>;
  if (vazio && mensagemVazio) return <p className={classe}>{mensagemVazio}</p>;
  return <>{children}</>;
}
