import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, useAuth } from './auth';
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
  if (status === 'loading') return null;

  return (
    <Routes>
      {/* Mesma página do catálogo três vezes: o tipo vem da rota, não do estado. */}
      <Route path="/" element={<Catalogo />} />
      <Route path="/filmes" element={<Catalogo tipo="FILME" />} />
      <Route path="/series" element={<Catalogo tipo="SERIE" />} />
      <Route path="/titulo/:id" element={<Detalhe />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route
        path="/filme/novo"
        element={
          <RequireAuth>
            <FilmeForm />
          </RequireAuth>
        }
      />
      <Route
        path="/filme/:id/editar"
        element={
          <RequireAuth>
            <FilmeForm />
          </RequireAuth>
        }
      />
      <Route
        path="/gerenciar"
        element={
          <RequireAuth>
            <Gerenciar />
          </RequireAuth>
        }
      />
      <Route
        path="/conta"
        element={
          <RequireAuth>
            <Conta />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
