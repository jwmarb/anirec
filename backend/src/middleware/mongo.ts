import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/mydb";
let cachedClient : MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
    if(cachedDb) return cachedDb;
    if(!cachedClient) {
        cachedClient = new MongoClient(uri);
        await cachedClient.connect();
    }

    cachedDb = cachedClient.db();
    return cachedDb;
}