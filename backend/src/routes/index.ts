import { Router } from 'express';
import authRoutes from './authRoutes';
import toolRoutes from './toolRoutes';
import loanRoutes from './loanRoutes';
import adminRoutes from './adminRoutes';
import chatRoutes from './chatRoutes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/tools', toolRoutes);
apiRouter.use('/loans', loanRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/chat', chatRoutes);

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'Tool Library API',
    timestamp: new Date().toISOString()
  });
});

export default apiRouter;

