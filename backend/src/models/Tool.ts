import { Schema, model, Document, Types } from 'mongoose';

export type ToolCategory =
  | 'electricas'
  | 'manuales'
  | 'jardineria'
  | 'fontaneria'
  | 'pintura'
  | 'construccion'
  | 'otros';

export type ToolCondition = 'excelente' | 'bueno' | 'regular';

export interface ITool extends Document {
  _id: Types.ObjectId;
  propietarioId: Types.ObjectId;
  nombre: string;
  descripcion: string;
  categoria: ToolCategory;
  estadoFisico: ToolCondition;
  imagenes: string[];
  ubicacion: {
    type: 'Point';
    coordinates: [number, number]; // [longitud, latitud]
  };
  direccionZona: string;
  activa: boolean;
  maxDiasPrestamo: number;
  createdAt: Date;
  updatedAt: Date;
}

const ToolSchema = new Schema<ITool>(
  {
    propietarioId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El propietario es obligatorio']
    },
    nombre: {
      type: String,
      required: [true, 'El nombre de la herramienta es obligatorio'],
      trim: true
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true
    },
    categoria: {
      type: String,
      enum: {
        values: ['electricas', 'manuales', 'jardineria', 'fontaneria', 'pintura', 'construccion', 'otros'],
        message: '{VALUE} no es una categoría válida'
      },
      required: [true, 'La categoría es obligatoria']
    },
    estadoFisico: {
      type: String,
      enum: ['excelente', 'bueno', 'regular'],
      default: 'bueno'
    },
    imagenes: {
      type: [String],
      default: []
    },
    ubicacion: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitud, latitud]
        required: [true, 'Las coordenadas [longitud, latitud] son obligatorias'],
        validate: {
          validator: (coords: number[]) => coords.length === 2,
          message: 'Las coordenadas deben contener exactamente [longitud, latitud]'
        }
      }
    },
    direccionZona: {
      type: String,
      required: [true, 'La zona o barrio de referencia es obligatoria'],
      trim: true
    },
    activa: {
      type: Boolean,
      default: true
    },
    maxDiasPrestamo: {
      type: Number,
      default: 7,
      min: [1, 'El préstamo mínimo es de 1 día'],
      max: [30, 'El préstamo máximo no puede superar 30 días']
    }
  },
  {
    timestamps: true
  }
);

// Índice geoespacial 2dsphere para consultas $near / $geoNear
ToolSchema.index({ ubicacion: '2dsphere' });
ToolSchema.index({ categoria: 1, activa: 1 });
ToolSchema.index({ nombre: 'text', descripcion: 'text' });

export const Tool = model<ITool>('Tool', ToolSchema);

