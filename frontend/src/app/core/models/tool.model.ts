import { User } from './user.model';

export type ToolCategory =
  | 'electricas'
  | 'manuales'
  | 'jardineria'
  | 'fontaneria'
  | 'pintura'
  | 'construccion'
  | 'otros';

export interface Tool {
  _id: string;
  propietarioId: User | string;
  nombre: string;
  descripcion: string;
  categoria: ToolCategory;
  estadoFisico: 'excelente' | 'bueno' | 'regular';
  imagenes: string[];
  ubicacion: {
    type: 'Point';
    coordinates: [number, number]; // [longitud, latitud]
  };
  direccionZona: string;
  activa: boolean;
  maxDiasPrestamo: number;
  createdAt?: string;
  updatedAt?: string;
}

