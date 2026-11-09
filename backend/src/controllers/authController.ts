import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ENV } from '../config/env';
import { ApiResponse } from '../views/apiResponse';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const generateToken = (id: string, email: string, rol: string): string => {
  return jwt.sign({ id, email, rol }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any
  });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nombre, email, password, telefono, direccionZona } = req.body;

    if (!nombre || !email || !password) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'Nombre, email y contraseña son obligatorios'
      });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      ApiResponse.error({
        res,
        statusCode: 409,
        message: 'El correo electrónico ya está registrado'
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      nombre,
      email,
      passwordHash,
      telefono,
      direccionZona: direccionZona || 'Comunidad Central',
      rol: 'user'
    });

    const token = generateToken(user._id.toString(), user.email, user.rol);

    ApiResponse.created({
      res,
      message: 'Usuario registrado exitosamente',
      data: {
        token,
        user: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          telefono: user.telefono,
          direccionZona: user.direccionZona,
          reputacionPromedio: user.reputacionPromedio
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'Email y contraseña requeridos'
      });
      return;
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.activo) {
      ApiResponse.error({
        res,
        statusCode: 401,
        message: 'Credenciales inválidas o cuenta inactiva'
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      ApiResponse.error({
        res,
        statusCode: 401,
        message: 'Credenciales inválidas'
      });
      return;
    }

    const token = generateToken(user._id.toString(), user.email, user.rol);

    ApiResponse.success({
      res,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        user: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          telefono: user.telefono,
          direccionZona: user.direccionZona,
          reputacionPromedio: user.reputacionPromedio
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      ApiResponse.error({ res, statusCode: 404, message: 'Usuario no encontrado' });
      return;
    }

    ApiResponse.success({
      res,
      data: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        telefono: user.telefono,
        direccionZona: user.direccionZona,
        reputacionPromedio: user.reputacionPromedio,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

