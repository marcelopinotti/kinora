import {FormEvent, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Field} from '../components/Field';
import {TopBar} from '../components/TopBar';
import {useAuth} from '../auth';
import {ApiError, api, mensagemGenerica} from '../api';

export function Conta() {
    const {user, refreshUser, logout} = useAuth();
    const navigate = useNavigate();

    // Rota protegida por RequireAuth: user nunca é null aqui de fato, mas o guard
    // de tipo evita "possibly null" e cobre o instante de transição pós-logout.
    if (!user) return null;

    return <ContaConteudo user={user} refreshUser={refreshUser} logout={logout} navigate={navigate}/>;
}

function ContaConteudo({
                           user,
                           refreshUser,
                           logout,
                           navigate,
                       }: {
    user: { nome: string; email: string };
    refreshUser: (u: { id: number; nome: string; email: string }) => void;
    logout: () => void;
    navigate: (path: string) => void;
}) {
    const [nome, setNome] = useState(user.nome);
    const [email, setEmail] = useState(user.email);
    const [dadosErro, setDadosErro] = useState<Record<string, string>>({});
    const [dadosSalvo, setDadosSalvo] = useState(false);
    const [salvandoDados, setSalvandoDados] = useState(false);

    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [senhaErro, setSenhaErro] = useState<Record<string, string>>({});
    const [senhaSalva, setSenhaSalva] = useState(false);
    const [salvandoSenha, setSalvandoSenha] = useState(false);

    const [delEstado, setDelEstado] = useState<'idle' | 'confirm'>('idle');
    const [confirmTexto, setConfirmTexto] = useState('');
    const [delErro, setDelErro] = useState('');
    const [excluindo, setExcluindo] = useState(false);

    async function salvarDados(e: FormEvent) {
        e.preventDefault();
        const erros: Record<string, string> = {};
        if (!nome.trim()) erros.nome = 'O nome é obrigatório.';
        // Formato do e-mail não se checa aqui: o input é type="email" required, então o
        // browser barra antes do submit, e o @Email do backend devolve 400 com `campos`.
        if (!email.trim()) erros.email = 'O e-mail é obrigatório.';
        if (Object.keys(erros).length > 0) {
            setDadosErro(erros);
            return;
        }
        setSalvandoDados(true);
        setDadosSalvo(false);
        try {
            const atualizado = await api.atualizarMe({nome: nome.trim(), email: email.trim()});
            refreshUser(atualizado);
            setDadosErro({});
            setDadosSalvo(true);
        } catch (err) {
            if (err instanceof ApiError && err.campos) setDadosErro(err.campos);
            // 409 "E-mail já cadastrado" cai naturalmente sob o campo e-mail.
            else if (err instanceof ApiError && err.detail) setDadosErro({email: err.detail});
            else setDadosErro({geral: mensagemGenerica(err)});
        } finally {
            setSalvandoDados(false);
        }
    }

    async function salvarSenha(e: FormEvent) {
        e.preventDefault();
        const erros: Record<string, string> = {};
        if (!senhaAtual) erros.senhaAtual = 'Informe sua senha atual.';
        if (!novaSenha) erros.novaSenha = 'Informe a nova senha.';
        else if (novaSenha.length < 8) erros.novaSenha = 'A senha deve ter no mínimo 8 caracteres.';
        else if (novaSenha === senhaAtual) erros.novaSenha = 'A nova senha deve ser diferente da atual.';
        if (Object.keys(erros).length > 0) {
            setSenhaErro(erros);
            return;
        }
        setSalvandoSenha(true);
        setSenhaSalva(false);
        try {
            await api.alterarSenha({senhaAtual, novaSenha});
            setSenhaErro({});
            setSenhaSalva(true);
            setSenhaAtual('');
            setNovaSenha('');
        } catch (err) {
            if (err instanceof ApiError && err.campos) setSenhaErro(err.campos);
            // 401 com detail "Senha atual incorreta": erro de negócio, NUNCA desloga — mostra sob o campo.
            else if (err instanceof ApiError && err.detail) setSenhaErro({senhaAtual: err.detail});
            else setSenhaErro({geral: mensagemGenerica(err)});
        } finally {
            setSalvandoSenha(false);
        }
    }

    function pedirExclusao() {
        setDelEstado('confirm');
        setDelErro('');
        setConfirmTexto('');
    }

    function cancelarExclusao() {
        setDelEstado('idle');
        setDelErro('');
        setConfirmTexto('');
    }

    async function confirmarExclusao(e: FormEvent) {
        e.preventDefault();
        if (confirmTexto.trim().toUpperCase() !== 'EXCLUIR') {
            setDelErro('Digite EXCLUIR para confirmar a exclusão.');
            return;
        }
        setExcluindo(true);
        try {
            await api.excluirConta();
            logout();
            navigate('/cadastro');
        } catch (err) {
            setDelErro(mensagemGenerica(err));
        } finally {
            setExcluindo(false);
        }
    }

    return (
        <div className="relative min-h-screen pb-[70px]">
            <TopBar/>
            <div
                className="px-pad mx-auto flex w-full max-w-[calc(760px+var(--spacing-pad)*2)] flex-col gap-[22px] pt-[18px]">
                <div>
                    <p className="eyebrow">Minha conta</p>
                    <h1 className="text-[clamp(26px,5vw,34px)] font-extrabold tracking-[-0.02em]">{user.nome}</h1>
                    <p className="text-t3 mt-2 max-w-[620px] text-[15px] [text-wrap:pretty]">
                        Gerencie seus dados de acesso à Kinora.
                    </p>
                </div>

                <section
                    className="bg-surface border-border rounded-[14px] border px-[clamp(20px,4vw,32px)] pt-[clamp(22px,4vw,30px)] pb-[clamp(24px,4vw,32px)]">
                    <h2 className="mb-[22px] text-[21px] font-extrabold tracking-[-0.02em]">Dados</h2>
                    <form onSubmit={salvarDados}>
                        {/* dentro de um painel o empilhamento é de campos: 18px, não os 22px entre painéis */}
                        <div className="flex flex-col gap-[18px]">
                            <Field
                                id="conta-nome"
                                label="Nome"
                                required
                                value={nome}
                                onChange={(v) => {
                                    setNome(v);
                                    setDadosErro((s) => ({...s, nome: ''}));
                                    setDadosSalvo(false);
                                }}
                                placeholder="Seu nome completo"
                                error={dadosErro.nome}
                            />
                            <Field
                                id="conta-email"
                                label="E-mail"
                                required
                                type="email"
                                value={email}
                                onChange={(v) => {
                                    setEmail(v);
                                    setDadosErro((s) => ({...s, email: ''}));
                                    setDadosSalvo(false);
                                }}
                                placeholder="voce@email.com"
                                error={dadosErro.email}
                            />
                        </div>
                        {dadosErro.geral && <p className="field-error">{dadosErro.geral}</p>}
                        <div className="mt-[26px] flex flex-wrap items-center gap-4">
                            <button type="submit" className="btn btn-primary" disabled={salvandoDados}>
                                Salvar
                            </button>
                            {dadosSalvo && <span className="field-ok">Dados atualizados.</span>}
                        </div>
                    </form>
                </section>

                <section
                    className="bg-surface border-border rounded-[14px] border px-[clamp(20px,4vw,32px)] pt-[clamp(22px,4vw,30px)] pb-[clamp(24px,4vw,32px)]">
                    <h2 className="mb-[22px] text-[21px] font-extrabold tracking-[-0.02em]">Alterar senha</h2>
                    <form onSubmit={salvarSenha}>
                        <div className="flex flex-col gap-[18px]">
                            <Field
                                id="conta-senha-atual"
                                label="Senha atual"
                                required
                                type="password"
                                value={senhaAtual}
                                onChange={(v) => {
                                    setSenhaAtual(v);
                                    setSenhaErro((s) => ({...s, senhaAtual: ''}));
                                    setSenhaSalva(false);
                                }}
                                placeholder="••••••••"
                                error={senhaErro.senhaAtual}
                            />
                            <Field
                                id="conta-senha-nova"
                                label="Nova senha"
                                required
                                type="password"
                                value={novaSenha}
                                onChange={(v) => {
                                    setNovaSenha(v);
                                    setSenhaErro((s) => ({...s, novaSenha: ''}));
                                    setSenhaSalva(false);
                                }}
                                placeholder="Mínimo de 8 caracteres"
                                error={senhaErro.novaSenha}
                                hint="A senha deve ter no mínimo 8 caracteres."
                            />
                        </div>
                        {senhaErro.geral && <p className="field-error">{senhaErro.geral}</p>}
                        <div className="mt-[26px] flex flex-wrap items-center gap-4">
                            <button type="submit" className="btn btn-primary" disabled={salvandoSenha}>
                                Alterar senha
                            </button>
                            {senhaSalva && <span className="field-ok">Senha alterada.</span>}
                        </div>
                    </form>
                </section>

                <section
                    className="rounded-[14px] border border-[rgba(255,106,74,0.28)] bg-linear-to-b from-[rgba(232,80,42,0.09)] to-[rgba(20,20,23,0.9)] px-[clamp(20px,4vw,32px)] pt-[clamp(22px,4vw,30px)] pb-[clamp(24px,4vw,32px)]">
                    <h2 className="text-error-soft mb-2 text-[21px] font-extrabold tracking-[-0.02em]">Excluir
                        conta</h2>
                    <p className="text-t2 max-w-[560px] text-[15px] leading-[1.55] [text-wrap:pretty]">
                        Sua conta e seu histórico são apagados de forma permanente. Os filmes, categorias e streamings
                        que você
                        cadastrou continuam no catálogo.
                    </p>
                    {/* o botão que abre a confirmação tem o mesmo respiro que o painel que ele abre */}
                    {delEstado === 'idle' && (
                        <button type="button" className="btn btn-danger-outline mt-6" onClick={pedirExclusao}>
                            Excluir minha conta
                        </button>
                    )}
                    {delEstado === 'confirm' && (
                        <div
                            className="mt-6 rounded-xl border border-[rgba(255,106,74,0.34)] bg-[#1b1416] px-6 py-[22px]">
                            <h3 className="mb-1.5 text-base font-extrabold">Tem certeza que deseja excluir sua
                                conta?</h3>
                            <p className="text-t4 mb-5 text-sm">
                                Esta ação não pode ser desfeita. Digite <strong
                                className="text-white">EXCLUIR</strong> para confirmar.
                            </p>
                            <form onSubmit={confirmarExclusao} className="flex flex-wrap items-center gap-3">
                                <label className="sr-only" htmlFor="conta-confirmar-exclusao">
                                    Digite EXCLUIR para confirmar a exclusão
                                </label>
                                <input
                                    id="conta-confirmar-exclusao"
                                    className={`input h-[50px] min-w-[180px] flex-1 px-4 text-[15px] ${delErro ? 'input-invalid' : ''}`.trim()}
                                    placeholder="EXCLUIR"
                                    value={confirmTexto}
                                    onChange={(e) => {
                                        setConfirmTexto(e.target.value);
                                        setDelErro('');
                                    }}
                                    disabled={excluindo}
                                    aria-invalid={!!delErro}
                                    aria-describedby={delErro ? 'conta-confirmar-exclusao-erro' : undefined}
                                />
                                <button type="submit" className="btn btn-danger" disabled={excluindo}>
                                    Excluir definitivamente
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={cancelarExclusao}
                                        disabled={excluindo}>
                                    Cancelar
                                </button>
                            </form>
                            {delErro && (
                                <p className="field-error" id="conta-confirmar-exclusao-erro">
                                    {delErro}
                                </p>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
