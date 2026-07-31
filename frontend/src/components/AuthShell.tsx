import { ReactNode } from 'react';
import { Logo } from './Logo';

// Fundo + card das telas de auth, idênticos em Login e Cadastro. Existia
// duplicado nos dois arquivos; em utilitário seriam ~9 strings longas repetidas.
// As camadas do fundo (.auth-*) ficam no CSS: são gradientes e faixas rotacionadas.
export function AuthShell({ titulo, sub, children }: { titulo: string; sub?: string; children: ReactNode }) {
  return (
    <div className="bg-bg relative min-h-screen overflow-hidden">
      <div className="auth-bg">
        <div className="auth-halo-a" />
        <div className="auth-halo-b" />
        <div className="auth-hatch" />
        <div className="auth-strips">
          {Array.from({ length: 7 }).map((_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className="auth-vignette" />
      </div>
      {/* handoff: padding 40px 56px 56px — o pad-x global é 48px, aqui é 56px */}
      <div className="relative z-[2] flex min-h-screen flex-col px-[clamp(16px,5vw,56px)] pt-[clamp(24px,4vw,40px)] pb-[clamp(32px,5vw,56px)]">
        <div className="flex items-center gap-[11px]">
          <Logo size="lg" />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="shadow-card w-[600px] max-w-full rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[rgba(14,14,17,0.72)] px-[clamp(22px,7vw,72px)] pt-[clamp(32px,6vw,56px)] pb-[clamp(36px,6vw,60px)] backdrop-blur-[18px]">
            <h1 className="mb-2 text-center text-[clamp(28px,6vw,40px)] font-extrabold tracking-[-0.02em]">{titulo}</h1>
            {/* Login não tem subtítulo: lá o respiro do H1 até os campos é 36px
                (8px do H1 + 28px daqui), sem precisar de classe por tela. */}
            {sub ? <p className="text-t3 mb-9 text-center text-[15px]">{sub}</p> : null}
            <div className={sub ? '' : 'mt-7'}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
