import { Schema, model, Document, Types } from 'mongoose';

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  usuarioId: Types.ObjectId;
  nombreUsuario: string;
  rolUsuario: 'user' | 'admin';
  mensaje: string;
  sala: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    nombreUsuario: {
      type: String,
      required: true,
      trim: true
    },
    rolUsuario: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    mensaje: {
      type: String,
      required: [true, 'El mensaje no puede estar vacío'],
      trim: true,
      maxlength: [500, 'El mensaje no puede superar 500 caracteres']
    },
    sala: {
      type: String,
      default: 'comunidad_general',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

ChatMessageSchema.index({ sala: 1, createdAt: -1 });

export const ChatMessage = model<IChatMessage>('ChatMessage', ChatMessageSchema);
