import { TIPOS_CLIENTE, type Cliente } from '@/lib/clientes/types';
import { SubmitButton } from './form-buttons';

const inputCls =
  'w-full rounded-c-md border border-[var(--w10)] bg-[var(--inputDeep)] px-3 py-2.5 text-sm text-ink-1 outline-none transition-colors placeholder:text-ink-3 focus:border-accent';

function Campo({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}

/** Formulario compartido de alta/edición de cliente. */
export function ClienteForm({
  action,
  cliente,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  cliente?: Cliente;
  submitLabel: string;
}) {
  const c = cliente;
  return (
    <form action={action} className="glass-float rounded-c-xl p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Tipo">
          <select name="tipo" defaultValue={c?.tipo ?? 'business'} className={inputCls}>
            {TIPOS_CLIENTE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Nombre / Razón social *">
          <input name="nombre" required defaultValue={c?.nombre ?? ''} className={inputCls} placeholder="FUTURE 24 SL" />
        </Campo>
        <Campo label="CIF / NIF / Tax ID">
          <input name="cif" defaultValue={c?.cif ?? ''} className={inputCls} placeholder="B75638452" />
        </Campo>
        <Campo label="Email">
          <input name="email" type="email" defaultValue={c?.email ?? ''} className={inputCls} placeholder="cliente@empresa.com" />
        </Campo>
        <Campo label="Teléfono">
          <input name="telefono" defaultValue={c?.telefono ?? ''} className={inputCls} placeholder="+34 600 000 000" />
        </Campo>
      </div>

      <Campo label="Dirección" className="mt-4">
        <textarea
          name="direccion"
          defaultValue={c?.direccion ?? ''}
          className={`${inputCls} min-h-20 resize-y`}
          placeholder={'CALLE BOTIGUERS, NUM 3\nPLANTA 2, PUERTA B\n46980 PATERNA - (VALENCIA)'}
        />
      </Campo>

      <Campo label="Notas" className="mt-4">
        <textarea name="notas" defaultValue={c?.notas ?? ''} className={`${inputCls} min-h-16 resize-y`} placeholder="Observaciones internas…" />
      </Campo>

      <div className="mt-6">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
