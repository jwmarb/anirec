import { Collections, JWT_SECRET } from '$/constants';
import { APIResponse } from '$/types/api';
import express from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { TypeOf, z } from 'zod';
import { JWTPayload, User } from '$/types/schema';
import { database, getDatabase } from '$/middleware/mongo';
import { ObjectId } from 'mongodb';

const contentRouter = express.Router();
contentRouter.use(database);

const contentSchema = z.object({
  nsfwContent: z.enum(['blur', 'hide', 'show']).optional(),
  model: z.string().optional(),
});

contentRouter.put('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: StatusCodes.UNAUTHORIZED,
      error: 'unauthorized user',
    } as APIResponse);
    return;
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err || !decoded) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'user not found',
      } as APIResponse);
      return;
    }

    const userId = (decoded as JWTPayload)._id;
    try {
      const db = await getDatabase();
      const user = await db.collection(Collections.USERS).findOne<User>({ _id: new ObjectId(userId) });

      if (!user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          status: StatusCodes.UNAUTHORIZED,
          error: 'user not found',
        } as APIResponse);
        return;
      }

      const { nsfwContent, model } = req.body;

      let newNsfw = user.contentSettings.nsfwContent;

      if (nsfwContent) newNsfw = nsfwContent;

      const updatedUser = await db
        .collection(Collections.USERS)
        .findOneAndUpdate(
          { _id: user._id },
          { $set: { contentSettings: { nsfwContent: newNsfw, model } } },
          { returnDocument: 'after' }
        );
      if (!updatedUser) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          status: StatusCodes.UNAUTHORIZED,
          error: 'user not found',
        } as APIResponse);
        return;
      }

      res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        data: updatedUser.contentSettings,
      });
    } catch (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
});

export default contentRouter;
