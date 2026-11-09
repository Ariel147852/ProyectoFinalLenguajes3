import { Response, NextFunction } from 'express';
import { Loan } from '../models/Loan';
import { Tool } from '../models/Tool';
import { LoanService } from '../services/loanService';
import { ApiResponse } from '../views/apiResponse';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const requestLoan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { herramientaId, fechaInicio, fechaFin, notasSolicitante } = req.body;
    const solicitanteId = req.user?.id;

    if (!herramientaId || !fechaInicio || !fechaFin) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'La herramienta y las fechas de inicio y fin son obligatorias'
      });
      return;
    }

    const tool = await Tool.findById(herramientaId);
    if (!tool || !tool.activa) {
      ApiResponse.error({
        res,
        statusCode: 404,
        message: 'La herramienta seleccionada no está disponible o no existe'
      });
      return;
    }

    // Regla de Negocio: No se puede prestar una herramienta a uno mismo
    if (tool.propietarioId.toString() === solicitanteId) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'No puedes solicitar el préstamo de tu propia herramienta'
      });
      return;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // Validación de coherencia de fechas
    const validation = LoanService.validateDates(inicio, fin, tool.maxDiasPrestamo);
    if (!validation.valid) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: validation.error || 'Fechas inválidas'
      });
      return;
    }

    // Regla de Negocio Crítica: Anti-solapamiento de fechas
    const hasOverlap = await LoanService.checkOverlap(herramientaId, inicio, fin);
    if (hasOverlap) {
      ApiResponse.error({
        res,
        statusCode: 409,
        message: 'La herramienta ya se encuentra reservada en el rango de fechas seleccionado'
      });
      return;
    }

    const loan = await Loan.create({
      herramientaId: tool._id,
      solicitanteId,
      propietarioId: tool.propietarioId,
      fechaInicio: inicio,
      fechaFin: fin,
      notasSolicitante: notasSolicitante || '',
      estado: 'pendiente'
    });

    const populatedLoan = await Loan.findById(loan._id)
      .populate('herramientaId', 'nombre categoria imagenes')
      .populate('propietarioId', 'nombre email telefono');

    ApiResponse.created({
      res,
      message: 'Solicitud de préstamo enviada exitosamente al propietario',
      data: populatedLoan
    });
  } catch (error) {
    next(error);
  }
};

export const respondToLoan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { accion, notasPropietario } = req.body; // 'aprobar' | 'rechazar'

    if (!['aprobar', 'rechazar'].includes(accion)) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: "La acción debe ser 'aprobar' o 'rechazar'"
      });
      return;
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      ApiResponse.error({ res, statusCode: 404, message: 'Solicitud de préstamo no encontrada' });
      return;
    }

    // Solo el propietario puede responder
    if (loan.propietarioId.toString() !== req.user?.id) {
      ApiResponse.error({ res, statusCode: 403, message: 'Solo el propietario puede gestionar esta solicitud' });
      return;
    }

    if (loan.estado !== 'pendiente') {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: `No se puede modificar una solicitud en estado: ${loan.estado}`
      });
      return;
    }

    if (accion === 'aprobar') {
      // Revalidación anti-carrera al aprobar
      const hasOverlap = await LoanService.checkOverlap(
        loan.herramientaId.toString(),
        loan.fechaInicio,
        loan.fechaFin,
        loan._id.toString()
      );

      if (hasOverlap) {
        ApiResponse.error({
          res,
          statusCode: 409,
          message: 'Existe un conflicto con otro préstamo previamente confirmado en estas fechas'
        });
        return;
      }

      loan.estado = 'aprobado';
    } else {
      loan.estado = 'rechazado';
    }

    if (notasPropietario) {
      loan.notasPropietario = notasPropietario;
    }

    await loan.save();

    ApiResponse.success({
      res,
      message: `Préstamo ${loan.estado === 'aprobado' ? 'aprobado' : 'rechazado'} con éxito`,
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

export const deliverLoan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      ApiResponse.error({ res, statusCode: 404, message: 'Préstamo no encontrado' });
      return;
    }

    if (loan.propietarioId.toString() !== req.user?.id) {
      ApiResponse.error({ res, statusCode: 403, message: 'Solo el propietario puede registrar la entrega' });
      return;
    }

    if (loan.estado !== 'aprobado') {
      ApiResponse.error({ res, statusCode: 400, message: 'El préstamo debe estar aprobado para registrar la entrega' });
      return;
    }

    loan.estado = 'en_curso';
    loan.fechaEntregaReal = new Date();
    await loan.save();

    ApiResponse.success({
      res,
      message: 'Entrega registrada exitosamente. Préstamo ahora en curso',
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

export const returnLoan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const loan = await Loan.findById(id);

    if (!loan) {
      ApiResponse.error({ res, statusCode: 404, message: 'Préstamo no encontrado' });
      return;
    }

    if (loan.propietarioId.toString() !== req.user?.id) {
      ApiResponse.error({ res, statusCode: 403, message: 'Solo el propietario puede registrar la devolución' });
      return;
    }

    if (loan.estado !== 'en_curso') {
      ApiResponse.error({ res, statusCode: 400, message: 'El préstamo debe estar en curso para registrar la devolución' });
      return;
    }

    loan.estado = 'devuelto';
    loan.fechaDevolucionReal = new Date();
    await loan.save();

    ApiResponse.success({
      res,
      message: 'Devolución registrada exitosamente. Herramienta devuelta',
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBorrowerLoans = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loans = await Loan.find({ solicitanteId: req.user?.id })
      .populate('herramientaId', 'nombre categoria imagenes direccionZona')
      .populate('propietarioId', 'nombre email telefono')
      .sort({ createdAt: -1 });

    ApiResponse.success({ res, data: loans });
  } catch (error) {
    next(error);
  }
};

export const getMyLenderLoans = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loans = await Loan.find({ propietarioId: req.user?.id })
      .populate('herramientaId', 'nombre categoria imagenes')
      .populate('solicitanteId', 'nombre email telefono reputacionPromedio')
      .sort({ createdAt: -1 });

    ApiResponse.success({ res, data: loans });
  } catch (error) {
    next(error);
  }
};

