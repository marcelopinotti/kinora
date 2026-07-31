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
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-[7px]">
      <label className={hideLabel ? 'sr-only' : 'field-label'} htmlFor={id}>
        {label} {required && !hideLabel && <span className="text-accent" aria-hidden="true">*</span>}
      </label>
      {props.as === 'textarea' ? (
        <textarea
          id={id}
          className={`textarea ${error ? 'input-invalid' : ''} ${inputClassName}`.trim()}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows ?? 4}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      ) : (
        <input
          id={id}
          type={props.type ?? 'text'}
          className={`input ${error ? 'input-invalid' : ''} ${inputClassName}`.trim()}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          maxLength={props.maxLength}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      )}
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
