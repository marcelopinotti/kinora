import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { Field } from '../components/Field';
import { useAuth } from '../auth';
import { ApiError, mensagemGenerica } from '../api';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  // Vem do Cadastro quando a conta foi criada mas o login automático falhou.
  const aviso = (location.state as { aviso?: string } | null)?.aviso;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    try {
      await login(email.trim(), senha);
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      // 401 com detail: "E-mail ou senha inválidos." — erro de negócio, mostra sob o campo senha.
      if (err instanceof ApiError && err.detail) setErro(err.detail);
      else setErro(mensagemGenerica(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthShell titulo="Entre na sua conta">
      {aviso && <p className="field-ok">{aviso}</p>}
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-4">
          <Field
            id="login-email"
            label="Seu e-mail"
            hideLabel
            required
            type="email"
            value={email}
            onChange={(v) => {
              setEmail(v);
              setErro('');
            }}
            placeholder="Seu e-mail"
            inputClassName="input-auth"
          />
          <Field
            id="login-senha"
            label="Sua senha"
            hideLabel
            required
            type="password"
            value={senha}
            onChange={(v) => {
              setSenha(v);
              setErro('');
            }}
            placeholder="Sua senha"
            inputClassName="input-auth"
            error={erro}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-tall mt-8 w-full" disabled={enviando}>
          Entrar na conta
        </button>
      </form>
      <p className="text-t3 mt-6.5 text-center text-[15px]">
        Novo por aqui?{' '}
        <Link to="/cadastro" className="text-accent font-bold hover:text-[#ff7350]">
          Assine agora
        </Link>
      </p>
    </AuthShell>
  );
}
