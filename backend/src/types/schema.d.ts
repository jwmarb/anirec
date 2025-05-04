import { ObjectId } from 'mongodb';

export type User = {
  _id: ObjectId;
  email: string;
  username: string;
  password: string;
  about: string;
  interests: string[];
};

export type JWTPayload = {
  _id: string; // needs to be converted to ObjectId when querying mongodb
  username: string;
};
