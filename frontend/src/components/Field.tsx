// label + input/textarea + erro. Usado por Cadastro, Login, Conta e FilmeForm (~13 campos).
// ListaSimples não usa: lá o input fica lado a lado com botões, layout diferente.
type CommonProps = {
  id: string;
  label: string;
  /** Telas de auth não mostram label visível (só placeholder) — vira sr-only. */
  hideLabel?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  /** Classe extra no input, ex.: "input-auth", "input-form". */
  inputClassName?: string;
};

type InputProps = CommonProps & {
  as?: 'input';
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
};

type TextareaProps = CommonProps & {
  as: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

export function Field(props: InputProps | TextareaProps) {
  const { id, label, hideLabel, required, error, hint, inputClassName = '' } = props;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  // Os dois ids, não um ou outro. Antes o erro substituía a dica no
  // aria-describedby E na tela, então "mínimo de 8 caracteres" sumia no instante
  // em que a senha era recusada — justamente quando serve para corrigir.
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  // Compartilhado pelos dois ramos: estavam duplicados atributo a atributo, e
  // qualquer correção de acessibilidade precisava ser feita duas vezes.
  const classeInvalida = error ? 'input-invalid' : '';

  const comuns = {
    id,
    value: props.value,
    placeholder: props.placeholder,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.75">
      <label className={hideLabel ? 'sr-only' : 'field-label'} htmlFor={id}>
        {label} {required && !hideLabel && <span className="text-accent" aria-hidden="true">*</span>}
      </label>
      {props.as === 'textarea' ? (
        <textarea
          {...comuns}
          className={`textarea ${classeInvalida} ${inputClassName}`.trim()}
          onChange={(e) => props.onChange(e.target.value)}
          rows={props.rows ?? 4}
        />
      ) : (
        <input
          {...comuns}
          type={props.type ?? 'text'}
          className={`input ${classeInvalida} ${inputClassName}`.trim()}
          onChange={(e) => props.onChange(e.target.value)}
          autoComplete={props.autoComplete}
          maxLength={props.maxLength}
        />
      )}
      {/* role="alert" porque o erro costuma chegar depois do submit, com o foco já
          longe do campo: sem ele a mensagem aparece na tela sem ser anunciada, e a
          tela parece simplesmente não ter reagido ao envio. */}
      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
      {hint && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
