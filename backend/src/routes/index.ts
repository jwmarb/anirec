import express from 'express';
import healthRouter from '$/routes/health';
import searchRouter from '$/routes/search';

const routes = express.Router();

routes.use('/health', healthRouter);
routes.use('/search', searchRouter);

export default routes;
