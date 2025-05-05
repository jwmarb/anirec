import express from 'express';
import healthRouter from '$/routes/health';
import searchRouter from '$/routes/search';
import authRouter from '$/routes/auth';
import detailsRouter from './user/details';
import avatarRouter from '$/routes/user/avatar';
import modelRouter from '$/routes/models';
import contentRouter from './user/content';
import favoritesRouter from './user/favorites';

const routes = express.Router();

routes.use('/health', healthRouter);
routes.use('/search', searchRouter);
routes.use('/auth', authRouter);
routes.use('/user', detailsRouter);
routes.use('/user/avatar', avatarRouter);
routes.use('/models', modelRouter);
routes.use('/user/content', contentRouter);
routes.use('/user/favorites', favoritesRouter);

export default routes;
