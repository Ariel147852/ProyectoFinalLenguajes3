export interface DatosFinancieros {
  banco?: string;
  tipoCuenta?: string;
  numeroCuenta?: string;
  titular?: string;
  telefonoDeUna?: string;
  qrDeUnaUrl?: string;
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'user' | 'admin';
  cedula?: string;
  cedulaFrontalUrl?: string;
  cedulaPosteriorUrl?: string;
  cedulaVerificada?: boolean;
  telefono?: string;
  direccionZona?: string;
  reputacionPromedio: number;
  activo?: boolean;
  datosFinancieros?: DatosFinancieros;
  estadoSuscripcion?: 'inactiva' | 'activa' | 'vencida';
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

