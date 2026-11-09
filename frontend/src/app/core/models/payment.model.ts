export type PaymentType = 'suscripcion_mensual' | 'herramientas_extras';
export type PaymentStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface PaymentReceipt {
  _id?: string;
  usuarioId: string | { _id: string; nombre: string; email: string; telefono?: string; estadoSuscripcion?: string };
  tipoPago: PaymentType;
  monto: number;
  cantidadHerramientasExtras: number;
  metodoPago: 'transferencia_bancaria';
  bancoOrigen: string;
  numeroComprobante: string;
  comprobanteUrl: string;
  estado: PaymentStatus;
  motivoRechazo?: string;
  verificadoPor?: string | { _id: string; nombre: string; email?: string };
  fechaVerificacion?: string;
  notas?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionStatus {
  estadoSuscripcion: 'inactiva' | 'activa' | 'vencida';
  esAdmin: boolean;
  fechaInicioSuscripcion?: string;
  fechaFinSuscripcion?: string;
  diasRestantes: number;
  limiteBase: number;
  herramientasExtras: number;
  limiteTotal: number;
  herramientasPublicadas: number;
  cuposDisponibles: number;
  puedePublicar: boolean;
  motivoBloqueo?: 'sin_suscripcion' | 'limite_alcanzado' | null;
}

export interface BankDetails {
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  titular: string;
  identificacion: string;
  emailNotificacion: string;
  precios: {
    suscripcionMensual: number;
    limiteHerramientasBase: number;
    precioHerramientaExtra: number;
  };
}

