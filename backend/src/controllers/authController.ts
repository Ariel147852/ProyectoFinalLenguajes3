import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ENV } from '../config/env';
import { ApiResponse } from '../views/apiResponse';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { validarCedulaEcuatoriana } from '../utils/cedulaValidator';

const generateToken = (id: string, email: string, rol: string): string => {
  return jwt.sign({ id, email, rol }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any
  });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      nombre,
      email,
      password,
      telefono,
      direccionZona,
      cedula,
      cedulaFrontalUrl,
      cedulaPosteriorUrl
    } = req.body;

    if (!nombre || !email || !password || !telefono || !cedula) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'Nombre, email, contraseña, teléfono y cédula son obligatorios'
      });
      return;
    }

    // Validación de Cédula Ecuatoriana (Módulo 10)
    const validacionCedula = validarCedulaEcuatoriana(cedula);
    if (!validacionCedula.valida) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: validacionCedula.mensaje || 'Cédula ecuatoriana no válida'
      });
      return;
    }

    // Comprobar fotos de cédula de ambos lados
    if (!cedulaFrontalUrl || !cedulaPosteriorUrl) {
      ApiResponse.error({
        res,
        statusCode: 400,
        message: 'Es obligatorio subir la foto de la cédula de ambos lados (frontal y posterior)'
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

    const existingCedula = await User.findOne({ cedula: cedula.trim() });
    if (existingCedula) {
      ApiResponse.error({
        res,
        statusCode: 409,
        message: 'La cédula de identidad ya se encuentra registrada en el sistema'
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      telefono: telefono.trim(),
      direccionZona: direccionZona ? direccionZona.trim() : 'Comunidad Central',
      cedula: cedula.trim(),
      cedulaFrontalUrl: cedulaFrontalUrl.trim(),
      cedulaPosteriorUrl: cedulaPosteriorUrl.trim(),
      cedulaVerificada: true,
      rol: 'user',
      datosFinancieros: {
        banco: 'Banco Pichincha',
        tipoCuenta: 'Cuenta de Ahorros',
        numeroCuenta: '',
        titular: nombre.trim(),
        telefonoDeUna: telefono.trim(),
        qrDeUnaUrl: ''
      }
    });

    const token = generateToken(user._id.toString(), user.email, user.rol);

    ApiResponse.created({
      res,
      message: 'Usuario registrado exitosamente con identidad verificada',
      data: {
        token,
        user: {
          id: user._id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          cedula: user.cedula,
          telefono: user.telefono,
          direccionZona: user.direccionZona,
          reputacionPromedio: user.reputacionPromedio,
          datosFinancieros: user.datosFinancieros
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
        cedula: user.cedula,
        telefono: user.telefono,
        direccionZona: user.direccionZona,
        reputacionPromedio: user.reputacionPromedio,
        datosFinancieros: user.datosFinancieros,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDatosFinancieros = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      ApiResponse.error({ res, statusCode: 404, message: 'Usuario no encontrado' });
      return;
    }

    ApiResponse.success({
      res,
      message: 'Datos financieros obtenidos',
      data: user.datosFinancieros || {
        banco: 'Banco Pichincha',
        tipoCuenta: 'Cuenta de Ahorros',
        numeroCuenta: '',
        titular: user.nombre,
        telefonoDeUna: user.telefono || '',
        qrDeUnaUrl: ''
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateDatosFinancieros = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      ApiResponse.error({ res, statusCode: 404, message: 'Usuario no encontrado' });
      return;
    }

    const { banco, tipoCuenta, numeroCuenta, titular, telefonoDeUna, qrDeUnaUrl } = req.body;

    user.datosFinancieros = {
      banco: banco ? banco.trim() : 'Banco Pichincha',
      tipoCuenta: tipoCuenta ? tipoCuenta.trim() : 'Cuenta de Ahorros',
      numeroCuenta: numeroCuenta ? numeroCuenta.trim() : '',
      titular: titular ? titular.trim() : user.nombre,
      telefonoDeUna: telefonoDeUna ? telefonoDeUna.trim() : user.telefono || '',
      qrDeUnaUrl: qrDeUnaUrl ? qrDeUnaUrl.trim() : (user.datosFinancieros?.qrDeUnaUrl || '')
    };

    await user.save();

    ApiResponse.success({
      res,
      message: 'Datos financieros y Código QR DeUna actualizados exitosamente',
      data: user.datosFinancieros
    });
  } catch (error) {
    next(error);
  }
};

