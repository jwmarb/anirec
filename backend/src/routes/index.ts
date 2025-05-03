import express from 'express';
import healthRouter from './health';

const routes = express.Router();

routes.use('/health', healthRouter);

export default routes;
