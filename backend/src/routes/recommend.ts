import { APIResponse } from '$/types/api';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { chat } from '$/utils/llm';
import { ANILIST_API } from '$/constants';
import { findClosestOf } from '$/utils/strings';

const recommendRouter = express.Router();

const searchPayloadSchema = z.object({
    query: z.string().min(1),
  });

recommendRouter.post('/', async (req, res) => {
});

export default recommendRouter;