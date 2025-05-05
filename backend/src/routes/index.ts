import express from 'express';
import healthRouter from '$/routes/health';
import searchRouter from '$/routes/search';
import authRouter from '$/routes/auth';
import avatarRouter from '$/routes/user/avatar';

const routes = express.Router();

routes.use('/health', healthRouter);
routes.use('/search', searchRouter);
routes.use('/auth', authRouter);
routes.use('/user/avatar', avatarRouter);

export default routes;
