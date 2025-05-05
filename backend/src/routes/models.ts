import express from 'express';
import { JWT_SECRET, OPENAI_API_ENDPOINT } from "$/constants";
import { StatusCodes } from 'http-status-codes';
import { APIResponse } from '$/types/api';
import jwt from 'jsonwebtoken';


const modelRouter = express.Router();

modelRouter.get('/', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

     if(!token){
            res.status(StatusCodes.UNAUTHORIZED).json({
                error: "Unauthorized user",
                status: StatusCodes.UNAUTHORIZED
            } as APIResponse);
            return;
        }
    
    jwt.verify(token, JWT_SECRET, async (err, decoded) =>{
        if(err || !decoded){
            res.status(StatusCodes.UNAUTHORIZED).json({
                error: "user not found",
                status: StatusCodes.UNAUTHORIZED
            } as APIResponse);
            return;
        }

        const response = await fetch(`${OPENAI_API_ENDPOINT}/models`, { method: "GET",  headers: { "Authorization": `Bearer ${token}` }});

        const { data } = await response.json();

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            data: data,
        } as APIResponse);
    })
});