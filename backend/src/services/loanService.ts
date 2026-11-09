import { Loan } from '../models/Loan';

export class LoanService {
  /**
   * Convierte un string "YYYY-MM-DD" o Date a un objeto Date local a medianoche,
   * evitando desfaces por zona horaria UTC.
   */
  static parseDate(dateInput: string | Date): Date {
    if (typeof dateInput === 'string') {
      const cleanStr = dateInput.split('T')[0];
      const [year, month, day] = cleanStr.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month - 1, day, 0, 0, 0, 0);
      }
    }
    const d = new Date(dateInput);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

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
  static validateDates(
    inicioInput: Date | string,
    finInput: Date | string,
    maxDias: number = 30
  ): { valid: boolean; error?: string; inicio?: Date; fin?: Date } {
    const inicio = this.parseDate(inicioInput);
    const fin = this.parseDate(finInput);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return { valid: false, error: 'Las fechas proporcionadas no son válidas' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Comparamos timestamps a medianoche local:
    if (inicio.getTime() < today.getTime()) {
      const dia = String(today.getDate()).padStart(2, '0');
      const mes = String(today.getMonth() + 1).padStart(2, '0');
      const anio = today.getFullYear();
      return {
        valid: false,
        error: `La fecha de inicio no puede ser anterior al día de hoy (${dia}/${mes}/${anio})`
      };
    }

    if (fin.getTime() < inicio.getTime()) {
      return { valid: false, error: 'La fecha de devolución no puede ser anterior a la fecha de inicio' };
    }

    const diffTime = fin.getTime() - inicio.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > maxDias) {
      return { valid: false, error: `El préstamo excede el máximo permitido de ${maxDias} días (seleccionaste ${diffDays} días)` };
    }

    return { valid: true, inicio, fin };
  }
}
