import { APIResponse, Media } from "$/types/api";
import express from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import {
  ANILIST_API,
  Collections,
  DEFAULT_MODEL,
  JWT_SECRET,
  OPENAI_API_ENDPOINT,
  OPENAI_API_KEY,
} from "$/constants";
import { JWTPayload, User } from "$/types/schema";
import { getDatabase } from "$/middleware/mongo";
import { ObjectId } from "mongodb";
import { chat, tokenjs } from "$/utils/llm";
import jwt from "jsonwebtoken";
import promiseRetry from "promise-retry";

const recommendRouter = express.Router();

const recommendParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

async function getMediaDetails(mediaId: number) {
  const query = `
    query ($mediaId: Int) {
      Media(id: $mediaId) {
        id
        title {
          english
          native
          romaji
        }
        description
        genres
        format
        episodes
        chapters
        status
        averageScore
        popularity
        siteUrl
      }
    }
  `;

  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { mediaId },
    }),
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors.map((e: any) => e.message).join(", "));
  }
  return data.data.Media;
}

recommendRouter.get("/:id", async (req, res) => {
  console.log("Received request params:", req.params);

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: StatusCodes.UNAUTHORIZED,
      error: "unauthorized user",
    } as APIResponse);
    return;
  }

  const result = recommendParamsSchema.safeParse(req.params);
  if (!result.success) {
    console.log("Validation failed:", result.error.errors);
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      error: result.error.errors.map((e) => e.message).join(", "),
    } as APIResponse);
    return;
  }

  try {
    // Get user info and favorites
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const db = await getDatabase();
    const user = await db
      .collection(Collections.USERS)
      .findOne<User>({ _id: new ObjectId(decoded._id) });

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: "user not found",
      } as APIResponse);
      return;
    }

    const { id: mediaId } = result.data;
    console.log("Fetching recommendations for mediaId:", mediaId);

    const query = `
      query ($mediaId: Int, $page: Int, $perPage: Int) {
        Media(id: $mediaId) {
          id
          title {
            english
            native
            romaji
          }
          recommendations(sort: RATING_DESC, perPage: 25) {
            nodes {
              mediaRecommendation {
                id
                title {
                  english
                  native
                  romaji
                }
                description
                genres
                format
                episodes
                chapters
                status
                averageScore
                popularity
                coverImage {
                  large
                  extraLarge
                }
                siteUrl
                reviews(page: $page, perPage: $perPage) {
                  nodes {
                    score
                    ratingAmount
                    rating
                    summary
                    body
                  }
                }
              }
              rating
              userRating
            }
          }
        }
      }
    `;

    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { mediaId, page: 1, perPage: 3 },
      }),
    });

    const data = await response.json();
    console.log("AniList API response:", data);

    if (data.errors) {
      console.error("AniList API errors:", data.errors);
      res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        error: data.errors.map((e: any) => e.message).join(", "),
      } as APIResponse);
      return;
    }

    if (!data.data?.Media) {
      console.error("No media found for ID:", mediaId);
      res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        error: `No media found with ID ${mediaId}`,
      } as APIResponse);
      return;
    }

    // Get user's favorite media details
    const favoriteDetails = await Promise.all(
      user.favorites.map(async (favId) => {
        try {
          return await getMediaDetails(favId);
        } catch (err) {
          console.error(`Error fetching details for favorite ${favId}:`, err);
          return null;
        }
      })
    );
    let model = await new Promise<string>((res) => {
      if (user.contentSettings.model) {
        res(user.contentSettings.model);
      } else if (DEFAULT_MODEL) {
        res(DEFAULT_MODEL);
      } else {
        fetch(`${OPENAI_API_ENDPOINT}/models`, {
          method: "GET",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        })
          .then((response) => response.json())
          .then((data) => res(data.data[0].id));
      }
    });

    const validFavorites = favoriteDetails.filter(
      (fav): fav is NonNullable<typeof fav> => fav !== null
    );
    const favoritesContext = JSON.stringify(
      validFavorites.map((fav) => ({
        title: fav.title,
        description: fav.description,
        genres: fav.genres,
        format: fav.format,
        episodes: fav.episodes,
        chapters: fav.chapters,
        status: fav.status,
        averageScore: fav.averageScore,
      }))
    );

    // Create the system prompt with favorites context
    const systemPrompt = `You are an anime/manga recommendation system. Based on the context I will give about myself, determine if I would enjoy a given recommendation.

<about_me>
${user.about}
</about_me>
<interests>
${user.interests.join("\n")}
</interests>
<favorites>
${favoritesContext}
</favorites>

For each recommendation I give you, analyze its compatibility with my tastes based on:
1. Genre preferences / interests
2. Themes and narrative elements
3. Format and length
4. Overall quality and ratings

Additionally, consider what the reviews say about this media. When providing a reason for your recommendation, do **NOT** add any spoilers. Keep your recommendation spoiler-free.`;

    // Process each recommendation with LLM
    const recommendations = await Promise.all(
      data.data.Media.recommendations.nodes.map(async (node: any) => {
        const media = node.mediaRecommendation;
        const mediaContext = JSON.stringify({
          title: media.title,
          description: media.description,
          genres: media.genres,
          format: media.format,
          episodes: media.episodes,
          chapters: media.chapters,
          status: media.status,
          averageScore: media.averageScore,
          reviews: media.reviews.nodes,
        });

        try {
          const completion = await promiseRetry(
            () =>
              tokenjs.chat.completions.create({
                provider: "openai-compatible",
                model,
                messages: [
                  { role: "developer", content: systemPrompt },
                  { role: "user", content: mediaContext },
                ],
                response_format: {
                  type: "json_schema",
                  json_schema: {
                    strict: true,
                    description: `For detailing the recommendation for a media item, the response should include a boolean indicating whether the user would recommend the media and a string explaining the reason for the recommendation. For the recommendation, do NOT add any spoilers.`,
                    name: "data",
                    schema: {
                      type: "object",
                      properties: {
                        would_recommend: {
                          type: "boolean",
                        },
                        reason: {
                          type: "string",
                        },
                      },
                      required: ["would_recommend", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
              }),
            { retries: 3 }
          );
          if (!completion.choices[0].message.content) {
            console.error("No response from LLM");
            return {
              media,
              would_recommend: false,
              reason: "No response from LLM",
            };
          }
          const recommendation = JSON.parse(
            completion.choices[0].message.content
          );
          return {
            media: {
              ...media,
              rating: node.rating,
              userRating: node.userRating,
            },
            would_recommend: recommendation.would_recommend,
            reason: recommendation.reason,
          };
        } catch (err) {
          console.error("Error processing recommendation:", err);
          return {
            media,
            would_recommend: false,
            reason: "Error processing recommendation",
          };
        }
      })
    );

    // Format the response according to the specified structure
    const formattedResponse = {
      data: recommendations
        .filter(
          (rec) =>
            rec.reason !== "Error processing recommendation" &&
            rec.reason !== "No response from LLM"
        )
        .map((rec) => ({
          media: {
            id: rec.media.id,
            description: rec.media.description,
            title: rec.media.title,
            genres: rec.media.genres,
            coverImage: rec.media.coverImage,
            siteUrl: rec.media.siteUrl,
          },
          would_recommend: rec.would_recommend,
          reason: rec.reason,
        })),
      status: StatusCodes.OK,
    };

    res.status(StatusCodes.OK).json(formattedResponse);
  } catch (err) {
    console.error("Error processing request:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: err instanceof Error ? err.message : "Unknown error",
    } as APIResponse);
  }
});

export default recommendRouter;
