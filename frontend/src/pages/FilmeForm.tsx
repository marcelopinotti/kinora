import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChipGroup } from '../components/ChipGroup';
import { Estado } from '../components/Estado';
import { Field } from '../components/Field';
import { RadioChips } from '../components/RadioChips';
import { erroDeApi, type Tipo } from '../api';
import { useListasDoFormulario } from './filme/useListasDoFormulario';
import { salvarFilme } from './filme/salvarFilme';
import { useCamposFilme } from './filme/useCamposFilme';
import { PosterField } from './filme/PosterField';
import { CAMPOS_VAZIOS, maskData, validarFilme, type CamposFilme } from './filme/validarFilme';

const TIPOS = [
  { valor: 'FILME', rotulo: 'Filme' },
  { valor: 'SERIE', rotulo: 'Série' },
] as const satisfies readonly { valor: Tipo; rotulo: string }[];

// Cópia neutra: a mesma tela cadastra filme e série, o tipo é um campo. Separado
// porque eram três ternários de `modo` seguidos, contando complexidade no
// componente principal sem terem relação com o comportamento do formulário.
const COPIA = {
  novo: {
    eyebrow: 'Novo título',
    h1: 'Cadastre seu título aqui',
    sub: 'Preencha as informações do título para publicá-lo no catálogo.',
  },
  editar: {
    eyebrow: 'Editar título',
    h1: 'Editar título',
    sub: 'Ajuste as informações e salve as alterações.',
  },
} as const;

function Acoes({ modo, desabilitado }: Readonly<{ modo: 'novo' | 'editar'; desabilitado: boolean }>) {
  return (
    <div className="mt-9.5 flex flex-wrap items-center justify-center gap-3.5">
      {/* min-width 340px no handoff, mas nunca estourando a viewport */}
      <button type="submit" className="btn btn-primary btn-tall min-w-[min(340px,100%)] px-[46px]" disabled={desabilitado}>
        {modo === 'editar' ? 'Salvar alterações' : 'Cadastrar título'}
      </button>
      {modo === 'editar' && (
        <Link to="/" className="btn btn-ghost btn-tall">
          Cancelar
        </Link>
      )}
    </div>
  );
}

function Cabecalho({ modo }: Readonly<{ modo: 'novo' | 'editar' }>) {
  const copia = COPIA[modo];
  return (
    <div className="mb-9.5 text-center">
      <p className="eyebrow mb-2.5">{copia.eyebrow}</p>
      <h1 className="text-[clamp(26px,5vw,36px)] font-extrabold tracking-[-0.02em]">{copia.h1}</h1>
      <p className="text-t3 mt-2.5 text-[15px]">{copia.sub}</p>
    </div>
  );
}

