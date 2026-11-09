import { Tool } from './tool.model';
import { User } from './user.model';

export type LoanStatus =
  | 'pendiente'
  | 'aprobado'
  | 'rechazado'
  | 'en_curso'
  | 'devuelto'
  | 'cancelado';

export interface Loan {
  _id: string;
  herramientaId: Tool | string;
  solicitanteId: User | string;
  propietarioId: User | string;
  fechaInicio: string;
  fechaFin: string;
  estado: LoanStatus;
  fechaEntregaReal?: string;
  fechaDevolucionReal?: string;
  notasSolicitante?: string;
  notasPropietario?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedDateRange {
  inicio: string;
  fin: string;
  estado: string;
}

export interface ToolAvailabilityResponse {
  herramientaId: string;
  fechasOcupadas: BlockedDateRange[];
}

