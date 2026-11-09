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

    // Validación de coherencia de fechas sin desfaces de zona horaria
    const validation = LoanService.validateDates(fechaInicio, fechaFin, tool.maxDiasPrestamo);
    if (!validation.valid || !validation.inicio || !validation.fin) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: validation.error || 'Fechas inválidas'
      });
      return;
    }

    const inicio = validation.inicio;
    const fin = validation.fin;

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

    const fechaLimitePago = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos exactos

    const loan = await Loan.create({
      herramientaId: tool._id,
      solicitanteId,
      propietarioId: tool.propietarioId,
      fechaInicio: inicio,
      fechaFin: fin,
      notasSolicitante: notasSolicitante || '',
      estado: 'pendiente',
      estadoPago: 'pendiente_pago',
      fechaLimitePago
    });

    const populatedLoan = await Loan.findById(loan._id)
      .populate('herramientaId', 'nombre categoria imagenes')
      .populate('propietarioId', 'nombre email telefono datosFinancieros');

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
    // Cancelar automáticamente solicitudes expiradas de más de 15 minutos
    await LoanService.cancelarPrestamosExpirados();

    const loans = await Loan.find({ solicitanteId: req.user?.id })
      .populate('herramientaId', 'nombre categoria imagenes direccionZona')
      .populate('propietarioId', 'nombre email telefono datosFinancieros')
      .sort({ createdAt: -1 });

    ApiResponse.success({ res, data: loans });
  } catch (error) {
    next(error);
  }
};

export const getMyLenderLoans = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Cancelar automáticamente solicitudes expiradas de más de 15 minutos
    await LoanService.cancelarPrestamosExpirados();

    const loans = await Loan.find({ propietarioId: req.user?.id })
      .populate('herramientaId', 'nombre categoria imagenes')
      .populate('solicitanteId', 'nombre email telefono reputacionPromedio cedula')
      .sort({ createdAt: -1 });

    ApiResponse.success({ res, data: loans });
  } catch (error) {
    next(error);
  }
};

export const subirComprobantePago = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { comprobantePagoUrl, metodoPago, numeroReferenciaPago } = req.body;
    const userId = req.user?.id;

    if (!comprobantePagoUrl) {
      ApiResponse.error({ res, statusCode: 400, message: 'La imagen del comprobante de pago es obligatoria' });
      return;
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      ApiResponse.error({ res, statusCode: 404, message: 'Préstamo no encontrado' });
      return;
    }

    if (loan.solicitanteId.toString() !== userId) {
      ApiResponse.error({ res, statusCode: 403, message: 'Solo el solicitante del préstamo puede subir el comprobante de pago' });
      return;
    }

    if (loan.estado !== 'pendiente') {
      ApiResponse.error({ res, statusCode: 400, message: `El préstamo no está pendiente de pago (estado actual: ${loan.estado})` });
      return;
    }

    // Comprobar si el reloj de 15 minutos expiró
    const ahora = new Date();
    if (loan.fechaLimitePago && loan.fechaLimitePago < ahora) {
      loan.estado = 'cancelado';
      loan.estadoPago = 'rechazado';
      await loan.save();

      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'El tiempo límite de 15 minutos para realizar el pago ha expirado. El producto ha sido liberado.'
      });
      return;
    }

    loan.comprobantePagoUrl = comprobantePagoUrl.trim();
    loan.metodoPago = metodoPago === 'transferencia' ? 'transferencia' : 'deuna';
    loan.numeroReferenciaPago = numeroReferenciaPago ? numeroReferenciaPago.trim() : '';
    loan.fechaPagoSubido = ahora;
    loan.estadoPago = 'pendiente_validacion';
    await loan.save();

    ApiResponse.success({
      res,
      message: 'Comprobante de pago subido exitosamente. En espera de que el propietario valide el pago.',
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

export const validarPagoPrestamo = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { accion, motivoRechazo } = req.body; // 'validar' | 'rechazar'
    const userId = req.user?.id;

    if (!['validar', 'rechazar'].includes(accion)) {
      ApiResponse.error({ res, statusCode: 400, message: 'La acción debe ser "validar" o "rechazar"' });
      return;
    }

    const loan = await Loan.findById(id);
    if (!loan) {
      ApiResponse.error({ res, statusCode: 404, message: 'Préstamo no encontrado' });
      return;
    }

    if (loan.propietarioId.toString() !== userId) {
      ApiResponse.error({ res, statusCode: 403, message: 'Solo el propietario de la herramienta puede validar el pago' });
      return;
    }

    if (accion === 'validar') {
      loan.estadoPago = 'validado';
      loan.estado = 'aprobado';
      loan.fechaPagoValidado = new Date();
    } else {
      loan.estadoPago = 'rechazado';
      loan.estado = 'rechazado';
      if (motivoRechazo) {
        loan.notasPropietario = motivoRechazo.trim();
      }
    }

    await loan.save();

    ApiResponse.success({
      res,
      message: accion === 'validar' ? 'Pago validado exitosamente. Préstamo confirmado.' : 'Pago rechazado. Herramienta liberada.',
      data: loan
    });
  } catch (error) {
    next(error);
  }
};

