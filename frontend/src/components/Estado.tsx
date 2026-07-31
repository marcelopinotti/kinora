import type { ReactNode } from 'react';

type EstadoProps = {
  carregando: boolean;
  erro?: string;
  /** Quando true e sem erro nem carregamento, mostra `mensagemVazio` no lugar do conteúdo. */
  vazio?: boolean;
  mensagemCarregando?: string;
  mensagemVazio?: string;
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
  children,
}: Readonly<EstadoProps>) {
  if (erro) return <p className="state-msg state-error">{erro}</p>;
  if (carregando) return <p className="state-msg">{mensagemCarregando}</p>;
  if (vazio && mensagemVazio) return <p className="state-msg">{mensagemVazio}</p>;
  return <>{children}</>;
}
