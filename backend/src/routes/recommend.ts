import { APIResponse, Media } from '$/types/api';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { ANILIST_API } from '$/constants';

const recommendRouter = express.Router();

const recommendPayloadSchema = z.object({
  mediaId: z.number(),
});

recommendRouter.post('/', async (req, res) => {
  const result = recommendPayloadSchema.safeParse(req.body);
  if (!result.success) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      error: result.error.errors.map(e => e.message).join(', '),
    } as APIResponse);
    return;
  }

  try {
    const { mediaId } = result.data;

    const query = `
      query ($mediaId: Int) {
        Media(id: $mediaId) {
          recommendations(sort: RATING_DESC) {
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
        variables: {
          mediaId
        }
      })
    });

    const data = await response.json();
    
    if (data.errors) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: StatusCodes.BAD_REQUEST,
        error: data.errors.map((e: any) => e.message).join(', '),
      } as APIResponse);
      return;
    }

    const recommendations = data.data.Media.recommendations.nodes.map((node: any) => ({
      media: node.mediaRecommendation,
      rating: node.rating,
      userRating: node.userRating
    }));

    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      data: recommendations,
    } as APIResponse);
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: err instanceof Error ? err.message : 'Unknown error',
    } as APIResponse);
  }
});

export default recommendRouter;