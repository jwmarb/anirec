import { Collections, MONGODB_URI } from '$/constants';
import { NextFunction, Request, Response } from 'express';
import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDatabase(): Promise<Db> {
  if (cachedDb) return cachedDb;
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI);
    cachedClient = await cachedClient.connect();
    console.log('opened a db connection');
  } else {
    console.log('reusing existing db connection');
  }

  cachedDb = cachedClient.db();
  return cachedDb;
}

export async function disconnectDb() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('closed db connection');
  }
}

export async function database(request: Request, response: Response, next: NextFunction) {
  await getDatabase();
  next();
}
