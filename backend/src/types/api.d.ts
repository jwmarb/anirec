import { StatusCodes } from 'http-status-codes';

export type APIResponse<T = any> = {
  status: StatusCodes;
  data?: T;
  error?: string | string[];
};

export type Media = {
  season: string;
  title: {
    english: string | null;
    native: string | null;
    romaji: string | null;
  };
  popularity: number;
  averageScore: number;
  genres: string[];
  format: string;
  description: string | null;
  chapters: null;
  episodes: number;
  coverImage: {
    large: string;
    extraLarge: string;
  };
  endDate: {
    day: number;
    month: number;
    year: number;
  };
  seasonYear: number;
  siteUrl: string;
  status: string;
  type: string;
  volumes: null;
  isAdult: boolean;
  id: number;
};

export type RecommendationResponse = {
  would_recommend: boolean;
  reason: string;
};
