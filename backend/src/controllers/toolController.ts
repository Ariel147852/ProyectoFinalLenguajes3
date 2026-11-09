import { Request, Response, NextFunction } from 'express';
import { Tool, ToolCategory } from '../models/Tool';
import { Loan } from '../models/Loan';
import { ApiResponse } from '../views/apiResponse';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getTools = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoria, busqueda, page = 1, limit = 12 } = req.query;

    const filter: any = { activa: true };

    if (categoria && categoria !== 'todas') {
      filter.categoria = categoria;
    }

    if (busqueda && typeof busqueda === 'string' && busqueda.trim().length > 0) {
      filter.$text = { $search: busqueda.trim() };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tools, total] = await Promise.all([
      Tool.find(filter)
        .populate('propietarioId', 'nombre reputacionPromedio direccionZona')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Tool.countDocuments(filter)
    ]);

    ApiResponse.success({
      res,
      data: tools,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getNearbyTools = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng, maxDistanceKm = 10, categoria } = req.query;

    if (!lat || !lng) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'Las coordenadas de latitud (lat) y longitud (lng) son obligatorias'
      });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const maxMeters = parseFloat(maxDistanceKm as string) * 1000;

    const filter: any = {
      activa: true,
      ubicacion: {
        $near: {
          $geometry: {
            type: 'Point',
            // Convención MongoDB: [longitud, latitud]
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxMeters
        }
      }
    };

    if (categoria && categoria !== 'todas') {
      filter.categoria = categoria;
    }

    const tools = await Tool.find(filter)
      .populate('propietarioId', 'nombre reputacionPromedio direccionZona')
      .limit(50);

    ApiResponse.success({
      res,
      message: `Se encontraron ${tools.length} herramientas cercanas`,
      data: tools
    });
  } catch (error) {
    next(error);
  }
};

export const getToolById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const tool = await Tool.findById(id).populate('propietarioId', 'nombre reputacionPromedio direccionZona telefono email');

    if (!tool) {
      ApiResponse.error({ res, statusCode: 404, message: 'Herramienta no encontrada' });
      return;
    }

    ApiResponse.success({ res, data: tool });
  } catch (error) {
    next(error);
  }
};

export const getToolAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Obtenemos los préstamos confirmados o en curso a partir de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const busyLoans = await Loan.find({
      herramientaId: id,
      estado: { $in: ['aprobado', 'en_curso'] },
      fechaFin: { $gte: today }
    }).select('fechaInicio fechaFin estado');

    const blockedRanges = busyLoans.map(loan => ({
      inicio: loan.fechaInicio,
      fin: loan.fechaFin,
      estado: loan.estado
    }));

    ApiResponse.success({
      res,
      data: {
        herramientaId: id,
        fechasOcupadas: blockedRanges
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createTool = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      nombre,
      descripcion,
      categoria,
      estadoFisico,
      imagenes,
      latitud,
      longitud,
      direccionZona,
      maxDiasPrestamo
    } = req.body;

    if (!nombre || !descripcion || !categoria || latitud === undefined || longitud === undefined || !direccionZona) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'Faltan campos obligatorios para registrar la herramienta'
      });
      return;
    }

    const tool = await Tool.create({
      propietarioId: req.user?.id,
      nombre,
      descripcion,
      categoria,
      estadoFisico: estadoFisico || 'bueno',
      imagenes: Array.isArray(imagenes) ? imagenes : [],
      ubicacion: {
        type: 'Point',
        // [longitud, latitud]
        coordinates: [Number(longitud), Number(latitud)]
      },
      direccionZona,
      maxDiasPrestamo: Number(maxDiasPrestamo) || 7
    });

    ApiResponse.created({
      res,
      message: 'Herramienta publicada exitosamente',
      data: tool
    });
  } catch (error) {
    next(error);
  }
};

export const updateTool = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const tool = await Tool.findById(id);

    if (!tool) {
      ApiResponse.error({ res, statusCode: 404, message: 'Herramienta no encontrada' });
      return;
    }

    // Verificar propiedad o rol admin
    if (tool.propietarioId.toString() !== req.user?.id && req.user?.rol !== 'admin') {
      ApiResponse.error({ res, statusCode: 403, message: 'No tienes permiso para modificar esta herramienta' });
      return;
    }

    const {
      nombre,
      descripcion,
      categoria,
      estadoFisico,
      imagenes,
      latitud,
      longitud,
      direccionZona,
      maxDiasPrestamo,
      activa
    } = req.body;

    if (nombre) tool.nombre = nombre;
    if (descripcion) tool.descripcion = descripcion;
    if (categoria) tool.categoria = categoria;
    if (estadoFisico) tool.estadoFisico = estadoFisico;
    if (imagenes) tool.imagenes = imagenes;
    if (direccionZona) tool.direccionZona = direccionZona;
    if (maxDiasPrestamo) tool.maxDiasPrestamo = Number(maxDiasPrestamo);
    if (activa !== undefined) tool.activa = activa;

    if (latitud !== undefined && longitud !== undefined) {
      tool.ubicacion = {
        type: 'Point',
        coordinates: [Number(longitud), Number(latitud)]
      };
    }

    await tool.save();

    ApiResponse.success({
      res,
      message: 'Herramienta actualizada con éxito',
      data: tool
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTool = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const tool = await Tool.findById(id);

    if (!tool) {
      ApiResponse.error({ res, statusCode: 404, message: 'Herramienta no encontrada' });
      return;
    }

    if (tool.propietarioId.toString() !== req.user?.id && req.user?.rol !== 'admin') {
      ApiResponse.error({ res, statusCode: 403, message: 'No tienes permiso para eliminar esta herramienta' });
      return;
    }

    // Baja lógica
    tool.activa = false;
    await tool.save();

    ApiResponse.success({
      res,
      message: 'Herramienta dada de baja exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

