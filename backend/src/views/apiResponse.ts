import { Response } from 'express';

export interface ApiResponseOptions<T = any> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
}

export class ApiResponse {
  static success<T>({ res, statusCode = 200, message = 'Operación exitosa', data, meta }: ApiResponseOptions<T>) {
    return res.status(statusCode).json({
      success: true,
      message,
      data: data !== undefined ? data : null,
      meta: meta || undefined
    });
  }

  static created<T>({ res, message = 'Recurso creado exitosamente', data }: ApiResponseOptions<T>) {
    return this.success({ res, statusCode: 201, message, data });
  }

  static error({
    res,
    statusCode = 500,
    message = 'Error interno en el servidor',
    errors = null
  }: {
    res: Response;
    statusCode?: number;
    message?: string;
    errors?: any;
  }) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors: errors || undefined
    });
  }
}

