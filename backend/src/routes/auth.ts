import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { getDatabase } from '$/middleware/mongo';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { Collections, JWT_SECRET } from '$/constants';
import { APIResponse } from '$/types/api';
import { JWTPayload, User } from '$/types/schema';
import { ObjectId } from 'mongodb';

const authRouter = express.Router();

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
  rememberMe: z.boolean(),
});

const registerSchema = z
  .object({
    username: z.string(),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

authRouter.post('/login', async (_, res) => {
  const result = loginSchema.safeParse(_.body);
  if (!result.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      data: result.error.errors.map((e) => e.message),
    });
    return;
  }

  const { username, password, rememberMe } = result.data;

  try {
    const db = await getDatabase();
    const user = await db.collection(Collections.USERS).findOne({ username });

    if (!user || !user.password) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'Invalid username or password',
      });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'invalid username or password',
      });
      return;
    }

    const expiresIn = rememberMe ? '744h' : '1h';

    const token = jwt.sign({ _id: user._id.toString(), username: user.username } as JWTPayload, JWT_SECRET, {
      expiresIn,
    });

    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      data: token,
    });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

authRouter.post('/register', async (_, res) => {
  const result = registerSchema.safeParse(_.body);
  if (!result.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      data: result.error.errors.map((e) => e.message),
    });
    return;
  }
  const { username, email, password } = result.data;

  try {
    const db = await getDatabase();

    const userExists = await db.collection(Collections.USERS).findOne({ username });

    if (userExists) {
      res.status(StatusCodes.CONFLICT).json({
        status: StatusCodes.CONFLICT,
        error: 'username already registered!',
      } as APIResponse);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user: User = {
      _id: new ObjectId(),
      username,
      email,
      password: hashedPassword,
      about: '',
      interests: [],
    };
    const insert = await db.collection(Collections.USERS).insertOne(user);

    if (!insert.acknowledged) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: 'Failed to create user',
      } as APIResponse);
      return;
    }

    res.status(StatusCodes.CREATED).json({
      status: StatusCodes.CREATED,
      data: 'User created successfully!',
    });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: err instanceof Error ? err.message : 'Unknown error',
    } as APIResponse);
  }
});

export default authRouter;
