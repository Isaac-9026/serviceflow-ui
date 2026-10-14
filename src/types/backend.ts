export type Rol = 'ADMIN' | 'COORDINADOR' | 'TECNICO';

export interface Usuario {
  id: number;
  nombre: string;
  apellido?: string;
  email: string;
  rol: Rol;
  activo: boolean;
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  activo: boolean;
}

export type EstadoSolicitud = 'RECIBIDA' | 'COTIZADA' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';

export interface Solicitud {
  id: number;
  clienteId: number;
  clienteNombre: string;
  categoriaId: number;
  categoriaNombre: string;
  descripcion: string;
  direccion: string;
  estado: EstadoSolicitud;
  creadoEn: string;
  actualizadoEn: string;
}

export type EstadoCotizacion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';

export interface Cotizacion {
  id: number;
  solicitudId: number;
  descripcion: string;
  monto: number;
  validoHasta: string;
  estado: EstadoCotizacion;
  creadoEn: string;
  actualizadoEn: string;
}

export type EstadoOrden = 'CREADA' | 'EN_PROGRESO' | 'PENDIENTE_VERIFICACION' | 'COMPLETADA' | 'CANCELADA';

export type TipoEvidencia = 'FOTO' | 'NOTA';

export interface Evidencia {
  id: number;
  ordenId: number;
  tipo: TipoEvidencia;
  rutaArchivo?: string;
  nota: string;
  creadoEn: string;
}

export interface Orden {
  id: number;
  solicitudId: number;
  cotizacionId?: number | null;
  descripcion: string;
  fechaProgramada?: string;
  tecnicoAsignado?: Usuario;
  estado: EstadoOrden;
  completadoEn?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Auditoria {
  id: number;
  usuarioId?: number | null;
  usuarioNombre?: string | null;
  usuarioEmail?: string | null;
  accion: string;
  tipoEntidad: string;
  entidadId: number;
  detalles: string;
  creadoEn: string;
}
