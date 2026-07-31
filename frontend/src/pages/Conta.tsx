import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { ExcluirConta } from './conta/ExcluirConta';
import { FormDados } from './conta/FormDados';
import { FormSenha } from './conta/FormSenha';

/**
 * Casca. As três funcionalidades — dados, senha e exclusão — eram uma função só de
 * 268 linhas com 11 useState; agora cada uma é dona do próprio estado, e esta
 * página não guarda nenhum.
 */
export function Conta() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Rota protegida por RequireAuth: user nunca é null aqui de fato, mas o guard
  // de tipo evita "possibly null" e cobre o instante de transição pós-logout.
  if (!user) return null;

  function excluida() {
    logout();
    navigate('/cadastro');
  }

  return (
    <div className="px-pad mx-auto flex w-full max-w-[calc(760px+var(--spacing-pad)*2)] flex-col gap-[22px] pt-[18px]">
      <div>
        <p className="eyebrow">Minha conta</p>
        <h1 className="text-[clamp(26px,5vw,34px)] font-extrabold tracking-[-0.02em]">{user.nome}</h1>
        <p className="text-t3 mt-2 max-w-[620px] text-[15px] [text-wrap:pretty]">
          Gerencie seus dados de acesso à Kinora.
        </p>
      </div>

      <FormDados user={user} refreshUser={refreshUser} />
      <FormSenha />
      <ExcluirConta aoExcluir={excluida} />
    </div>
  );
}
