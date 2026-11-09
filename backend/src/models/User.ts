import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Types.ObjectId;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: 'user' | 'admin';
  telefono?: string;
  direccionZona?: string;
  reputacionPromedio: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Por favor ingrese un correo electrónico válido']
    },
    passwordHash: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      select: false
    },
    rol: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    telefono: {
      type: String,
      trim: true
    },
    direccionZona: {
      type: String,
      trim: true,
      default: 'Comunidad Central'
    },
    reputacionPromedio: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = model<IUser>('User', UserSchema);

