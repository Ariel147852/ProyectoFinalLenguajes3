import { Request, Response, NextFunction } from 'express';
import { PaymentReceipt } from '../models/PaymentReceipt';
import { User } from '../models/User';
import { Tool } from '../models/Tool';
import { ApiResponse } from '../views/apiResponse';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const DATOS_BANCARIOS = {
  banco: 'Banco Pichincha',
  tipoCuenta: 'Cuenta de Ahorros',
  numeroCuenta: '2205849301',
  titular: 'ToolLibrary - Biblioteca Comunitaria de Herramientas',
  identificacion: '1792345678001',
  emailNotificacion: 'pagos@toollibrary.org',
  precios: {
    suscripcionMensual: 5.0,
    limiteHerramientasBase: 5,
    precioHerramientaExtra: 0.5
  }
};

export const getDatosBancarios = async (req: Request, res: Response): Promise<void> => {
  ApiResponse.success({
    res,
    message: 'Datos bancarios y tarifas del sistema',
    data: DATOS_BANCARIOS
  });
};

export const getMiEstadoSuscripcion = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);

    if (!user) {
      ApiResponse.error({ res, statusCode: 404, message: 'Usuario no encontrado' });
      return;
    }

    const isAdmin = user.rol === 'admin';

    // Verificar si la fecha de suscripción ya expiró
    const now = new Date();
    if (user.estadoSuscripcion === 'activa' && user.fechaFinSuscripcion && user.fechaFinSuscripcion < now) {
      user.estadoSuscripcion = 'vencida';
      await user.save();
    }

    // Contar cuántas herramientas activas tiene publicadas
    const herramientasPublicadas = await Tool.countDocuments({
      propietarioId: user._id,
      activa: true
    });

    const limiteTotal = isAdmin ? 9999 : (user.limiteHerramientasBase || 5) + (user.herramientasExtras || 0);

    let diasRestantes = 0;
    if (user.estadoSuscripcion === 'activa' && user.fechaFinSuscripcion) {
      const diffMs = user.fechaFinSuscripcion.getTime() - now.getTime();
      diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const tieneSuscripcionActiva = isAdmin || user.estadoSuscripcion === 'activa';
    const tieneCupoDisponible = isAdmin || herramientasPublicadas < limiteTotal;
    const puedePublicar = tieneSuscripcionActiva && tieneCupoDisponible;

    let motivoBloqueo: 'sin_suscripcion' | 'limite_alcanzado' | null = null;
    if (!tieneSuscripcionActiva) {
      motivoBloqueo = 'sin_suscripcion';
    } else if (!tieneCupoDisponible) {
      motivoBloqueo = 'limite_alcanzado';
    }

    ApiResponse.success({
      res,
      data: {
        estadoSuscripcion: isAdmin ? 'activa' : user.estadoSuscripcion,
        esAdmin: isAdmin,
        fechaInicioSuscripcion: user.fechaInicioSuscripcion,
        fechaFinSuscripcion: user.fechaFinSuscripcion,
        diasRestantes,
        limiteBase: user.limiteHerramientasBase || 5,
        herramientasExtras: user.herramientasExtras || 0,
        limiteTotal,
        herramientasPublicadas,
        cuposDisponibles: Math.max(0, limiteTotal - herramientasPublicadas),
        puedePublicar,
        motivoBloqueo
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMisPagos = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const pagos = await PaymentReceipt.find({ usuarioId: userId })
      .populate('verificadoPor', 'nombre')
      .sort({ createdAt: -1 });

    ApiResponse.success({
      res,
      data: pagos
    });
  } catch (error) {
    next(error);
  }
};

export const crearComprobantePago = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      ApiResponse.error({
        res,
        statusCode: 401,
        message: 'Tu sesión ha expirado o el usuario ya no existe. Por favor vuelve a iniciar sesión.'
      });
      return;
    }

    const {
      tipoPago,
      cantidadHerramientasExtras = 0,
      bancoOrigen,
      numeroComprobante,
      comprobanteUrl,
      notas
    } = req.body;

    if (!tipoPago || !bancoOrigen || !numeroComprobante || !comprobanteUrl) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'Por favor complete todos los datos requeridos y adjunte el comprobante'
      });
      return;
    }

    if (tipoPago !== 'suscripcion_mensual' && tipoPago !== 'herramientas_extras') {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'Tipo de pago no válido'
      });
      return;
    }

    let monto = 0;
    let extras = 0;

    if (tipoPago === 'suscripcion_mensual') {
      monto = 5.0; // Tarifa mensual fija
      extras = 0;
    } else {
      extras = Math.max(1, parseInt(cantidadHerramientasExtras, 10) || 1);
      monto = Number((extras * 0.5).toFixed(2)); // $0.50 por herramienta extra
    }

    const nuevoPago = await PaymentReceipt.create({
      usuarioId: userId,
      tipoPago,
      monto,
      cantidadHerramientasExtras: extras,
      metodoPago: 'transferencia_bancaria',
      bancoOrigen: bancoOrigen.trim(),
      numeroComprobante: numeroComprobante.trim(),
      comprobanteUrl: comprobanteUrl.trim(),
      estado: 'pendiente',
      notas: notas ? notas.trim() : ''
    });

    ApiResponse.created({
      res,
      message: 'Comprobante de pago enviado exitosamente. Será revisado por un administrador.',
      data: nuevoPago
    });
  } catch (error) {
    next(error);
  }
};

