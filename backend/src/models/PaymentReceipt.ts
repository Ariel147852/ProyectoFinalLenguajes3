import { Schema, model, Document, Types } from 'mongoose';

export type PaymentType = 'suscripcion_mensual' | 'herramientas_extras';
export type PaymentStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface IPaymentReceipt extends Document {
  _id: Types.ObjectId;
  usuarioId: Types.ObjectId;
  tipoPago: PaymentType;
  monto: number;
  cantidadHerramientasExtras: number;
  metodoPago: 'transferencia_bancaria';
  bancoOrigen: string;
  numeroComprobante: string;
  comprobanteUrl: string;
  estado: PaymentStatus;
  motivoRechazo?: string;
  verificadoPor?: Types.ObjectId;
  fechaVerificacion?: Date;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentReceiptSchema = new Schema<IPaymentReceipt>(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es obligatorio']
    },
    tipoPago: {
      type: String,
      enum: ['suscripcion_mensual', 'herramientas_extras'],
      required: [true, 'El tipo de pago es obligatorio']
    },
    monto: {
      type: Number,
      required: [true, 'El monto es obligatorio'],
      min: [0.5, 'El monto mínimo es de $0.50']
    },
    cantidadHerramientasExtras: {
      type: Number,
      default: 0,
      min: 0
    },
    metodoPago: {
      type: String,
      enum: ['transferencia_bancaria'],
      default: 'transferencia_bancaria'
    },
    bancoOrigen: {
      type: String,
      required: [true, 'El banco de origen es obligatorio'],
      trim: true
    },
    numeroComprobante: {
      type: String,
      required: [true, 'El número de comprobante o referencia es obligatorio'],
      trim: true
    },
    comprobanteUrl: {
      type: String,
      required: [true, 'La imagen o voucher del comprobante es obligatoria'],
      trim: true
    },
    estado: {
      type: String,
      enum: ['pendiente', 'aprobado', 'rechazado'],
      default: 'pendiente'
    },
    motivoRechazo: {
      type: String,
      trim: true
    },
    verificadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    fechaVerificacion: {
      type: Date
    },
    notas: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Índices para optimizar consultas de administración y de usuarios
PaymentReceiptSchema.index({ usuarioId: 1, createdAt: -1 });
PaymentReceiptSchema.index({ estado: 1, createdAt: -1 });

export const PaymentReceipt = model<IPaymentReceipt>('PaymentReceipt', PaymentReceiptSchema);
