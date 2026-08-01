import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { MenuConta } from './MenuConta';
import { Logo } from './Logo';

type Active = 'catalog' | 'filmes' | 'series' | 'add' | 'edit' | 'gerenciar' | 'conta' | null;

// As três rotas de catálogo são irmãs: cada uma acende só o próprio link.
const ROTAS_CATALOGO = new Set(['/', '/filmes', '/series']);


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
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const active = getActive(location.pathname);


  function submitSearch(e: FormEvent) {
    e.preventDefault();
    // Buscar dentro de /filmes ou /series não pode jogar o usuário de volta no
    // catálogo inteiro; de qualquer outra tela a busca cai em "/".
    const destino = ROTAS_CATALOGO.has(location.pathname) ? location.pathname : '/';
    // Busca vazia leva à rota limpa em vez de empurrar "?q=" para o histórico.
    const termo = query.trim();
    navigate(termo ? `${destino}?q=${encodeURIComponent(termo)}` : destino);
  }


  return (
    <div className="sticky top-0 z-8 flex flex-wrap items-center gap-[clamp(14px,2vw,26px)] bg-linear-to-b from-[#0b0b0e] from-62% to-[rgba(11,11,14,0)] px-pad py-5">
      <Link to="/" className="flex items-center gap-2">
        <Logo />
      </Link>

      {/* Início/Filmes/Séries não escondem em largura nenhuma: o menu do avatar só
          existe para quem está logado E não lista as rotas de catálogo, então
          escondê-las abaixo de 900px deixava o catálogo inalcançável no celular —
          para visitante e para usuário logado. Escondidos ficam só Cadastrar e
          Gerenciar, que o menu de fato oferece. */}
      <nav className="flex min-w-0 flex-wrap items-center gap-5.5 text-[15px] max-[520px]:gap-4">
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
          <span className="flex items-center gap-5.5 max-[900px]:hidden">
            <span className="bg-border-3 h-4 w-px flex-none" />
            <Link to="/filme/novo" className={linkNav(active === 'add' || active === 'edit')}>
              Cadastrar título
            </Link>
            <Link to="/gerenciar" className={linkNav(active === 'gerenciar')}>
              Gerenciar
            </Link>
          </span>
        )}
      </nav>

      <div className="min-w-3 flex-1 max-[520px]:hidden" />

      <form
        className="bg-surface-2 focus-within:border-accent flex h-11 max-w-85 min-w-35 flex-1 items-center gap-3 rounded-lg border px-4 max-[520px]:order-3 max-[520px]:max-w-none max-[520px]:basis-full"
        role="search"
        onSubmit={submitSearch}
      >
        <i className="border-muted size-3.25 flex-none rounded-full border-2" aria-hidden="true" />
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
        <MenuConta user={user} />
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
