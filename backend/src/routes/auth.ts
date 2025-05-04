import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { APIResponse } from '$/types/api';
import { connectToDatabase } from "$/middleware/mongo";
import bcrypt from 'bcrypt';
import { z } from 'zod';

const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

const passwordSchema = z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");


const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
    rememberMe: z.boolean()
});

const registerSchema = z.object({
    username: z.string(),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string(),
    }).refine(data => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ['confirmPassword']
    });

authRouter.post('/login', async (_, res ) => {

    const result = loginSchema.safeParse(_.body);
    if(!result.success){
        res.status(StatusCodes.BAD_REQUEST).json({
            status: StatusCodes.BAD_REQUEST,
            data: result.error.errors.map(e => e.message)
        });
        return;
    }

    const { username, password, rememberMe } = result.data;

    try {
        const db = await connectToDatabase();
        const user = await db.collection('users').findOne({ username });

        if(!user || !user.password) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                status: StatusCodes.UNAUTHORIZED,
                error: 'Invalid username or password'
            });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if(!validPassword){
            res.status(StatusCodes.UNAUTHORIZED).json({
                status: StatusCodes.UNAUTHORIZED,
                error: 'invalid username or password'
            });
            return;
        }

        let expires = "1h";

        if(user.rememberMe){
            expires = "744h"
        }
        
        const token = jwt.sign(
            {userId: user._id.toString(), username: user.username},
            JWT_SECRET,
            { expiresIn: expires}
        );

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            data: token
        });

    } catch (err){
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            error: err instanceof Error ? err.message : "Unknown error"
        })
    }

});

authRouter.post('/register', async (_, res) => {
    const result = registerSchema.safeParse(_.body);
    if (!result.success) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        data: result.error.errors.map(e => e.message)
      });
      return;
    }
    const { username, email, password} = result.data;

    try{
        const db = await connectToDatabase();

        const userExists = await db.collection("users").findOne({ username });

        if(userExists){
            res.status(StatusCodes.CONFLICT).json({
                status: StatusCodes.CONFLICT,
                error: 'username already registered!'
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = { username, email, password: hashedPassword };
        const insert = await db.collection("users").insertOne(user);

        res.status(StatusCodes.CREATED).json({
            status: StatusCodes.CREATED,
            data: 'User created successfully!'
          });
    } catch (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            error: err instanceof Error ? err.message : "Unknown error"
          });
    }

  });

export default authRouter;
