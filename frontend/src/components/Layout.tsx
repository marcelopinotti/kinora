import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

/**
 * Moldura das telas internas. Antes cada página repetia este wrapper e a TopBar —
 * nove ocorrências em cinco arquivos, três delas dentro do mesmo componente para
 * cobrir os estados de carregando/erro/conteúdo.
 *
 * Além de apagar a repetição, isto garante que a barra não desmonta e remonta ao
 * alternar entre esses estados.
 *
 * Login e Cadastro ficam de fora: usam o AuthShell, que não tem TopBar.
 */
export function Layout() {
  return (
    <div className="relative min-h-screen pb-17.5">
      <TopBar />
      <Outlet />
    </div>
  );
}
