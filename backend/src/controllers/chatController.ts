import { Request, Response, NextFunction } from 'express';
import { ChatMessage } from '../models/ChatMessage';
import { ApiResponse } from '../views/apiResponse';

export const getRecentMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sala = 'comunidad_general', limit = 50 } = req.query;

    const messages = await ChatMessage.find({ sala: sala as string })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('usuarioId', 'nombre email rol reputacionPromedio');

    // Invertir para que lleguen en orden cronológico (antiguos arriba, nuevos abajo)
    ApiResponse.success({
      res,
      data: messages.reverse()
    });
  } catch (error) {
    next(error);
  }
};

