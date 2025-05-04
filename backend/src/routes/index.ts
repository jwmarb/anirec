import express from 'express';
import healthRouter from '$/routes/health';
import searchRouter from '$/routes/search';
import authRouter from '$/routes/auth';

const routes = express.Router();

routes.use('/health', healthRouter);
routes.use('/search', searchRouter);
routes.use('/auth', authRouter);

export default routes;
