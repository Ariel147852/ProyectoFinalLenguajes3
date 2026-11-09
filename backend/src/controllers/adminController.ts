import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Tool } from '../models/Tool';
import { Loan } from '../models/Loan';
import { PaymentReceipt } from '../models/PaymentReceipt';
import { ApiResponse } from '../views/apiResponse';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    ApiResponse.success({ res, data: users });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      ApiResponse.error({ res, statusCode: 404, message: 'Usuario no encontrado' });
      return;
    }

    user.activo = !user.activo;
    await user.save();

    ApiResponse.success({
      res,
      message: `Usuario ${user.activo ? 'activado' : 'bloqueado'} exitosamente`,
      data: { id: user._id, activo: user.activo }
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalUsers, totalTools, activeLoans, completedLoans, pendingPayments] = await Promise.all([
      User.countDocuments(),
      Tool.countDocuments({ activa: true }),
      Loan.countDocuments({ estado: { $in: ['aprobado', 'en_curso'] } }),
      Loan.countDocuments({ estado: 'devuelto' }),
      PaymentReceipt.countDocuments({ estado: 'pendiente' })
    ]);

    ApiResponse.success({
      res,
      data: {
        totalUsers,
        totalTools,
        activeLoans,
        completedLoans,
        pendingPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

