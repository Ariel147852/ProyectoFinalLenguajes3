import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { ApiResponse } from '../views/apiResponse';

export const requireRole = (...allowedRoles: Array<'user' | 'admin'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.error({
        res,
        statusCode: 401,
        message: 'No autenticado'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.rol)) {
      ApiResponse.error({
        res,
        statusCode: 403,
        message: 'Acceso denegado: No tienes los permisos necesarios'
      });
      return;
    }

    next();
  };
};

