/** Modelo de datos de la base de vehículos de Camel (Feature 2). */

export const ESTADOS = [
  { value: 'en_dubai', label: 'En Dubái' },
  { value: 'en_transito', label: 'En tránsito' },
  { value: 'en_espana', label: 'En España' },
  { value: 'vendido', label: 'Vendido' },
] as const;

export type EstadoVehiculo = (typeof ESTADOS)[number]['value'];

export function etiquetaEstado(estado: string): string {
  return ESTADOS.find((e) => e.value === estado)?.label ?? estado;
}

/** Opciones de ordenamiento del listado (campo + dirección en un solo valor). */
export const ORDENES = [
  { value: 'reciente', label: 'Más recientes' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'anio_desc', label: 'Año: más nuevo' },
  { value: 'anio_asc', label: 'Año: más viejo' },
  { value: 'km_asc', label: 'Km: menos primero' },
  { value: 'km_desc', label: 'Km: más primero' },
  { value: 'marca', label: 'Marca (A–Z)' },
  { value: 'mulkiya', label: 'Con mulkiya primero' },
] as const;

/** Filtros y orden del listado de vehículos. */
export interface FiltrosVehiculos {
  q?: string;
  marca?: string;
  estado?: string;
  mulkiya?: string; // 'si' | 'no'
  orden?: string;
}

/** Una foto del vehículo guardada en Supabase Storage. */
export interface Foto {
  /** Ruta dentro del bucket (para poder borrarla). */
  path: string;
  /** URL pública para mostrarla. */
  url: string;
}

/**
 * Un documento del vehículo (PDF, imagen, etc.) en el bucket PRIVADO `documentos`.
 * No guardamos URL: el bucket es privado, la URL firmada se genera al mostrarlo.
 */
export interface Documento {
  /** Ruta dentro del bucket privado (para firmar/borrar). */
  path: string;
  /** Nombre original del archivo, para mostrar en la lista. */
  nombre: string;
  /** MIME type, si se conoce. */
  tipo?: string;
}

export interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  anio: number | null;
  km: number | null;
  bastidor: string | null;
  /** ¿Tiene su mulkiya (tarjeta de propiedad UAE)? (columna DB: mulquilla) */
  mulquilla: boolean;
  color: string | null;
  precio_compra: number | null;
  estado: EstadoVehiculo;
  notas: string | null;
  fotos: Foto[];
  documentos: Documento[];
  /** Cliente asociado (dueño/comprador), opcional. El nombre se resuelve aparte. */
  cliente_id: string | null;
  creada_en: string;
  actualizada_en: string;
}
