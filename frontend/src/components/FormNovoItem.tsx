import { FormEvent, useState } from 'react';
import { ApiError, mensagemGenerica } from '../api';
import type { Item } from './ListaSimples';

function mensagemErroNome(err: unknown): string {
  if (err instanceof ApiError && err.campos?.nome) return err.campos.nome;
  return mensagemGenerica(err);
}

type FormNovoItemProps = {
  placeholder: string;
  entidade: 'categoria' | 'streaming';
  /** Sem a lista carregada a checagem de duplicado é no-op, então criar fica travado. */
  bloqueado: boolean;
  validarNome: (nome: string) => string | null;
  criarItem: (nome: string) => Promise<Item>;
  aoCriado: (item: Item) => void;
};

/**
 * Formulário de novo item. Dono do próprio rascunho, erro e estado de envio — no
 * ListaSimples eram mais três useState e mais oito ramos, sem relação alguma com
 * a listagem que o componente também faz.
 */
export function FormNovoItem({
  placeholder,
  entidade,
  bloqueado,
  validarNome,
  criarItem,
  aoCriado,
}: Readonly<FormNovoItemProps>) {
  const [novo, setNovo] = useState('');
  const [erro, setErro] = useState('');
  const [criando, setCriando] = useState(false);

  const novoId = `lista-novo-${entidade}`;
  const desabilitado = criando || bloqueado;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (desabilitado) return;

    const invalido = validarNome(novo);
    if (invalido) {
      setErro(invalido);
      return;
    }
    setCriando(true);
    try {
      aoCriado(await criarItem(novo.trim()));
      setNovo('');
      setErro('');
    } catch (err) {
      setErro(mensagemErroNome(err));
    } finally {
      setCriando(false);
    }
  }

  return (
    <form className="flex min-w-0 flex-col gap-1.75" onSubmit={onSubmit}>
      <div className="flex gap-2.5">
        <label className="sr-only" htmlFor={novoId}>
          {placeholder}
        </label>
        <input
          id={novoId}
          className={`input h-13 min-w-0 flex-1 text-[15px] ${erro ? 'input-invalid' : ''}`.trim()}
          value={novo}
          maxLength={100}
          placeholder={placeholder}
          onChange={(e) => {
            setNovo(e.target.value);
            setErro('');
          }}
          disabled={desabilitado}
          aria-invalid={!!erro}
          aria-describedby={erro ? `${novoId}-erro` : undefined}
        />
        <button type="submit" className="btn btn-primary" disabled={desabilitado}>
          Adicionar
        </button>
      </div>
      {erro && (
        <p className="field-error" id={`${novoId}-erro`} role="alert">
          {erro}
        </p>
      )}
    </form>
  );
}
