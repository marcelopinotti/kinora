import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import type { Usuario } from '../api';

// Item do menu do avatar — 3 ocorrências com a mesma pinta.
const ITEM_MENU =
  'rounded-[7px] px-3 py-[9px] text-left text-sm font-semibold text-t1-soft hover:bg-[#22222a] hover:text-white';

/**
 * Avatar e menu da conta. Estava embutido na TopBar junto com marca, navegação e
 * busca — quatro responsabilidades num componente só, e o estado de aberto/fechado
 * mais os dois listeners globais só interessam a este pedaço.
 */
export function MenuConta({ user }: Readonly<{ user: Usuario }>) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setAberto(false);
      // Fechar por Escape devolve o foco ao avatar. Sem isto o foco fica num
      // elemento que acabou de sair do DOM e o teclado recomeça do topo da página.
      gatilhoRef.current?.focus();
    }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [aberto]);

  function sair() {
    setAberto(false);
    logout();
    navigate('/login');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        ref={gatilhoRef}
        className="bg-accent flex size-10 cursor-pointer items-center justify-center rounded-md border-0 text-[15px] font-extrabold text-white"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label="Menu da conta"
      >
        {user.nome.trim().charAt(0).toUpperCase() || '?'}
      </button>
      {aberto && (
        <div className="bg-menu shadow-menu absolute top-12.5 right-0 z-20 flex w-54 flex-col gap-0.5 rounded-xl border border-[rgba(255,255,255,0.1)] p-2">
          <div className="mb-1.5 border-border-2 border-b px-3 pt-2.5 pb-3">
            <p className="text-sm font-bold wrap-anywhere">{user.nome}</p>
            <span className="text-muted mt-0.75 block text-xs wrap-anywhere">{user.email}</span>
          </div>
          <Link to="/conta" className={ITEM_MENU} onClick={() => setAberto(false)}>
            Minha conta
          </Link>
          <Link to="/gerenciar" className={ITEM_MENU} onClick={() => setAberto(false)}>
            Gerenciar
          </Link>
          <Link to="/filme/novo" className={ITEM_MENU} onClick={() => setAberto(false)}>
            Cadastrar título
          </Link>
          <button
            type="button"
            className="text-error-soft mt-1 cursor-pointer rounded-[7px] border-0 border-border-2 border-t bg-transparent px-3 py-2.25 text-left text-sm font-bold hover:bg-accent-wash"
            onClick={sair}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
