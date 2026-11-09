import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ChatMessage } from '../models/ChatMessage';

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WebSocket] Cliente conectado: ${socket.id}`);

    // Unirse a una sala (por defecto comunidad_general)
    socket.on('join_room', (sala: string = 'comunidad_general') => {
      socket.join(sala);
      console.log(`[WebSocket] Socket ${socket.id} se unió a la sala: ${sala}`);
    });

    // Enviar y persistir mensaje en tiempo real
    socket.on('send_message', async (data: {
      usuarioId: string;
      nombreUsuario: string;
      rolUsuario?: 'user' | 'admin';
      mensaje: string;
      sala?: string;
    }) => {
      try {
        const { usuarioId, nombreUsuario, rolUsuario = 'user', mensaje, sala = 'comunidad_general' } = data;

        if (!mensaje || mensaje.trim().length === 0) {
          return;
        }

        // Guardar mensaje en MongoDB
        const nuevoMensaje = await ChatMessage.create({
          usuarioId,
          nombreUsuario,
          rolUsuario,
          mensaje: mensaje.trim(),
          sala
        });

        // Emitir a todos los usuarios conectados en la sala
        io.to(sala).emit('receive_message', nuevoMensaje);
        console.log(`[WebSocket] Mensaje de ${nombreUsuario} emitido a sala ${sala}`);
      } catch (error) {
        console.error('[WebSocket Error] Error al guardar/emitir mensaje:', error);
        socket.emit('error_message', { error: 'No se pudo enviar el mensaje' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};
