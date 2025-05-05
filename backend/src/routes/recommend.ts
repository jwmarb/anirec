import { APIResponse, Media } from '$/types/api';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { ANILIST_API, Collections, JWT_SECRET } from '$/constants';
import { JWTPayload, User } from '$/types/schema';
import { getDatabase } from '$/middleware/mongo';
import { ObjectId } from 'mongodb';
import { chat } from '$/utils/llm';
import jwt from 'jsonwebtoken';

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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { mediaId }
    })
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors.map((e: any) => e.message).join(', '));
  }
  return data.data.Media;
}

recommendRouter.get('/:id', async (req, res) => {
  console.log('Received request params:', req.params);
  
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: StatusCodes.UNAUTHORIZED,
      error: 'unauthorized user'
    } as APIResponse);
    return;
  }

  const result = recommendParamsSchema.safeParse(req.params);
  if (!result.success) {
    console.log('Validation failed:', result.error.errors);
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      error: result.error.errors.map(e => e.message).join(', '),
    } as APIResponse);
    return;
  }

  try {
    // Get user info and favorites
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const db = await getDatabase();
    const user = await db.collection(Collections.USERS).findOne<User>({ _id: new ObjectId(decoded._id) });

    if (!user) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        error: 'user not found'
      } as APIResponse);
      return;
    }

    const { id: mediaId } = result.data;
    console.log('Fetching recommendations for mediaId:', mediaId);

    const query = `
      query ($mediaId: Int) {
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
              }
              rating
              userRating
            }
          }
        }
      }
    `;

    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { mediaId }
      })
    });

    const data = await response.json();
    console.log('AniList API response:', data);
    
    if (data.errors) {
      console.error('AniList API errors:', data.errors);
      res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        error: data.errors.map((e: any) => e.message).join(', '),
      } as APIResponse);
      return;
    }

    if (!data.data?.Media) {
      console.error('No media found for ID:', mediaId);
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

    const validFavorites = favoriteDetails.filter((fav): fav is NonNullable<typeof fav> => fav !== null);
    const favoritesContext = JSON.stringify(validFavorites.map(fav => ({
      title: fav.title,
      description: fav.description,
      genres: fav.genres,
      format: fav.format,
      episodes: fav.episodes,
      chapters: fav.chapters,
      status: fav.status,
      averageScore: fav.averageScore
    })));

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
          averageScore: media.averageScore
        });

        const prompt = `You are an anime/manga recommendation system. Based on a user's favorites list and a potential recommendation, determine if the user would enjoy the recommendation.
        
User's favorites:
${favoritesContext}

Potential recommendation:
${mediaContext}

Analyze the recommendation's compatibility with the user's taste based on:
1. Genre preferences
2. Themes and narrative elements
3. Format and length
4. Overall quality and ratings

Return a JSON object with two fields:
1. would_recommend (boolean): true if you think the user would enjoy this, false otherwise
2. reason (string): A brief, concise explanation of your recommendation (max 100 characters)

Response format:
{"would_recommend": boolean, "reason": "string"}`;

        try {
          const llmResponse = await chat(prompt, " ");
          const recommendation = JSON.parse(llmResponse);
          return {
            media: {
              ...media,
              rating: node.rating,
              userRating: node.userRating
            },
            would_recommend: recommendation.would_recommend,
            reason: recommendation.reason
          };
        } catch (err) {
          console.error('Error processing recommendation:', err);
          return {
            media,
            would_recommend: false,
            reason: "Error processing recommendation"
          };
        }
      })
    );

    // Format the response according to the specified structure
    const formattedResponse = {
      data: recommendations.map(rec => ({
        id: rec.media.id,
        would_recommend: rec.would_recommend,
        reason: rec.reason
      })),
      status: StatusCodes.OK
    };

    res.status(StatusCodes.OK).json(formattedResponse);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: err instanceof Error ? err.message : 'Unknown error',
    } as APIResponse);
  }
});

export default recommendRouter;