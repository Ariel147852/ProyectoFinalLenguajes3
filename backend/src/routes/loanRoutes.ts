import { Router } from 'express';
import {
  requestLoan,
  respondToLoan,
  deliverLoan,
  returnLoan,
  getMyBorrowerLoans,
  getMyLenderLoans
} from '../controllers/loanController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

// Todas las operaciones de préstamos requieren autenticación JWT
router.use(authenticateJWT);

router.post('/request', requestLoan);
router.patch('/:id/respond', respondToLoan);
router.patch('/:id/deliver', deliverLoan);
router.patch('/:id/return', returnLoan);
router.get('/my-borrowed', getMyBorrowerLoans);
router.get('/my-lent', getMyLenderLoans);

export default router;