export function FilmeForm() {
  const { id } = useParams<{ id?: string }>();
  const modo: 'novo' | 'editar' = id ? 'editar' : 'novo';

  // Um objeto no lugar de nove useState. O ganho não é contar menos linhas: é o
  // setCampo abaixo, que centraliza "limpa o erro do campo e derruba o sucesso" —
  // regra que antes estava copiada em cinco closures de onChange e faltava nos
  // toggles, deixando "Alterações salvas." na tela sobre um formulário já mexido.
  const { campos, setCampos, carregando: carregandoFilme, erro: erroCarregar } = useCamposFilme(id, modo);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const { categorias, streamings, erro: erroListas } = useListasDoFormulario();

  function setCampo<K extends keyof CamposFilme>(campo: K, valor: CamposFilme[K]) {
    setCampos((c) => ({ ...c, [campo]: valor }));
    setFieldErrors((e) => ({ ...e, [campo]: '' }));
    setSucesso(false);
  }

  function alternar(campo: 'categorias' | 'streamings', valorId: number) {
    const atual = campos[campo];
    setCampo(campo, atual.includes(valorId) ? atual.filter((x) => x !== valorId) : atual.concat(valorId));
  }


  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;

    const erros = validarFilme(campos);
    if (Object.keys(erros).length > 0) {
      setFieldErrors(erros);
      return;
    }

    setEnviando(true);
    setSucesso(false);
    try {
      await salvarFilme(modo, id, campos);
      setFieldErrors({});
      setSucesso(true);
      if (modo === 'novo') {
        // tipo não é limpo de propósito: quem cadastra várias séries seguidas não
        // precisa reselecionar a cada envio.
        setCampos({ ...CAMPOS_VAZIOS, tipo: campos.tipo });
      }
    } catch (err) {
      setFieldErrors(erroDeApi(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Estado carregando={carregandoFilme} erro={erroCarregar} mensagemCarregando="Carregando título...">
    <div className="px-pad mx-auto w-full max-w-[calc(1040px+var(--spacing-pad)*2)] pt-[18px]">
      <div className="bg-surface border-border rounded-[14px] border px-[clamp(20px,5vw,56px)] pt-[clamp(28px,5vw,46px)] pb-[clamp(32px,5vw,52px)]">
        <Cabecalho modo={modo} />

        <form onSubmit={onSubmit}>
          {erroListas && <p className="field-error">{erroListas}</p>}
          <div className="grid grid-cols-2 gap-5 max-[720px]:grid-cols-1">
            <Field
              id="filme-titulo"
              label="Título"
              required
              value={campos.titulo}
              onChange={(v) => setCampo('titulo', v)}
              placeholder="Nome do título"
              inputClassName="input-form"
              error={fieldErrors.titulo}
            />
            <Field
              id="filme-data"
              label="Data de lançamento"
              required
              value={campos.dataLancamento}
              onChange={(v) => setCampo('dataLancamento', maskData(v))}
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
                value={campos.descricao}
                onChange={(v) => setCampo('descricao', v)}
                placeholder="Sinopse do título"
                rows={4}
                error={fieldErrors.descricao}
              />
            </div>
            <Field
              id="filme-nota"
              label="Nota"
              required
              value={campos.nota}
              onChange={(v) => setCampo('nota', v)}
              placeholder="0 a 10 — ex.: 8,7"
              inputClassName="input-form"
              error={fieldErrors.nota}
            />
            <PosterField
              value={campos.posterUrl}
              onChange={(v) => setCampo('posterUrl', v)}
              erro={fieldErrors.posterUrl}
            />
          </div>

          {/* RadioChips e não ChipGroup: tipo é seleção única, e escolher um valor
              desmarca o outro — radiogroup/aria-checked, não aria-pressed. */}
          <div className="mt-7.5">
            <RadioChips
              legenda="Tipo *"
              opcoes={TIPOS.map((t) => ({ valor: t.valor, rotulo: t.rotulo }))}
              valor={campos.tipo}
              aoSelecionar={(v) => setCampo('tipo', v)}
            />
          </div>

          {/* handoff: os grupos seguintes vêm 4px mais colados (26px) que o primeiro */}
          <div className="mt-6.5">
            <ChipGroup
              legenda="Categorias *"
              opcoes={categorias}
              selecionados={campos.categorias}
              aoAlternar={(catId) => alternar('categorias', catId)}
              erro={fieldErrors.categorias}
              erroId="filme-categorias-erro"
            />
          </div>

          <div className="mt-6.5">
            <ChipGroup
              legenda="Streamings *"
              opcoes={streamings}
              selecionados={campos.streamings}
              aoAlternar={(strId) => alternar('streamings', strId)}
              erro={fieldErrors.streamings}
              erroId="filme-streamings-erro"
            />
            <p className="field-hint">
              Não encontrou?{' '}
              <Link to="/gerenciar" className="text-accent hover:text-[#ff7350]">
                Gerencie as listas
              </Link>
              .
            </p>
          </div>

          <Acoes modo={modo} desabilitado={enviando || !!erroListas} />
          {fieldErrors.geral && <p className="field-error">{fieldErrors.geral}</p>}
          {sucesso && (
            <p className="text-ok mt-[18px] text-center text-sm font-bold">
              {modo === 'editar' ? 'Alterações salvas.' : 'Título cadastrado no catálogo.'}
            </p>
          )}
        </form>
      </div>
    </div>
    </Estado>
  );
}
