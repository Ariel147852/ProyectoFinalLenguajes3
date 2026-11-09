import { Schema, model, Document, Types } from 'mongoose';

export type LoanStatus =
  | 'pendiente'
  | 'aprobado'
  | 'rechazado'
  | 'en_curso'
  | 'devuelto'
  | 'cancelado';

export type LoanPaymentStatus =
  | 'pendiente_pago'
  | 'pendiente_validacion'
  | 'validado'
  | 'rechazado';

export interface ILoan extends Document {
  _id: Types.ObjectId;
  herramientaId: Types.ObjectId;
  solicitanteId: Types.ObjectId;
  propietarioId: Types.ObjectId;
  fechaInicio: Date;
  fechaFin: Date;
  estado: LoanStatus;
  estadoPago: LoanPaymentStatus;
  fechaLimitePago?: Date;
  comprobantePagoUrl?: string;
  metodoPago?: 'deuna' | 'transferencia';
  numeroReferenciaPago?: string;
  fechaPagoSubido?: Date;
  fechaPagoValidado?: Date;
  fechaEntregaReal?: Date;
  fechaDevolucionReal?: Date;
  notasSolicitante?: string;
  notasPropietario?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    herramientaId: {
      type: Schema.Types.ObjectId,
      ref: 'Tool',
      required: [true, 'La herramienta es obligatoria']
    },
    solicitanteId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El solicitante es obligatorio']
    },
    propietarioId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El propietario es obligatorio']
    },
    fechaInicio: {
      type: Date,
      required: [true, 'La fecha de inicio es obligatoria']
    },
    fechaFin: {
      type: Date,
      required: [true, 'La fecha de fin es obligatoria']
    },
    estado: {
      type: String,
      enum: {
        values: ['pendiente', 'aprobado', 'rechazado', 'en_curso', 'devuelto', 'cancelado'],
        message: '{VALUE} no es un estado válido de préstamo'
      },
      default: 'pendiente'
    },
    estadoPago: {
      type: String,
      enum: {
        values: ['pendiente_pago', 'pendiente_validacion', 'validado', 'rechazado'],
        message: '{VALUE} no es un estado de pago válido'
      },
      default: 'pendiente_pago'
    },
    fechaLimitePago: {
      type: Date
    },
    comprobantePagoUrl: {
      type: String,
      default: ''
    },
    metodoPago: {
      type: String,
      enum: ['deuna', 'transferencia'],
      default: 'deuna'
    },
    numeroReferenciaPago: {
      type: String,
      default: ''
    },
    fechaPagoSubido: {
      type: Date
    },
    fechaPagoValidado: {
      type: Date
    },
    fechaEntregaReal: {
      type: Date
    },
    fechaDevolucionReal: {
      type: Date
    },
    notasSolicitante: {
      type: String,
      trim: true
    },
    notasPropietario: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

LoanSchema.index({ herramientaId: 1, estado: 1 });
LoanSchema.index({ solicitanteId: 1 });
LoanSchema.index({ propietarioId: 1 });

export const Loan = model<ILoan>('Loan', LoanSchema);

