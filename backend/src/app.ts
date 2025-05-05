import express from 'express';
import routes from './routes';
import configureMiddleware from './middleware';
import { PORT } from './constants';
import healthRouter from '$/routes/health';
import path from 'path';

const app = express();

configureMiddleware(app);

app.use('/api', routes);
app.use('/health', healthRouter);
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
