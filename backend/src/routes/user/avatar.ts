import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import { Collections } from '$/constants';
import { getDatabase } from '$/middleware/mongo';
import { authenticateToken } from '$/middleware/auth';
import { ObjectId } from 'mongodb';
import { APIResponse } from '$/types/api';
import { User } from '$/types/schema';

const avatarRouter = express.Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${_req.user?._id}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false); // Don't throw error, just reject the file
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

avatarRouter.use(authenticateToken as express.RequestHandler);

// Use error handling middleware with multer
avatarRouter.post('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          error: 'File too large. Maximum size is 5MB',
        } as APIResponse);
      }
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        error: `Upload error: ${err.message}`,
      } as APIResponse);
    } else if (err) {
      // An unknown error occurred
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: err.message,
      } as APIResponse);
    }

    // Everything went fine with multer, now handle the rest of the route
    handleFileUpload(req, res);
  });
});

// Separated the file processing logic for clarity
async function handleFileUpload(req: express.Request, res: express.Response): Promise<void> {
  if (!req.file) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      error: 'No file uploaded or invalid file type. Only JPEG, PNG and GIF files are allowed.',
    } as APIResponse);
    return;
  }

  try {
    const db = await getDatabase();
    const userId = new ObjectId(req.user!._id);

    const user = await db.collection(Collections.USERS).findOne<User>({ _id: userId });
    const oldAvatarPath = user?.avatar;

    const avatarPath = path.join('uploads', req.file.filename);
    const result = await db
      .collection(Collections.USERS)
      .updateOne({ _id: userId }, { $set: { avatar: `/${avatarPath}` } });

    if (!result.acknowledged) {
      fs.unlinkSync(req.file.path);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: 'Failed to update avatar',
      } as APIResponse);
      return;
    }

    if (oldAvatarPath) {
      const oldFilePath = path.join(process.cwd(), oldAvatarPath);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      data: avatarPath,
    } as APIResponse);
  } catch (err) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: err instanceof Error ? err.message : 'Unknown error',
    } as APIResponse);
  }
}

export default avatarRouter;
