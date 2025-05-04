import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT ?? 8080;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const OPENAI_API_ENDPOINT = process.env.OPENAI_API_ENDPOINT;
export const MONGODB_URI = process.env.MONGODB_URI;
export const ANILIST_API = 'https://graphql.anilist.co';
