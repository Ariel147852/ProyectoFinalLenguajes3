import { Router } from 'express';
import { getAllUsers, toggleUserStatus, getDashboardStats } from '../controllers/adminController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

// Protegido: Requiere autenticación y rol 'admin'
router.use(authenticateJWT);
router.use(requireRole('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/stats', getDashboardStats);

export default router;

