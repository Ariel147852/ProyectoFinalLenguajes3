export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'user' | 'admin';
  telefono?: string;
  direccionZona?: string;
  reputacionPromedio: number;
  activo?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

