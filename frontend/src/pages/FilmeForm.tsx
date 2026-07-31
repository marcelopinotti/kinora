import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Field } from '../components/Field';
import { TopBar } from '../components/TopBar';
import {
  ApiError,
  api,
  mensagemGenerica,
  type Categoria,
  type FilmeRequest,
  type Streaming,
  type Tipo,
} from '../api';

const URL_HTTP = /^https?:\/\//i;

const TIPOS = [
  { valor: 'FILME', rotulo: 'Filme' },
  { valor: 'SERIE', rotulo: 'Série' },
] as const satisfies readonly { valor: Tipo; rotulo: string }[];

function maskData(raw: string): string {
  const digitos = raw.replace(/\D/g, '').slice(0, 8);
  return [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)].filter(Boolean).join('/');
}

function dataValida(v: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (!m) return false;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  const d = new Date(ano, mes - 1, dia);
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
}

export function FilmeForm() {
  const { id } = useParams<{ id?: string }>();
  const modo: 'novo' | 'editar' = id ? 'editar' : 'novo';

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataLancamento, setDataLancamento] = useState('');
  const [nota, setNota] = useState('');
  const [tipo, setTipo] = useState<Tipo>('FILME');
  const [posterUrl, setPosterUrl] = useState('');
  // A imagem só se revela quebrada ao carregar; zera a cada URL nova.
  const [posterQuebrado, setPosterQuebrado] = useState(false);
  const [categoriasSel, setCategoriasSel] = useState<number[]>([]);
  const [streamingsSel, setStreamingsSel] = useState<number[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [streamings, setStreamings] = useState<Streaming[]>([]);
  const [carregandoFilme, setCarregandoFilme] = useState(modo === 'editar');
  const [erroCarregar, setErroCarregar] = useState('');
  // Sem as listas o formulário é insubmissível (validar() exige 1 de cada):
  // o erro precisa aparecer e o envio ficar bloqueado, não falhar em silêncio.
  const [erroListas, setErroListas] = useState('');

  useEffect(() => {
    Promise.all([api.categorias(), api.streamings()])
      .then(([cats, streams]) => {
        setCategorias(cats);
        setStreamings(streams);
        setErroListas('');
      })
      .catch(() => setErroListas('Não foi possível carregar as categorias e os streamings. Recarregue a página.'));
  }, []);

  useEffect(() => {
    if (modo !== 'editar' || !id) return;
    let cancelled = false;
    setCarregandoFilme(true);
    // Sem este reset, ir direto de uma URL de edição para outra (mesmo <Route>,
    // sem remontar) mantém a tela de erro anterior mesmo com o carregamento novo
    // bem-sucedido.
    setErroCarregar('');

    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      // /filme/abc/editar chegava aqui como NaN e virava GET /api/filme/NaN,
      // devolvendo o erro genérico em vez de "não encontrado".
      setErroCarregar('Título não encontrado.');
      setCarregandoFilme(false);
      return;
    }

    api
      .filme(idNum)
      .then((f) => {
        if (cancelled) return;
        setTitulo(f.titulo);
        setDescricao(f.descricao ?? '');
        setDataLancamento(f.dataLancamento ?? '');
        setNota(String(f.nota).replace('.', ','));
        setTipo(f.tipo);
        setPosterUrl(f.posterUrl ?? '');
        setPosterQuebrado(false);
        setCategoriasSel(f.categorias.map((c) => c.id));
        setStreamingsSel(f.streamings.map((s) => s.id));
      })
      .catch((err) => {
        if (!cancelled) setErroCarregar(mensagemGenerica(err));
      })
      .finally(() => {
        if (!cancelled) setCarregandoFilme(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modo, id]);

  // Derivado, não guardado: preview só com URL http(s) plausível.
  const mostrarPreview = URL_HTTP.test(posterUrl.trim());

  function validar(): Record<string, string> {
    const erros: Record<string, string> = {};
    if (!titulo.trim()) erros.titulo = 'O título é obrigatório.';
    if (!descricao.trim()) erros.descricao = 'A descrição é obrigatória.';
    if (!dataLancamento.trim()) erros.dataLancamento = 'A data de lançamento é obrigatória.';
    else if (!dataValida(dataLancamento.trim())) erros.dataLancamento = 'Use o formato dd/mm/aaaa.';
    const notaTrim = nota.trim();
    if (!notaTrim) erros.nota = 'A nota é obrigatória.';
    else {
      const n = Number(notaTrim.replace(',', '.'));
      if (Number.isNaN(n) || n < 0 || n > 10) erros.nota = 'A nota deve ser um número entre 0 e 10.';
    }
    const poster = posterUrl.trim();
    // Pôster é opcional: vazio passa. Formato da imagem em si não se valida aqui
    // — quem reprova é o onError do preview.
    if (poster && !URL_HTTP.test(poster)) erros.posterUrl = 'Informe uma URL que comece com http:// ou https://.';
    else if (poster.length > 500) erros.posterUrl = 'A URL deve ter no máximo 500 caracteres.';
    if (categoriasSel.length === 0) erros.categorias = 'Selecione ao menos uma categoria.';
    if (streamingsSel.length === 0) erros.streamings = 'Selecione ao menos um streaming.';
    return erros;
  }

  // setSucesso(false) aqui pelo mesmo motivo dos Field: sem isso, desmarcar uma
  // categoria depois de salvar deixava "Alterações salvas." na tela ao lado de um
  // formulário já modificado.
  function toggleCategoria(catId: number) {
    setCategoriasSel((sel) => (sel.includes(catId) ? sel.filter((x) => x !== catId) : sel.concat(catId)));
    setFieldErrors((e) => ({ ...e, categorias: '' }));
    setSucesso(false);
  }

  function toggleStreaming(strId: number) {
    setStreamingsSel((sel) => (sel.includes(strId) ? sel.filter((x) => x !== strId) : sel.concat(strId)));
    setFieldErrors((e) => ({ ...e, streamings: '' }));
    setSucesso(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const erros = validar();
    if (Object.keys(erros).length > 0) {
      setFieldErrors(erros);
      return;
    }
    setEnviando(true);
    setSucesso(false);
    const body: FilmeRequest = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      dataLancamento: dataLancamento.trim(),
      nota: Number(nota.trim().replace(',', '.')),
      tipo,
      posterUrl: posterUrl.trim(),
      categorias: categoriasSel,
      streamings: streamingsSel,
    };
    try {
      if (modo === 'editar' && id) {
        await api.atualizarFilme(Number(id), body);
      } else {
        await api.criarFilme(body);
      }
      setFieldErrors({});
      setSucesso(true);
      if (modo === 'novo') {
        setTitulo('');
        setDescricao('');
        setDataLancamento('');
        setNota('');
        setPosterUrl('');
        setPosterQuebrado(false);
        // tipo não é limpo de propósito: quem cadastra várias séries seguidas não
        // precisa reselecionar a cada envio.
        setCategoriasSel([]);
        setStreamingsSel([]);
      }
    } catch (err) {
      if (err instanceof ApiError && err.campos) setFieldErrors(err.campos);
      else setFieldErrors({ geral: mensagemGenerica(err) });
    } finally {
      setEnviando(false);
    }
  }

  if (modo === 'editar' && carregandoFilme) {
    return (
      <div className="relative min-h-screen pb-[70px]">
        <TopBar />
        <p className="state-msg">Carregando título...</p>
      </div>
    );
  }

  if (modo === 'editar' && erroCarregar) {
    return (
      <div className="relative min-h-screen pb-[70px]">
        <TopBar />
        <p className="state-msg state-error">{erroCarregar}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-[70px]">
      <TopBar />
      <div className="px-pad mx-auto w-full max-w-[calc(1040px+var(--spacing-pad)*2)] pt-[18px]">
        <div className="bg-surface border-border rounded-[14px] border px-[clamp(20px,5vw,56px)] pt-[clamp(28px,5vw,46px)] pb-[clamp(32px,5vw,52px)]">
          <div className="mb-[38px] text-center">
            {/* Cópia neutra: a mesma tela cadastra filme e série, o tipo é um campo. */}
            <p className="eyebrow mb-2.5">{modo === 'editar' ? 'Editar título' : 'Novo título'}</p>
            <h1 className="text-[clamp(26px,5vw,36px)] font-extrabold tracking-[-0.02em]">
              {modo === 'editar' ? 'Editar título' : 'Cadastre seu título aqui'}
            </h1>
            <p className="text-t3 mt-2.5 text-[15px]">
              {modo === 'editar'
                ? 'Ajuste as informações e salve as alterações.'
                : 'Preencha as informações do título para publicá-lo no catálogo.'}
            </p>
          </div>

          <form onSubmit={onSubmit}>
            {erroListas && <p className="field-error">{erroListas}</p>}
            <div className="grid grid-cols-2 gap-5 max-[720px]:grid-cols-1">
              <Field
                id="filme-titulo"
                label="Título"
                required
                value={titulo}
                onChange={(v) => {
                  setTitulo(v);
                  setFieldErrors((e) => ({ ...e, titulo: '' }));
                  setSucesso(false);
                }}
                placeholder="Nome do título"
                inputClassName="input-form"
                error={fieldErrors.titulo}
              />
              <Field
                id="filme-data"
                label="Data de lançamento"
                required
                value={dataLancamento}
                onChange={(v) => {
                  setDataLancamento(maskData(v));
                  setFieldErrors((e) => ({ ...e, dataLancamento: '' }));
                  setSucesso(false);
                }}
                placeholder="dd/mm/aaaa"
                inputClassName="input-form"
                error={fieldErrors.dataLancamento}
              />
              <div className="col-span-full">
                <Field
                  as="textarea"
                  id="filme-descricao"
                  label="Descrição"
                  required
                  value={descricao}
                  onChange={(v) => {
                    setDescricao(v);
                    setFieldErrors((e) => ({ ...e, descricao: '' }));
                    setSucesso(false);
                  }}
                  placeholder="Sinopse do título"
                  rows={4}
                  error={fieldErrors.descricao}
                />
              </div>
              <Field
                id="filme-nota"
                label="Nota"
                required
                value={nota}
                onChange={(v) => {
                  setNota(v);
                  setFieldErrors((e) => ({ ...e, nota: '' }));
                  setSucesso(false);
                }}
                placeholder="0 a 10 — ex.: 8,7"
                inputClassName="input-form"
                error={fieldErrors.nota}
              />
              <div className="col-span-full">
                <Field
                  id="filme-poster"
                  label="Imagem do pôster"
                  value={posterUrl}
                  onChange={(v) => {
                    setPosterUrl(v);
                    setPosterQuebrado(false);
                    setFieldErrors((e) => ({ ...e, posterUrl: '' }));
                    setSucesso(false);
                  }}
                  placeholder="https://…"
                  inputClassName="input-form"
                  error={fieldErrors.posterUrl}
                />
                {/* preview ao vivo: mesma proporção do card, em miniatura */}
                {mostrarPreview &&
                  (posterQuebrado ? (
                    <p className="text-error mt-3 text-[13px] font-semibold">Não foi possível carregar essa imagem.</p>
                  ) : (
                    <div className="border-border-2 bg-surface-2 mt-3 aspect-[2/3] w-[132px] overflow-hidden rounded-[10px] border">
                      <img
                        className="block size-full object-cover"
                        src={posterUrl.trim()}
                        alt="Pré-visualização do pôster"
                        onError={() => setPosterQuebrado(true)}
                      />
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-[30px] flex flex-col gap-[9px]">
              <label className="field-label" id="filme-tipo-label">
                Tipo{' '}
                <span className="text-accent" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-labelledby="filme-tipo-label">
                {TIPOS.map(({ valor, rotulo }) => (
                  <button
                    key={valor}
                    type="button"
                    className={`chip ${tipo === valor ? 'chip-on' : ''}`.trim()}
                    role="radio"
                    aria-checked={tipo === valor}
                    onClick={() => {
                      setTipo(valor);
                      setSucesso(false);
                    }}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>

            {/* handoff: os grupos seguintes vêm 4px mais colados (26px) que o primeiro */}
            <div className="mt-[26px] flex flex-col gap-[9px]">
              <label className="field-label" id="filme-categorias-label">
                Categorias{' '}
                <span className="text-accent" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="flex flex-wrap gap-2.5" role="group" aria-labelledby="filme-categorias-label">
                {categorias.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip ${categoriasSel.includes(c.id) ? 'chip-on' : ''}`.trim()}
                    onClick={() => toggleCategoria(c.id)}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
              {fieldErrors.categorias && <p className="field-error">{fieldErrors.categorias}</p>}
            </div>

            <div className="mt-[26px] flex flex-col gap-[9px]">
              <label className="field-label" id="filme-streamings-label">
                Streamings{' '}
                <span className="text-accent" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="flex flex-wrap gap-2.5" role="group" aria-labelledby="filme-streamings-label">
                {streamings.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip ${streamingsSel.includes(s.id) ? 'chip-on' : ''}`.trim()}
                    onClick={() => toggleStreaming(s.id)}
                  >
                    {s.nome}
                  </button>
                ))}
              </div>
              {fieldErrors.streamings && <p className="field-error">{fieldErrors.streamings}</p>}
              <p className="field-hint">
                Não encontrou?{' '}
                <Link to="/gerenciar" className="text-accent hover:text-[#ff7350]">
                  Gerencie as listas
                </Link>
                .
              </p>
            </div>

            <div className="mt-[38px] flex flex-wrap items-center justify-center gap-3.5">
              {/* min-width 340px no handoff, mas nunca estourando a viewport */}
              <button
                type="submit"
                className="btn btn-primary btn-tall min-w-[min(340px,100%)] px-[46px]"
                disabled={enviando || !!erroListas}
              >
                {modo === 'editar' ? 'Salvar alterações' : 'Cadastrar título'}
              </button>
              {modo === 'editar' && (
                <Link to="/" className="btn btn-ghost btn-tall">
                  Cancelar
                </Link>
              )}
            </div>
            {fieldErrors.geral && <p className="field-error">{fieldErrors.geral}</p>}
            {sucesso && (
              <p className="text-ok mt-[18px] text-center text-sm font-bold">
                {modo === 'editar' ? 'Alterações salvas.' : 'Título cadastrado no catálogo.'}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
