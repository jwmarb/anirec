import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { APIResponse } from '$/types/api';

const healthRouter = express.Router();

healthRouter.get('/', (_, res) => {
  res.status(StatusCodes.OK).json({
    status: StatusCodes.OK,
    data: 'Server is up and running!',
  } as APIResponse<string>);
});

export default healthRouter;
