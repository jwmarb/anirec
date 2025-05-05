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
