import { Router } from 'express';
import { getRecentMessages } from '../controllers/chatController';

const router = Router();

// Historial público de mensajes del chat comunitario
router.get('/history', getRecentMessages);

export default router;

