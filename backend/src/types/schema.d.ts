import { ObjectId } from 'mongodb';

export type User = {
  _id: ObjectId;
  email: string;
  avatar: string | null;
  username: string;
  password: string;
  about: string;
  interests: string[];
  favorites: number[];
  contentSettings: ContentSettings
  avatar?: string; // path to the avatar image file
};

export type ContentSettings = {
  "nsfwContent": "show" | "hide" | "blur";
  "model": string | null;
};

export type JWTPayload = {
  _id: string; // needs to be converted to ObjectId when querying mongodb
  username: string;
};

export type Media = {
  season: string;
  title: {
    english: string;
    native: string;
    romaji: string;
  };
  popularity: number;
  averageScore: number;
  genres: string[];
  format: string;
  description: string;
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