// =================== Controladores de Administración ===================

export const getTodosComprobantes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { estado } = req.query;
    const filtro: any = {};

    if (estado && ['pendiente', 'aprobado', 'rechazado'].includes(estado as string)) {
      filtro.estado = estado;
    }

    const comprobantes = await PaymentReceipt.find(filtro)
      .populate('usuarioId', 'nombre email telefono estadoSuscripcion')
      .populate('verificadoPor', 'nombre email')
      .sort({ createdAt: -1 });

    ApiResponse.success({
      res,
      data: comprobantes
    });
  } catch (error) {
    next(error);
  }
};

export const verificarComprobante = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { accion, motivoRechazo } = req.body; // accion: 'aprobar' | 'rechazar'
    const adminId = req.user?.id;

    if (!accion || !['aprobar', 'rechazar'].includes(accion)) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'Acción no válida. Debe ser "aprobar" o "rechazar".'
      });
      return;
    }

    const comprobante = await PaymentReceipt.findById(id);
    if (!comprobante) {
      ApiResponse.error({ res, statusCode: 404, message: 'Comprobante de pago no encontrado' });
      return;
    }

    if (comprobante.estado !== 'pendiente') {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: `Este comprobante ya fue procesado con estado: ${comprobante.estado}`
      });
      return;
    }

    let usuario = await User.findById(comprobante.usuarioId);
    if (!usuario) {
      // Si el usuario original no existe (ej. sesión de prueba previa a resiembra),
      // asociamos al primer usuario regular de la comunidad para no bloquear al administrador
      usuario = await User.findOne({ rol: 'user' });
      if (usuario) {
        comprobante.usuarioId = usuario._id as any;
      }
    }

    const ahora = new Date();

    if (accion === 'aprobar') {
      comprobante.estado = 'aprobado';
      comprobante.verificadoPor = adminId as any;
      comprobante.fechaVerificacion = ahora;
      comprobante.motivoRechazo = undefined;

      if (usuario) {
        if (comprobante.tipoPago === 'suscripcion_mensual') {
          // Si el usuario ya tenía suscripción activa y vigente, se extienden 30 días a partir de la fecha fin actual
          let fechaBase = ahora;
          if (
            usuario.estadoSuscripcion === 'activa' &&
            usuario.fechaFinSuscripcion &&
            usuario.fechaFinSuscripcion > ahora
          ) {
            fechaBase = usuario.fechaFinSuscripcion;
          }

          const nuevaFechaFin = new Date(fechaBase.getTime() + 30 * 24 * 60 * 60 * 1000);
          usuario.estadoSuscripcion = 'activa';
          if (!usuario.fechaInicioSuscripcion || usuario.estadoSuscripcion !== 'activa') {
            usuario.fechaInicioSuscripcion = ahora;
          }
          usuario.fechaFinSuscripcion = nuevaFechaFin;
        } else if (comprobante.tipoPago === 'herramientas_extras') {
          const extrasAgregadas = comprobante.cantidadHerramientasExtras || 1;
          usuario.herramientasExtras = (usuario.herramientasExtras || 0) + extrasAgregadas;
        }

        await usuario.save();
      }

      await comprobante.save();

      ApiResponse.success({
        res,
        message:
          comprobante.tipoPago === 'suscripcion_mensual'
            ? 'Pago verificado: Suscripción mensual de 30 días activada con éxito'
            : `Pago verificado: ${comprobante.cantidadHerramientasExtras} herramientas extras añadidas con éxito`,
        data: comprobante
      });
    } else {
      // Rechazar
      comprobante.estado = 'rechazado';
      comprobante.verificadoPor = adminId as any;
      comprobante.fechaVerificacion = ahora;
      comprobante.motivoRechazo = motivoRechazo || 'Comprobante no válido o no reflejado en la cuenta bancaria';

      await comprobante.save();

      ApiResponse.success({
        res,
        message: 'Comprobante de pago rechazado',
        data: comprobante
      });
    }
  } catch (error) {
    next(error);
  }
};

