import {ListaSimples} from '../components/ListaSimples';
import {TopBar} from '../components/TopBar';
import {api} from '../api';

export function Gerenciar() {
    return (
        <div className="relative min-h-screen pb-17.5">
            <TopBar/>
            <div
                className="px-pad mx-auto flex w-full max-w-[calc(1180px+var(--spacing-pad)*2)] flex-col gap-6.5 pt-4.5">
                <div>
                    <p className="eyebrow">Gerenciar</p>
                    <h1 className="text-[clamp(26px,5vw,34px)] font-extrabold tracking-[-0.02em]">Categorias e
                        streamings</h1>
                    <p className="text-t3 mt-2 max-w-155 text-[15px] text-pretty">
                        São as listas usadas no cadastro de filmes. Qualquer pessoa logada pode criar, renomear e
                        excluir.
                    </p>
                </div>
                {/* min() evita o overflow que minmax(420px,1fr) causa abaixo de 420px */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-start gap-[22px]">
                    <ListaSimples
                        titulo="Categorias"
                        subtitulo="Classificam os filmes no catálogo."
                        placeholder="Nome da categoria"
                        entidade="categoria"
                        fetchItens={api.categorias}
                        criarItem={api.criarCategoria}
                        atualizarItem={api.atualizarCategoria}
                        excluirItem={api.excluirCategoria}
                    />
                    <ListaSimples
                        titulo="Streamings"
                        subtitulo="Onde o filme está disponível."
                        placeholder="Nome do streaming"
                        entidade="streaming"
                        fetchItens={api.streamings}
                        criarItem={api.criarStreaming}
                        atualizarItem={api.atualizarStreaming}
                        excluirItem={api.excluirStreaming}
                    />
                </div>
            </div>
        </div>
    );
}
