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

const avatarRouter = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-userid-originalname
    const uniqueSuffix = `${Date.now()}-${_req.user?._id}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter to only allow image files
const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and GIF files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Add authentication middleware
avatarRouter.use(authenticateToken as express.RequestHandler);

// POST /avatar - Upload avatar
avatarRouter.post('/', upload.single('avatar'), async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.file) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      error: 'No file uploaded',
    } as APIResponse);
    return;
  }

  try {
    const db = await getDatabase();
    const userId = new ObjectId(req.user!._id);

    // Get the old avatar path if it exists
    const user = await db.collection(Collections.USERS).findOne({ _id: userId });
    const oldAvatarPath = user?.avatar;

    // Update user's avatar path in database
    const avatarPath = path.join('uploads', req.file.filename);
    const result = await db.collection(Collections.USERS).updateOne(
      { _id: userId },
      { $set: { avatar: avatarPath } }
    );

    if (!result.acknowledged) {
      // If update fails, delete the uploaded file
      fs.unlinkSync(req.file.path);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        error: 'Failed to update avatar',
      } as APIResponse);
      return;
    }

    // Delete old avatar file if it exists
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
    // Delete uploaded file if database operation fails
    fs.unlinkSync(req.file.path);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: err instanceof Error ? err.message : 'Unknown error',
    } as APIResponse);
  }
});

export default avatarRouter;
