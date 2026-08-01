import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ApiError, api, getToken, setSessionExpiredHandler, setToken, type Usuario } from './api';

type AuthStatus = 'loading' | 'ready';

type AuthContextValue = {
  user: Usuario | null;
  status: AuthStatus;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  refreshUser: (user: Usuario) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Restaura a sessão a partir do token guardado. Devolve null quando não há
// sessão a restaurar — sem token, token rejeitado ou falha na consulta.
async function restaurarSessao(): Promise<Usuario | null> {
  if (!getToken()) return null;

  try {
    return await api.me();
  } catch (err) {
    // Só descarta o token quando o backend de fato o rejeitou. Erro de rede,
    // proxy fora do ar ou 500 não invalidam sessão nenhuma.
    //
    // 404 saiu desta lista: em /api/auth/me ele quase sempre significa proxy
    // mal configurado, não token inválido, e destruir a credencial por causa
    // disso obriga o usuário a logar de novo por um problema de infra. Conta
    // apagada de fato cai no mesmo caminho, mas aí o token já não vale no
    // servidor — mantê-lo no cliente não concede acesso nenhum.
    if (err instanceof ApiError && err.status === 401) setToken(null);
    return null;
  }
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<Usuario | null>(null);
  // Um login bem-sucedido torna a checagem de montagem obsoleta: a resposta
  // atrasada do /me do token antigo não pode derrubar a sessão recém-criada.
  const meObsoleto = useRef(false);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('ready');
    });

    void restaurarSessao().then((u) => {
      if (meObsoleto.current) return;
      setUser(u);
      setStatus('ready');
    });

    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const res = await api.login({ email, senha });
    meObsoleto.current = true;
    setToken(res.token);
    setUser(res.usuario);
    setStatus('ready');
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback((u: Usuario) => setUser(u), []);

  const value = useMemo(
    () => ({ user, status, login, logout, refreshUser }),
    [user, status, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export function RequireAuth({ children }: Readonly<{ children: ReactNode }>) {
  const { status, user } = useAuth();
  const location = useLocation();
  // Enquanto valida o token com /api/auth/me, não decide nem redireciona:
  // evita expulsar para /login um usuário que na verdade está logado.
  if (status === 'loading') return null;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}
