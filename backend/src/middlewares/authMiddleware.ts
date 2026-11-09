import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { ApiResponse } from '../views/apiResponse';
import { User } from '../models/User';

export interface AuthUserPayload {
  id: string;
  email: string;
  rol: 'user' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ApiResponse.error({
      res,
      statusCode: 401,
      message: 'Acceso no autorizado: No se proporcionó token JWT'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUserPayload;

    // Verificar que el usuario realmente exista en la base de datos (evita usuarios fantasmas por tokens viejos)
    const userExists = await User.exists({ _id: decoded.id });
    if (!userExists) {
      ApiResponse.error({
        res,
        statusCode: 401,
        message: 'Sesión no válida o usuario no encontrado. Por favor inicia sesión nuevamente.'
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    ApiResponse.error({
      res,
      statusCode: 403,
      message: 'Token JWT inválido o expirado'
    });
    return;
  }
};

