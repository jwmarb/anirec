import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT ?? 8080;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (OPENAI_API_KEY == null) {
  throw new Error("OPENAI_API_KEY is not set in the environment variables.");
}

export const OPENAI_API_ENDPOINT = process.env.OPENAI_API_ENDPOINT;

if (OPENAI_API_ENDPOINT == null) {
  throw new Error(
    "OPENAI_API_ENDPOINT is not set in the environment variables."
  );
}

export const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://root:example@localhost:27017/";
export const ANILIST_API = "https://graphql.anilist.co";
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL;

if (DEFAULT_MODEL == null) {
  console.warn(
    'DEFAULT_MODEL is not set in the environment variables. The default model that will be used is the first model (0th index) returned from "/v1/models"'
  );
}

export const JWT_SECRET =
  process.env.JWT_SECRET ||
  (() => {
    console.error(
      "JWT_SECRET is not set in the environment variables. Using a default value for development purposes only."
    );
    return "secret-key";
  })();

export enum Collections {
  USERS = "users",
}
