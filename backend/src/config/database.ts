import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI);
    console.log(`[MongoDB] Conectado exitosamente: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('[MongoDB Error] Fallo al conectar a la base de datos:', error);
    process.exit(1);
  }
};

