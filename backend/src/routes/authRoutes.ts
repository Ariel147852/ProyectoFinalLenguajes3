import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  getDatosFinancieros,
  updateDatosFinancieros,
  sendVerificationCode,
  verifyCode
} from '../controllers/authController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.post('/send-verification-code', sendVerificationCode);
router.post('/verify-code', verifyCode);
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateJWT, getProfile);
router.get('/datos-financieros', authenticateJWT, getDatosFinancieros);
router.put('/datos-financieros', authenticateJWT, updateDatosFinancieros);

export default router;

