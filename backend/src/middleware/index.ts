import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

export default (app: express.Express) => {
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};
