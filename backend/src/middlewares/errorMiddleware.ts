import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../views/apiResponse';

export const notFoundHandler = (req: Request, res: Response): void => {
  ApiResponse.error({
    res,
    statusCode: 404,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('[Error no controlado]', err);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el: any) => el.message);
    ApiResponse.error({
      res,
      statusCode: 400,
      message: 'Error de validación en los datos enviados',
      errors
    });
    return;
  }

  // Error de duplicado de índice único en Mongo (código 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    ApiResponse.error({
      res,
      statusCode: 409,
      message: `El valor para el campo '${field}' ya se encuentra registrado`
    });
    return;
  }

  // CastError (ID no válido en Mongo)
  if (err.name === 'CastError') {
    ApiResponse.error({
      res,
      statusCode: 400,
      message: `Identificador con formato inválido para el campo: ${err.path}`
    });
    return;
  }

  ApiResponse.error({
    res,
    statusCode: err.statusCode || 500,
    message: err.message || 'Error interno del servidor'
  });
};

