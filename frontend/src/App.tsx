import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { RequireAuth, useAuth } from './auth';
import { Layout } from './components/Layout';
import { Cadastro } from './pages/Cadastro';
import { Catalogo } from './pages/Catalogo';
import { Conta } from './pages/Conta';
import { Detalhe } from './pages/Detalhe';
import { FilmeForm } from './pages/FilmeForm';
import { Gerenciar } from './pages/Gerenciar';
import { Login } from './pages/Login';

export function App() {
  const { status } = useAuth();

  // Enquanto valida o token (GET /api/auth/me), não renderiza nada: a TopBar
  // não pode piscar como "visitante" antes de saber se há sessão válida.
  // Chaves e indentação alinhada não são estilo: sem elas o `return` abaixo
  // aparenta pertencer ao if, e basta alguém inserir um statement no meio para
  // que a aparência vire comportamento.
  if (status === 'loading') {
    return null;
  }

  return (
    <Routes>
      {/* Rota de layout: TopBar e moldura ficam aqui, não repetidas em cada página. */}
      <Route element={<Layout />}>
        {/* Mesma página do catálogo três vezes: o tipo vem da rota, não do estado. */}
        <Route path="/" element={<Catalogo />} />
        <Route path="/filmes" element={<Catalogo tipo="FILME" />} />
        <Route path="/series" element={<Catalogo tipo="SERIE" />} />
        <Route path="/titulo/:id" element={<Detalhe />} />

        {/* Um RequireAuth para o grupo, em vez de um por rota. */}
        <Route
          element={
            <RequireAuth>
              <Outlet />
            </RequireAuth>
          }
        >
          <Route path="/filme/novo" element={<FilmeForm />} />
          <Route path="/filme/:id/editar" element={<FilmeForm />} />
          <Route path="/gerenciar" element={<Gerenciar />} />
          <Route path="/conta" element={<Conta />} />
        </Route>
      </Route>

      {/* Fora do layout: o AuthShell é a moldura destas duas, sem TopBar. */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
