import { FormEvent, useRef, useState } from 'react';
import { Field } from '../../components/Field';
import { useFocoNoErro } from '../../hooks/useFocoNoErro';
import { api, erroDeApi, type Usuario } from '../../api';

export function FormDados({
  user,
  refreshUser,
}: Readonly<{ user: Usuario; refreshUser: (u: Usuario) => void }>) {
  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  useFocoNoErro(erros, formRef);

  function alterar(campo: string, aplicar: () => void) {
    aplicar();
    setErros((s) => ({ ...s, [campo]: '' }));
    setSalvo(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (salvando) return;

    const novos: Record<string, string> = {};
    if (!nome.trim()) novos.nome = 'O nome é obrigatório.';
    // Formato do e-mail não se checa aqui: o input é type="email" required, então o
    // browser barra antes do submit, e o @Email do backend devolve 400 com `campos`.
    if (!email.trim()) novos.email = 'O e-mail é obrigatório.';
    if (Object.keys(novos).length > 0) {
      setErros(novos);
      return;
    }

    setSalvando(true);
    setSalvo(false);
    try {
      const atualizado = await api.atualizarMe({ nome: nome.trim(), email: email.trim() });
      refreshUser(atualizado);
      // Re-semeia com o que o servidor gravou, não com o que foi digitado: o backend
      // normaliza o e-mail para minúsculas, então digitar "Ana@X.com" deixava o campo
      // e o cabeçalho discordando até a próxima montagem.
      setNome(atualizado.nome);
      setEmail(atualizado.email);
      setErros({});
      setSalvo(true);
    } catch (err) {
      // 409 "E-mail já cadastrado" cai naturalmente sob o campo e-mail.
      setErros(erroDeApi(err, 'email'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="surface px-[clamp(20px,4vw,32px)] pt-[clamp(22px,4vw,30px)] pb-[clamp(24px,4vw,32px)]">
      <h2 className="mb-5.5 text-[21px] font-extrabold tracking-[-0.02em]">Dados</h2>
      <form ref={formRef} onSubmit={onSubmit}>
        {/* dentro de um painel o empilhamento é de campos: 18px, não os 22px entre painéis */}
        <div className="flex flex-col gap-4.5">
          <Field
            id="conta-nome"
            label="Nome"
            required
            value={nome}
            onChange={(v) => alterar('nome', () => setNome(v))}
            placeholder="Seu nome completo"
            error={erros.nome}
          />
          <Field
            id="conta-email"
            label="E-mail"
            required
            type="email"
            value={email}
            onChange={(v) => alterar('email', () => setEmail(v))}
            placeholder="voce@email.com"
            error={erros.email}
          />
        </div>
        {erros.geral && <p className="field-error" role="alert">{erros.geral}</p>}
        <div className="mt-6.5 flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary" disabled={salvando}>
            Salvar
          </button>
          {salvo && <output className="field-ok">Dados atualizados.</output>}
        </div>
      </form>
    </section>
  );
}
