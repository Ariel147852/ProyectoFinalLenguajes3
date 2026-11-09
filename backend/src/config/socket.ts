import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ChatMessage, ChatContentType } from '../models/ChatMessage';

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    maxHttpBufferSize: 1e7, // 10MB para soportar imágenes y videos en base64/buffer
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

    // Enviar y persistir mensaje con soporte de multimedia
    socket.on('send_message', async (data: {
      usuarioId: string;
      nombreUsuario: string;
      rolUsuario?: 'user' | 'admin';
      mensaje?: string;
      tipoContenido?: ChatContentType;
      mediaUrl?: string;
      sala?: string;
    }) => {
      try {
        const {
          usuarioId,
          nombreUsuario,
          rolUsuario = 'user',
          mensaje = '',
          tipoContenido = 'texto',
          mediaUrl = '',
          sala = 'comunidad_general'
        } = data;

        // Debe haber texto o multimedia
        if (!mensaje.trim() && !mediaUrl.trim()) {
          return;
        }

        // Guardar mensaje en MongoDB
        const nuevoMensaje = await ChatMessage.create({
          usuarioId,
          nombreUsuario,
          rolUsuario,
          mensaje: mensaje.trim(),
          tipoContenido,
          mediaUrl: mediaUrl.trim(),
          sala
        });

        // Emitir en tiempo real a todos los clientes de la sala
        io.to(sala).emit('receive_message', nuevoMensaje);
        console.log(`[WebSocket] Mensaje (${tipoContenido}) de ${nombreUsuario} emitido a sala ${sala}`);
      } catch (error) {
        console.error('[WebSocket Error] Error al guardar/emitir mensaje:', error);
        socket.emit('error_message', { error: 'No se pudo enviar el mensaje o archivo multimedia' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};
