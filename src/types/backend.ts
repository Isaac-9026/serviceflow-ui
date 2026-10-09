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
  cliente: Cliente;
  categoria: Categoria;
  descripcion: string;
  estado: 'PENDIENTE' | 'COTIZADA' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';
  fechaCreacion: string;
}

export interface Cotizacion {
  id: number;
  solicitudId: number;
  monto: number;
  detalles: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fechaCreacion: string;
}

export interface Orden {
  id: number;
  cotizacionId: number;
  tecnicoAsignado?: Usuario;
  estado: 'ASIGNADA' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA';
  evidencias: string;
  notasTecnicas: string;
  fechaCreacion: string;
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
