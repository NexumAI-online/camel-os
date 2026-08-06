import { ESTADOS, type Vehiculo } from '@/lib/vehiculos/types';
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

/**
 * Formulario compartido de alta/edición de vehículo. Recibe la Server Action
 * ya vinculada (crear, o actualizar.bind(id)) y, opcionalmente, el vehículo a editar.
 */
export function VehiculoForm({
  action,
  vehiculo,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  vehiculo?: Vehiculo;
  submitLabel: string;
}) {
  const v = vehiculo;
  return (
    <form action={action} className="glass-float rounded-c-xl p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo label="Marca *">
          <input name="marca" required defaultValue={v?.marca ?? ''} className={inputCls} placeholder="Toyota" />
        </Campo>
        <Campo label="Modelo *">
          <input name="modelo" required defaultValue={v?.modelo ?? ''} className={inputCls} placeholder="Land Cruiser" />
        </Campo>
        <Campo label="Año">
          <input name="anio" inputMode="numeric" defaultValue={v?.anio ?? ''} className={inputCls} placeholder="2022" />
        </Campo>
        <Campo label="Kilómetros">
          <input name="km" inputMode="numeric" defaultValue={v?.km ?? ''} className={inputCls} placeholder="45000" />
        </Campo>
        <Campo label="Bastidor (VIN)">
          <input name="bastidor" defaultValue={v?.bastidor ?? ''} className={inputCls} placeholder="JT1234567890" />
        </Campo>
        <Campo label="Mulquilla">
          <input name="mulquilla" defaultValue={v?.mulquilla ?? ''} className={inputCls} placeholder="Ref. propiedad UAE" />
        </Campo>
        <Campo label="Color">
          <input name="color" defaultValue={v?.color ?? ''} className={inputCls} placeholder="Blanco" />
        </Campo>
        <Campo label="Precio de compra (AED)">
          <input name="precio_compra" inputMode="numeric" defaultValue={v?.precio_compra ?? ''} className={inputCls} placeholder="150000" />
        </Campo>
        <Campo label="Estado">
          <select name="estado" defaultValue={v?.estado ?? 'en_dubai'} className={inputCls}>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo label="Notas" className="mt-4">
        <textarea name="notas" defaultValue={v?.notas ?? ''} className={`${inputCls} min-h-24 resize-y`} placeholder="Observaciones, reparaciones, specs…" />
      </Campo>

      <Campo label="Agregar fotos (podés elegir varias)" className="mt-4">
        <input
          type="file"
          name="fotos"
          multiple
          accept="image/*"
          className="block w-full text-sm text-ink-2 file:mr-3 file:cursor-pointer file:rounded-c-md file:border-0 file:bg-accent/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accent-hi hover:file:bg-accent/25"
        />
      </Campo>

      <div className="mt-6 flex items-center gap-3">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
