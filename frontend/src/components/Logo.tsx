// Marca da Kinora. .logo-mark / .logo-word ficam no CSS: são clip-path e
// gradiente em texto, que não viram utilitário legível.
// O tamanho virou prop porque o pai não estiliza mais o filho pela cascata:
// 'sm' na topbar (32px), 'lg' nas telas de auth (40px).
export function Logo({ size = 'sm' }: Readonly<{ size?: 'sm' | 'lg' }>) {
  const lg = size === 'lg';
  return (
    <>
      <span className={`logo-mark ${lg ? 'size-10 rounded-xl' : 'size-8'}`}>
        <i className={lg ? 'h-3.5 w-3' : 'h-2.75 w-2.5'} />
      </span>
      <span className={`logo-word ${lg ? 'text-[32px]' : 'text-2xl'}`}>KINORA</span>
    </>
  );
}
