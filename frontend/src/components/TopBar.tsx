import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { Logo } from './Logo';

type Active = 'catalog' | 'filmes' | 'series' | 'add' | 'edit' | 'gerenciar' | 'conta' | null;

// As três rotas de catálogo são irmãs: cada uma acende só o próprio link.
const ROTAS_CATALOGO = ['/', '/filmes', '/series'];

// Item do menu do avatar — 4 ocorrências com a mesma pinta.
const ITEM_MENU = 'rounded-[7px] px-3 py-[9px] text-left text-sm font-semibold text-[#d8d8dd] hover:bg-[#22222a] hover:text-white';

function linkNav(ativo: boolean): string {
  return `transition-colors hover:text-white ${ativo ? 'font-bold text-white' : 'text-t4'}`;
}

function getActive(pathname: string): Active {
  if (pathname === '/') return 'catalog';
  if (pathname === '/filmes') return 'filmes';
  if (pathname === '/series') return 'series';
  if (pathname === '/filme/novo') return 'add';
  if (/^\/filme\/[^/]+\/editar$/.test(pathname)) return 'edit';
  if (pathname === '/gerenciar') return 'gerenciar';
  if (pathname === '/conta') return 'conta';
  return null;
}

export function TopBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  // Semeada pela URL: recarregar /?q=matrix tem que mostrar "matrix" na busca,
  // senão o catálogo aparece filtrado por um termo invisível.
  //
  // A ressincronização não é enfeite. A TopBar vive na rota de layout e não
  // remonta ao trocar de rota, então semear só na montagem deixava a caixa
  // exibindo o termo anterior enquanto o catálogo já mostrava a lista sem filtro
  // — input e resultado se contradizendo.
  //
  // Ajuste durante o render (padrão do React para estado derivado de prop), e não
  // useEffect: evita o render extra com o valor velho já pintado na tela.
  const qUrl = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(qUrl);
  const [qAnterior, setQAnterior] = useState(qUrl);
  if (qAnterior !== qUrl) {
    setQAnterior(qUrl);
    setQuery(qUrl);
  }
  const menuRef = useRef<HTMLDivElement>(null);

  const active = getActive(location.pathname);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [menuOpen]);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    // Buscar dentro de /filmes ou /series não pode jogar o usuário de volta no
    // catálogo inteiro; de qualquer outra tela a busca cai em "/".
    const destino = ROTAS_CATALOGO.includes(location.pathname) ? location.pathname : '/';
    // Busca vazia leva à rota limpa em vez de empurrar "?q=" para o histórico.
    const termo = query.trim();
    navigate(termo ? `${destino}?q=${encodeURIComponent(termo)}` : destino);
  }

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/login');
  }

  return (
    <div className="sticky top-0 z-[8] flex flex-wrap items-center gap-[clamp(14px,2vw,26px)] bg-linear-to-b from-[#0b0b0e] from-62% to-[rgba(11,11,14,0)] px-pad py-5">
      <Link to="/" className="flex items-center gap-2">
        <Logo />
      </Link>

      {/* Abaixo de 900px os links saem; os funcionais vivem no menu do avatar. */}
      <nav className="flex min-w-0 flex-wrap items-center gap-[22px] text-[15px] max-[900px]:hidden">
        <Link to="/" className={linkNav(active === 'catalog')}>
          Início
        </Link>
        <Link to="/filmes" className={linkNav(active === 'filmes')}>
          Filmes
        </Link>
        <Link to="/series" className={linkNav(active === 'series')}>
          Séries
        </Link>
        {user && (
          <>
            <span className="bg-border-3 h-4 w-px flex-none" />
            <Link to="/filme/novo" className={linkNav(active === 'add' || active === 'edit')}>
              Cadastrar título
            </Link>
            <Link to="/gerenciar" className={linkNav(active === 'gerenciar')}>
              Gerenciar
            </Link>
          </>
        )}
      </nav>

      <div className="min-w-3 flex-1 max-[520px]:hidden" />

      <form
        className="bg-surface-2 focus-within:border-accent flex h-11 max-w-[340px] min-w-[140px] flex-1 items-center gap-3 rounded-lg border border-[rgba(255,255,255,0.07)] px-4 max-[520px]:order-3 max-[520px]:max-w-none max-[520px]:basis-full"
        role="search"
        onSubmit={submitSearch}
      >
        <i className="border-muted size-[13px] flex-none rounded-full border-2" aria-hidden="true" />
        <label className="sr-only" htmlFor="topbar-busca">
          Buscar títulos, gêneros, pessoas
        </label>
        <input
          id="topbar-busca"
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white outline-none"
          placeholder="Buscar títulos, gêneros, pessoas"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {user ? (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="bg-accent flex size-10 cursor-pointer items-center justify-center rounded-md border-0 text-[15px] font-extrabold text-white"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label="Menu da conta"
          >
            {user.nome.trim().charAt(0).toUpperCase() || '?'}
          </button>
          {menuOpen && (
            <div className="bg-menu shadow-menu absolute top-[50px] right-0 z-20 flex w-[216px] flex-col gap-0.5 rounded-xl border border-[rgba(255,255,255,0.1)] p-2">
              <div className="mb-1.5 border-b border-[rgba(255,255,255,0.07)] px-3 pt-2.5 pb-3">
                <p className="text-sm font-bold [overflow-wrap:anywhere]">{user.nome}</p>
                <span className="text-muted mt-[3px] block text-xs [overflow-wrap:anywhere]">{user.email}</span>
              </div>
              <Link to="/conta" className={ITEM_MENU} onClick={() => setMenuOpen(false)}>
                Minha conta
              </Link>
              <Link to="/gerenciar" className={ITEM_MENU} onClick={() => setMenuOpen(false)}>
                Gerenciar
              </Link>
              <Link to="/filme/novo" className={ITEM_MENU} onClick={() => setMenuOpen(false)}>
                Cadastrar título
              </Link>
              <button
                type="button"
                className="text-error-soft mt-1 cursor-pointer rounded-[7px] border-0 border-t border-[rgba(255,255,255,0.07)] bg-transparent px-3 py-[9px] text-left text-sm font-bold hover:bg-[rgba(232,80,42,0.12)]"
                onClick={handleLogout}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <Link to="/login" className="btn btn-outline btn-sm">
            Entrar
          </Link>
          <Link to="/cadastro" className="btn btn-primary btn-sm">
            Criar conta
          </Link>
        </div>
      )}
    </div>
  );
}
