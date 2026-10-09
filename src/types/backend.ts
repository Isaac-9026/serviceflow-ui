export type Rol = 'ADMIN' | 'COORDINADOR' | 'TECNICO';

export interface Usuario {
  id: number;
  nombre: string;
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
  descripcion: string;
}

export interface Solicitud {
  id: number;
  clienteId: number;
  clienteNombre: string;
  categoriaId: number;
  categoriaNombre: string;
  descripcion: string;
  direccion: string;
  estado: 'PENDIENTE' | 'COTIZADA' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  creadoEn: string;
  actualizadoEn: string;
}

export interface Cotizacion {
  id: number;
  solicitudId: number;
  descripcion: string;
  monto: number;
  validoHasta: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  creadoEn: string;
  actualizadoEn: string;
}

export interface Orden {
  id: number;
  solicitudId: number;
  cotizacionId: number;
  descripcion: string;
  fechaProgramada?: string;
  tecnicoAsignado?: Usuario;
  estado: 'ASIGNADA' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';
  completadoEn?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Auditoria {
  id: string;
  tipoEntidad: string;
  entidadId: string;
  accion: string;
  cambios: string;
  usuario: string;
  timestamp: string;
}
