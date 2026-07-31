import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { Field } from '../components/Field';
import { useAuth } from '../auth';
import { api, erroDeApi } from '../api';

export function Cadastro() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    // Limpa antes de tentar de novo: hoje só funciona porque todo braço do catch
    // troca o objeto inteiro; um braço que fizesse merge parcial deixaria erro
    // antigo na tela.
    setErros({});
    setEnviando(true);
    try {
      await api.registrar({ nome: nome.trim(), email: email.trim(), senha });
    } catch (err) {
      // 409 de e-mail duplicado vai sob o campo; falha sem campo identificável vai
      // para `geral`, acima do formulário — antes caía sob "e-mail" e sugeria que o
      // problema era o endereço digitado, mesmo quando era a rede.
      setErros(erroDeApi(err, 'email'));
      setEnviando(false);
      return;
    }
    // Registro não devolve token: entra logo em seguida com as mesmas credenciais.
    // Se esse login falhar, a conta já existe — repetir o cadastro só devolveria
    // 409, então manda para o login com o aviso em vez de deixar o usuário preso.
    //
    // Sem finally de propósito: os dois caminhos navegam para fora, desmontando o
    // formulário. Reabilitar o botão aqui só criaria uma janela de duplo envio
    // durante a transição.
    try {
      await login(email.trim(), senha);
      navigate('/');
    } catch {
      navigate('/login', {
        replace: true,
        state: { aviso: 'Sua conta foi criada. Entre com seu e-mail e senha.' },
      });
    }
  }

  function clear(campo: string) {
    setErros((s) => ({ ...s, [campo]: '' }));
  }

  return (
    <AuthShell titulo="Cadastre-se" sub="Milhares de filmes e séries. Cancele quando quiser.">
      {erros.geral && <p className="field-error">{erros.geral}</p>}
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-4">
          <Field
            id="cadastro-nome"
            label="Seu nome completo"
            hideLabel
            required
            value={nome}
            onChange={(v) => {
              setNome(v);
              clear('nome');
            }}
            placeholder="Seu nome completo"
            inputClassName="input-auth"
            error={erros.nome}
          />
          <Field
            id="cadastro-email"
            label="Seu melhor e-mail"
            hideLabel
            required
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              clear('email');
            }}
            placeholder="Seu melhor e-mail"
            inputClassName="input-auth"
            error={erros.email}
          />
          <Field
            id="cadastro-senha"
            label="Sua senha"
            hideLabel
            required
            type="password"
            value={senha}
            onChange={(v) => {
              setSenha(v);
              clear('senha');
            }}
            placeholder="Sua senha"
            inputClassName="input-auth"
            error={erros.senha}
            hint="Use no mínimo 8 caracteres."
          />
        </div>
        <button type="submit" className="btn btn-primary btn-tall mt-8 w-full" disabled={enviando}>
          Criar minha conta
        </button>
      </form>
      <p className="text-t3 mt-6.5 text-center text-[15px]">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-accent font-bold hover:text-[#ff7350]">
          Faça login
        </Link>
      </p>
    </AuthShell>
  );
}
