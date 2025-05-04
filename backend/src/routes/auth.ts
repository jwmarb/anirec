import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { APIResponse } from '$/types/api';
import { connectToDatabase } from "./mongo";
import bcrypt from 'bcrypt';
import { z } from 'zod';

const authRouter = express.Router();

const passwordSchema = z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");


const loginSchema = z.object({
    name: z.string(),
    password: z.string(),
    rememberMe: z.boolean()
});

const registerSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string(),
    }).refine(data => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ['confirmPassword']
    });

authRouter.post('/register', async (_, res) => {
    const result = registerSchema.safeParse(_.body);
    if (!result.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        data: result.error
      });
    }
    const { name, email, password} = result.data;

    try{
        const db = await connectToDatabase();

        const userExists = await db.collection("users").findOne({ email });

        if(userExists){
            return res.status(StatusCodes.CONFLICT).json({
                status: StatusCodes.CONFLICT,
                errors: ["Email already registered!"]
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = { name, email, password: hashedPassword };
        const insert = await db.collection("users").insertOne(user);

        res.status(StatusCodes.CREATED).json({
            status: StatusCodes.CREATED,
            data: { userId: insert.insertedId.toString(), name, email }
          } as APIResponse<{userId: string, name: string, email: string}>);
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            errors: [err instanceof Error ? err.message : "Unknown error"]
          });
    }

  });

export default authRouter;
