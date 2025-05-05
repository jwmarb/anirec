import { JWT_SECRET } from '$/constants';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export function extractUserId(request: Request): Promise<ObjectId | null> {
  return new Promise((res, rej) => {
    const token = request.headers.authorization?.split(' ')?.[1];
    if (token == null) {
      res(null);
      return;
    }
    jwt.verify(token, JWT_SECRET, (err, data) => {
      if (err || !data) {
        rej('Invalid token');
        return;
      }

      res(new ObjectId((data as { _id: string })._id));
    });
  });
}
