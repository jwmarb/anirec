import { Collections, JWT_SECRET } from '$/constants';
import { database, getDatabase } from '$/middleware/mongo';
import { APIResponse } from '$/types/api';
import { JWTPayload, User } from '$/types/schema';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const favoritesRouter = express.Router();
favoritesRouter.use(database);

const postSchema = z.object({
    mediaId: z.number()
})

favoritesRouter.post('/', async (req, res) => {
    const result = postSchema.safeParse(req.body);
    const token = req.headers.authorization?.split(' ')[1];

    if(!result.success){
        res.status(StatusCodes.BAD_REQUEST).json({
            status: StatusCodes.BAD_REQUEST,
            error: 'BAD REQUEST'
        } as APIResponse);
        return;
    }
    if(!token){
        res.status(StatusCodes.UNAUTHORIZED).json({
            status: StatusCodes.UNAUTHORIZED,
            error: 'unauthorized user'
        } as APIResponse);
        return;
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if(err || !decoded){
            res.status(StatusCodes.UNAUTHORIZED).json({
                status: StatusCodes.UNAUTHORIZED,
                error: 'unauthorized user'
            } as APIResponse);
            return;
        }

        const userId = (decoded as JWTPayload)._id;

        try{
            const db = await getDatabase();
            const user = await db.collection(Collections.USERS).findOne<User>({_id: new ObjectId(userId)});

            if(!user){
                res.status(StatusCodes.UNAUTHORIZED).json({
                    status: StatusCodes.UNAUTHORIZED,
                    error: 'user not found'
                } as APIResponse);
                return;
            }

            const { mediaId } = result.data;

            await db.collection<User>(Collections.USERS).updateOne(
                {_id: user._id },
                { $push: { favorites: { $each: [mediaId] } } },
            )

            res.status(StatusCodes.OK).json({
                status: StatusCodes.OK,
                data: 'Updated successfully!'
            } as APIResponse);
        } catch (err){
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                error: err instanceof Error ? err.message : "Unknown error"
            })
        }
    })
});

favoritesRouter.delete('/', async (req, res) =>{
    const token = req.headers.authorization?.split(' ')[1];

    if(!token){
        res.status(StatusCodes.UNAUTHORIZED).json({
            status: StatusCodes.UNAUTHORIZED,
            error: 'unauthorized user'
        } as APIResponse);
        return;
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if(err || !decoded){
            res.status(StatusCodes.UNAUTHORIZED).json({
                status: StatusCodes.UNAUTHORIZED,
                error: 'unauthorized user'
            } as APIResponse);
            return;
        }

        const userId = (decoded as JWTPayload)._id;

        try{
            const db = await getDatabase();
            const user = await db.collection(Collections.USERS).findOne<User>({_id: new ObjectId(userId)});

            if(!user){
                res.status(StatusCodes.UNAUTHORIZED).json({
                    status: StatusCodes.UNAUTHORIZED,
                    error: 'user not found'
                } as APIResponse);
                return;
            }

            const { mediaId } = req.body;

            await db.collection(Collections.USERS).updateOne(
                {_id: user._id },
                { $pull: {favorites: mediaId}},
            )

            res.status(StatusCodes.OK).json({
                status: StatusCodes.OK,
                data: 'removed successfully!'
            } as APIResponse);
        } catch (err){
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                error: err instanceof Error ? err.message : "Unknown error"
            })
        }
    })
});

favoritesRouter.get('/', async (req, res) =>{
    const token = req.headers.authorization?.split(' ')[1];

    if(!token){
        res.status(StatusCodes.UNAUTHORIZED).json({
            status: StatusCodes.UNAUTHORIZED,
            error: 'unauthorized user'
        } as APIResponse);
        return;
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if(err || !decoded){
            res.status(StatusCodes.UNAUTHORIZED).json({
                status: StatusCodes.UNAUTHORIZED,
                error: 'unauthorized user'
            } as APIResponse);
            return;
        }

        const userId = (decoded as JWTPayload)._id;

        try{
            const db = await getDatabase();
            const user = await db.collection(Collections.USERS).findOne<User>({_id: new ObjectId(userId)});

            if(!user){
                res.status(StatusCodes.UNAUTHORIZED).json({
                    status: StatusCodes.UNAUTHORIZED,
                    error: 'user not found'
                } as APIResponse);
                return;
            }

            res.status(StatusCodes.OK).json({
                status: StatusCodes.OK,
                data: user.favorites
            } as APIResponse);
        } catch (err){
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                error: err instanceof Error ? err.message : "Unknown error"
            })
        }
    })
});

export default favoritesRouter;