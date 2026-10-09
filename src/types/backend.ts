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
