import { Router } from 'express';
import {
  getDatosBancarios,
  getMiEstadoSuscripcion,
  getMisPagos,
  crearComprobantePago,
  getTodosComprobantes,
  verificarComprobante
} from '../controllers/paymentController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

// Endpoint público/informativo de datos bancarios
router.get('/datos-bancarios', getDatosBancarios);

// Endpoints autenticados para usuarios
router.get('/mi-suscripcion', authenticateJWT, getMiEstadoSuscripcion);
router.get('/mis-pagos', authenticateJWT, getMisPagos);
router.post('/comprobante', authenticateJWT, crearComprobantePago);

// Endpoints de administración para verificar y listar comprobantes
router.get('/admin/comprobantes', authenticateJWT, requireRole('admin'), getTodosComprobantes);
router.put('/admin/comprobantes/:id/verificar', authenticateJWT, requireRole('admin'), verificarComprobante);
router.patch('/admin/comprobantes/:id/verificar', authenticateJWT, requireRole('admin'), verificarComprobante);

export default router;

