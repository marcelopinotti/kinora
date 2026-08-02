import { useState } from 'react';
import { Field } from '../../components/Field';
import { URL_HTTP } from './validarFilme';

type PosterFieldProps = {
  value: string;
  onChange: (v: string) => void;
  erro?: string;
};

/**
 * Campo de URL do pôster com preview.
 *
 * `quebrado` mora aqui porque só interessa a este campo: uma imagem só se revela
 * inválida ao terminar de carregar, e o estado precisa zerar a cada URL nova. No
 * componente pai isso era mais um useState e mais três ramos de render.
 */
export function PosterField({ value, onChange, erro }: Readonly<PosterFieldProps>) {
  const [quebrado, setQuebrado] = useState(false);

  // Derivado, não guardado: preview só com URL http(s) plausível.
  const mostrarPreview = URL_HTTP.test(value.trim());

  return (
    <div className="col-span-full">
      <Field
        id="filme-poster"
        label="Imagem do pôster"
        value={value}
        onChange={(v) => {
          setQuebrado(false);
          onChange(v);
        }}
        placeholder="https://…"
        inputClassName="input-form"
        error={erro}
      />
      {/* preview ao vivo: mesma proporção do card, em miniatura */}
      {mostrarPreview && quebrado && (
        <p className="text-error mt-3 text-[13px] font-semibold">Não foi possível carregar essa imagem.</p>
      )}
      {mostrarPreview && !quebrado && (
        <div className="border-border-2 bg-surface-2 mt-3 aspect-2/3 w-33 overflow-hidden rounded-[10px] border">
          <img
            className="block size-full object-cover"
            src={value.trim()}
            alt="Pré-visualização do pôster"
            onError={() => setQuebrado(true)}
          />
        </div>
      )}
    </div>
  );
}
