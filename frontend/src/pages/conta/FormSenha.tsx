import { FormEvent, useRef, useState } from 'react';
import { Field } from '../../components/Field';
import { useFocoNoErro } from '../../hooks/useFocoNoErro';
import { api, erroDeApi } from '../../api';

export function FormSenha() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salva, setSalva] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  useFocoNoErro(erros, formRef);

  function alterar(campo: string, aplicar: () => void) {
    aplicar();
    setErros((s) => ({ ...s, [campo]: '' }));
    setSalva(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (salvando) return;

    const novos: Record<string, string> = {};
    if (!senhaAtual) novos.senhaAtual = 'Informe sua senha atual.';
    if (!novaSenha) novos.novaSenha = 'Informe a nova senha.';
    else if (novaSenha.length < 8) novos.novaSenha = 'A senha deve ter no mínimo 8 caracteres.';
    else if (novaSenha === senhaAtual) novos.novaSenha = 'A nova senha deve ser diferente da atual.';
    if (Object.keys(novos).length > 0) {
      setErros(novos);
      return;
    }

    setSalvando(true);
    setSalva(false);
    try {
      await api.alterarSenha({ senhaAtual, novaSenha });
      setErros({});
      setSalva(true);
      setSenhaAtual('');
      setNovaSenha('');
    } catch (err) {
      // 401 com detail "Senha atual incorreta": erro de negócio, NUNCA desloga — mostra sob o campo.
      setErros(erroDeApi(err, 'senhaAtual'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="surface px-[clamp(20px,4vw,32px)] pt-[clamp(22px,4vw,30px)] pb-[clamp(24px,4vw,32px)]">
      <h2 className="mb-5.5 text-[21px] font-extrabold tracking-[-0.02em]">Alterar senha</h2>
      <form ref={formRef} onSubmit={onSubmit}>
        <div className="flex flex-col gap-4.5">
          <Field
            id="conta-senha-atual"
            label="Senha atual"
            required
            type="password"
            value={senhaAtual}
            onChange={(v) => alterar('senhaAtual', () => setSenhaAtual(v))}
            placeholder="••••••••"
            error={erros.senhaAtual}
          />
          <Field
            id="conta-senha-nova"
            label="Nova senha"
            required
            type="password"
            value={novaSenha}
            onChange={(v) => alterar('novaSenha', () => setNovaSenha(v))}
            placeholder="Mínimo de 8 caracteres"
            error={erros.novaSenha}
            hint="A senha deve ter no mínimo 8 caracteres."
          />
        </div>
        {erros.geral && <p className="field-error" role="alert">{erros.geral}</p>}
        <div className="mt-6.5 flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            Alterar senha
          </button>
          {salva && <output className="field-ok">Senha alterada.</output>}
        </div>
      </form>
    </section>
  );
}
