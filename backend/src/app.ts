import express, { Application } from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import apiRouter from './routes';
import { notFoundHandler, errorHandler } from './middlewares/errorMiddleware';

const app: Application = express();

// Middlewares globales
app.use(cors({
  origin: '*', // Permitir peticiones desde Angular (desarrollo)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Montaje de la API en /api/v1
app.use('/api/v1', apiRouter);

// Manejo de rutas inexistentes y errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

