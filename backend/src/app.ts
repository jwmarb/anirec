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
app.use(express.static(path.resolve(__dirname)));
app.use((req, res) => {
  if (process.env.NODE_ENV === 'production') res.sendFile(path.resolve(__dirname, 'index.html'));
  else res.send('use frontend plz');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
