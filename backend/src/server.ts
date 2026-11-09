import http from 'http';
import app from './app';
import { ENV } from './config/env';
import { connectDB } from './config/database';
import { initSocket } from './config/socket';

const startServer = async () => {
  // Conectar a la base de datos MongoDB
  await connectDB();

  // Crear servidor HTTP y acoplar WebSockets con Socket.IO
  const server = http.createServer(app);
  initSocket(server);

  server.listen(ENV.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Tool Library API - Servidor HTTP & WebSocket activo`);
    console.log(`🌐 API corriendo en: http://localhost:${ENV.PORT}`);
    console.log(`💬 WebSockets listos en: ws://localhost:${ENV.PORT}`);
    console.log(`🩺 Endpoint de salud: http://localhost:${ENV.PORT}/api/v1/health`);
    console.log(`===============================================`);
  });
};

startServer();
