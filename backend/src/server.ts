import app from './app';
import { ENV } from './config/env';
import { connectDB } from './config/database';

const startServer = async () => {
  // Conectar a la base de datos MongoDB
  await connectDB();

  app.listen(ENV.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Tool Library API - Arquitectura MVC lista`);
    console.log(`🌐 Servidor corriendo en: http://localhost:${ENV.PORT}`);
    console.log(`🩺 Endpoint de salud: http://localhost:${ENV.PORT}/api/v1/health`);
    console.log(`===============================================`);
  });
};

startServer();

