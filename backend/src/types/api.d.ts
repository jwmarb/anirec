import { StatusCodes } from 'http-status-codes';

export type APIResponse<T = never> = T extends never
  ? {
      status?: StatusCodes;
      error?: string;
    }
  : {
      data: T;
      status?: StatusCodes;
      error?: string;
    };
