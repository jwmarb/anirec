import { APIResponse, Media } from '$/types/api';
import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { ANILIST_API } from '$/constants';

const recommendRouter = express.Router();

const recommendParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

recommendRouter.get('/:id', async (req, res) => {
  console.log('Received request params:', req.params);
  
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
        variables: {
          mediaId
        }
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

    const recommendations = data.data.Media.recommendations.nodes.map((node: any) => ({
      media: node.mediaRecommendation,
      rating: node.rating,
      userRating: node.userRating
    }));

    console.log(`Found ${recommendations.length} recommendations`);

    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      data: {
        media: {
          id: data.data.Media.id,
          title: data.data.Media.title,
        },
        recommendations
      },
    } as APIResponse);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: StatusCodes.INTERNAL_SERVER_ERROR,
      error: err instanceof Error ? err.message : 'Unknown error',
    } as APIResponse);
  }
});

export default recommendRouter;