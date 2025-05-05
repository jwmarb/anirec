import { database, getDatabase } from '$/middleware/mongo';
import { APIResponse } from '$/types/api';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { Collections, JWT_SECRET } from '$/constants';
import { JWTPayload, User } from '$/types/schema';
import { ObjectId } from 'mongodb';

const detailsRouter = express.Router();
detailsRouter.use(database);

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

const putSchema = z
  .object({
    username: z.string().optional(),
    email: z.string().email().optional(),
    password: passwordSchema.optional(),
    confirmPassword: z.string().optional(),
    oldPassword: z.string().optional(),
    interests: z.string().array().optional(),
    about: z.string().optional(),
    favorities: z.string().array().optional(),
  })
  .refine((s) => s.password === s.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

detailsRouter.get('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: 'Unauthorized user',
      status: StatusCodes.UNAUTHORIZED,
    } as APIResponse);
    return;
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err || !decoded) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'Unauthorized user',
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

      res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        data: {
          success: true,
          user: {
            username: user.username,
            avatar: user.avatar,
            email: user.email,
            interests: user.interests,
            contentSettings: user.contentSettings,
            favorites: user.favorites,
            about: user.about,
          },
        },
      } as APIResponse);
    } catch (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
});

detailsRouter.put('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: 'Unauthorized user',
      status: StatusCodes.UNAUTHORIZED,
    } as APIResponse);
    return;
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err || !decoded) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'unauthorized user',
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

      const { username, email, password, oldPassword, interests, about, favorites } = req.body;

      let newName = user.username;
      let newEmail = user.email;
      let newInterests = user.interests;
      let newAbout = user.about;
      let newPassword = user.password;
      let newFavorites = user.favorites;

      if (password) {
        const comparePasswords = await bcrypt.compare(oldPassword, user.password);
        if (!comparePasswords) {
          res.status(StatusCodes.BAD_REQUEST).json({
            status: StatusCodes.BAD_REQUEST,
            error: 'incorrect old password',
          } as APIResponse);
          return;
        }
        newPassword = await bcrypt.hash(password, 10);
      }

      if (username) newName = username;
      if (email) newEmail = email;
      if (interests) newInterests = interests;
      if (about) newAbout = about;
      if (favorites) newFavorites = favorites;

      const updatedUser = await db
        .collection(Collections.USERS)
        .findOneAndUpdate(
          { _id: user._id },
          {
            $set: {
              username: newName,
              email: newEmail,
              interests: newInterests,
              about: newAbout,
              password: newPassword,
              favorites: newFavorites,
            },
          },
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
        data: {
          success: true,
          user: {
            username: updatedUser.username,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            interests: updatedUser.interests,
            about: updatedUser.about,
            favorites: updatedUser.favorites,
          },
        },
      });
    } catch (err) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });
});

export default detailsRouter;
