// Fetch tipado para a API Kinora. Ver CONTRACT.md seção 2 para o contrato completo.

export type Categoria = { id: number; nome: string };
export type Streaming = { id: number; nome: string };
export type Usuario = { id: number; nome: string; email: string };

// Série não é entidade nova: é o mesmo título com tipo 'SERIE'.
export type Tipo = 'FILME' | 'SERIE';

export type FilmeResponse = {
  id: number;
  titulo: string;
  descricao: string | null;
  dataLancamento: string | null; // "dd/MM/yyyy"
  nota: number;
  tipo: Tipo;
  posterUrl: string | null;
  categorias: Categoria[];
  streamings: Streaming[];
};

export type FilmeRequest = {
  titulo: string;
  descricao: string;
  dataLancamento: string; // "dd/MM/yyyy"
  nota: number;
  tipo: Tipo;
  posterUrl: string; // vazio quando não há pôster; o backend aceita ""
  categorias: number[];
  streamings: number[];
};

export type LoginResponse = { token: string; usuario: Usuario };

type ProblemDetail = {
  detail?: string;
  campos?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  detail?: string;
  campos?: Record<string, string>;

  constructor(status: number, detail?: string, campos?: Record<string, string>) {
    super(detail ?? `Erro ${status}`);
    this.status = status;
    this.detail = detail;
    this.campos = campos;
  }
}

const TOKEN_KEY = 'kinora.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Registrado pelo AuthProvider para reagir a "sessão expirada" (401 sem detail)
// sem acoplar este módulo ao React.
let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(fn: (() => void) | null): void {
  sessionExpiredHandler = fn;
}

function isProblemDetail(value: unknown): value is ProblemDetail {
  return typeof value === 'object' && value !== null;
}

async function request<T>(method: string, path: string, body?: unknown, autoLogout = true): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 e o 401 do filtro de segurança não têm corpo; texto de erro HTML também
  // não é JSON válido — nunca chamar res.json() direto.
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const problem = isProblemDetail(data) ? data : {};
    const detail = typeof problem.detail === 'string' ? problem.detail : undefined;
    const campos = typeof problem.campos === 'object' && problem.campos !== null ? problem.campos : undefined;

    // Regra do contrato: deslogar automaticamente só quando 401 SEM detail.
    // 401 com detail é erro de negócio (login errado, senha atual incorreta).
    if (res.status === 401 && !detail && autoLogout) {
      setToken(null);
      if (sessionExpiredHandler) sessionExpiredHandler();
    }
    throw new ApiError(res.status, detail, campos);
  }

  return data as T;
}

export function mensagemGenerica(err: unknown): string {
  if (err instanceof ApiError && err.detail) return err.detail;
  return 'Não foi possível concluir a operação. Tente novamente.';
}

export const api = {
  registrar: (body: { nome: string; email: string; senha: string }) =>
    request<Usuario>('POST', '/api/auth/registrar', body),
  login: (body: { email: string; senha: string }) => request<LoginResponse>('POST', '/api/auth/login', body),
  // autoLogout=false: quem chama /me é o AuthProvider na montagem, e ele decide
  // sozinho o que fazer com o 401 — o efeito global limparia um token novo se a
  // resposta atrasasse até depois de um login bem-sucedido.
  me: () => request<Usuario>('GET', '/api/auth/me', undefined, false),
  atualizarMe: (body: { nome: string; email: string }) => request<Usuario>('PUT', '/api/auth/me', body),
  alterarSenha: (body: { senhaAtual: string; novaSenha: string }) =>
    request<void>('PATCH', '/api/auth/me/senha', body),
  excluirConta: () => request<void>('DELETE', '/api/auth/me'),

  // Uma listagem só: tipo e categoria são params opcionais e combináveis, e o
  // filtro de tipo tem que ser do servidor (o /search por categoria saiu).
  filmes: (filtros: { tipo?: Tipo; categoria?: number } = {}) => {
    const params = new URLSearchParams();
    if (filtros.tipo) params.set('tipo', filtros.tipo);
    if (filtros.categoria !== undefined) params.set('categoria', String(filtros.categoria));
    const qs = params.toString();
    return request<FilmeResponse[]>('GET', qs ? `/api/filme?${qs}` : '/api/filme');
  },
  filme: (id: number) => request<FilmeResponse>('GET', `/api/filme/${id}`),
  criarFilme: (body: FilmeRequest) => request<FilmeResponse>('POST', '/api/filme', body),
  atualizarFilme: (id: number, body: FilmeRequest) => request<FilmeResponse>('PUT', `/api/filme/${id}`, body),

  categorias: () => request<Categoria[]>('GET', '/api/categoria'),
  criarCategoria: (nome: string) => request<Categoria>('POST', '/api/categoria', { nome }),
  atualizarCategoria: (id: number, nome: string) => request<Categoria>('PUT', `/api/categoria/${id}`, { nome }),
  excluirCategoria: (id: number) => request<void>('DELETE', `/api/categoria/${id}`),

  streamings: () => request<Streaming[]>('GET', '/api/streaming'),
  criarStreaming: (nome: string) => request<Streaming>('POST', '/api/streaming', { nome }),
  atualizarStreaming: (id: number, nome: string) => request<Streaming>('PUT', `/api/streaming/${id}`, { nome }),
  excluirStreaming: (id: number) => request<void>('DELETE', `/api/streaming/${id}`),
};
