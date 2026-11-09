import { Router } from 'express';
import {
  getTools,
  getNearbyTools,
  getToolById,
  getToolAvailability,
  createTool,
  updateTool,
  deleteTool
} from '../controllers/toolController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Rutas públicas de consulta
router.get('/', getTools);
router.get('/nearby', getNearbyTools);
router.get('/:id', getToolById);
router.get('/:id/availability', getToolAvailability);

// Rutas protegidas (creación, edición y borrado)
router.post('/', authenticateJWT, createTool);
router.put('/:id', authenticateJWT, updateTool);
router.delete('/:id', authenticateJWT, deleteTool);

export default router;

