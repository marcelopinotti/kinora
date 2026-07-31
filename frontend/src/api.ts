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

// Checa a forma de verdade: um array ou um Date passavam pela versão anterior,
// que só testava `typeof === 'object'` e ainda assim declarava `value is ProblemDetail`.
function isProblemDetail(value: unknown): value is ProblemDetail {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const detailOk = v.detail === undefined || typeof v.detail === 'string';
  const camposOk = v.campos === undefined || (typeof v.campos === 'object' && v.campos !== null);
  return detailOk && camposOk;
}

async function requestRaw(method: string, path: string, body?: unknown, autoLogout = true): Promise<unknown> {
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

  return data;
}

/**
 * Para endpoints que devolvem corpo. Corpo vazio num 2xx é violação de contrato:
 * antes virava `null` disfarçado de T, e `api.me()` podia entregar null tipado
 * como Usuario — usuário logado renderizado como visitante, sem erro nenhum.
 */
async function request<T>(method: string, path: string, body?: unknown, autoLogout = true): Promise<T> {
  const data = await requestRaw(method, path, body, autoLogout);
  if (data === null) {
    // 502: a requisição foi bem-sucedida do ponto de vista HTTP, mas a resposta
    // não é utilizável — o mesmo tipo de falha de um gateway que devolve lixo.
    throw new ApiError(502, 'O servidor respondeu sem corpo.');
  }
  return data as T;
}

/** Para os 204: não há corpo para tipar, e ausência dele é o esperado. */
async function requestVazio(method: string, path: string, body?: unknown): Promise<void> {
  await requestRaw(method, path, body);
}

export function mensagemGenerica(err: unknown): string {
  if (err instanceof ApiError && err.detail) return err.detail;
  return 'Não foi possível concluir a operação. Tente novamente.';
}

/**
 * A cascata de três braços sobre ApiError estava copiada em quatro handlers de
 * submit, idêntica a menos do campo que recebe o `detail`.
 *
 * `campoDetail` é onde cai o erro de negócio que o backend endereça a um campo
 * específico (409 de e-mail duplicado sob "email", 401 de senha atual incorreta
 * sob "senhaAtual"). Falha sem campo identificável vai para `geral`, que as telas
 * renderizam acima do formulário — pôr uma falha de rede sob o campo de e-mail
 * sugeria que o problema era o valor digitado.
 */
export function erroDeApi(err: unknown, campoDetail = 'geral'): Record<string, string> {
  if (err instanceof ApiError && err.campos) return err.campos;
  if (err instanceof ApiError && err.detail) return { [campoDetail]: err.detail };
  return { geral: mensagemGenerica(err) };
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
    requestVazio('PATCH', '/api/auth/me/senha', body),
  excluirConta: () => requestVazio('DELETE', '/api/auth/me'),

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
  excluirCategoria: (id: number) => requestVazio('DELETE', `/api/categoria/${id}`),

  streamings: () => request<Streaming[]>('GET', '/api/streaming'),
  criarStreaming: (nome: string) => request<Streaming>('POST', '/api/streaming', { nome }),
  atualizarStreaming: (id: number, nome: string) => request<Streaming>('PUT', `/api/streaming/${id}`, { nome }),
  excluirStreaming: (id: number) => requestVazio('DELETE', `/api/streaming/${id}`),
};
