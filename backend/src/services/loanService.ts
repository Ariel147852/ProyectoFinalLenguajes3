import { Loan } from '../models/Loan';

export class LoanService {
  /**
   * Verifica si existe un solapamiento con reservas confirmadas o en curso.
   * Regla de colisión de intervalos:
   * (F_inicio_nueva <= F_fin_existente) AND (F_fin_nueva >= F_inicio_existente)
   */
  static async checkOverlap(
    herramientaId: string,
    fechaInicio: Date,
    fechaFin: Date,
    excludeLoanId?: string
  ): Promise<boolean> {
    const query: any = {
      herramientaId,
      estado: { $in: ['aprobado', 'en_curso'] },
      $and: [
        { fechaInicio: { $lte: new Date(fechaFin) } },
        { fechaFin: { $gte: new Date(fechaInicio) } }
      ]
    };

    if (excludeLoanId) {
      query._id = { $ne: excludeLoanId };
    }

    const overlap = await Loan.findOne(query);
    return overlap !== null;
  }

  /**
   * Valida que las fechas de la reserva sean coherentes
   */
  static validateDates(inicio: Date, fin: Date, maxDias: number = 30): { valid: boolean; error?: string } {
    const now = new Date();
    // Establecer a inicio de día para permitir reservas para hoy
    now.setHours(0, 0, 0, 0);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return { valid: false, error: 'Las fechas proporcionadas no son válidas' };
    }

    if (inicio < now) {
      return { valid: false, error: 'La fecha de inicio no puede ser anterior al día de hoy' };
    }

    if (fin < inicio) {
      return { valid: false, error: 'La fecha de fin no puede ser anterior a la fecha de inicio' };
    }

    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > maxDias) {
      return { valid: false, error: `El préstamo excede el máximo permitido de ${maxDias} días` };
    }

    return { valid: true };
  }
}

