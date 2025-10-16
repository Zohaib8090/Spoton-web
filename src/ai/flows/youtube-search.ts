'use server';

/**
 * @fileOverview A Genkit flow for searching YouTube for music videos.
 *
 * - searchYoutube - A function that takes a query and returns a list of YouTube video results.
 * - YoutubeSearchInput - The input type for the searchYoutube function.
 * - YoutubeSearchOutput - The output type for the searchYoutube function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';

const YoutubeSearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube.'),
});
export type YoutubeSearchInput = z.infer<typeof YoutubeSearchInputSchema>;

const YoutubeVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  thumbnail: z.string(),
  duration: z.string(),
});

const YoutubeSearchOutputSchema = z.object({
  results: z.array(YoutubeVideoSchema),
});
export type YoutubeSearchOutput = z.infer<typeof YoutubeSearchOutputSchema>;

function formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "0:00";
    
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    const fmtMinutes = Math.floor(totalSeconds / 60);
    const fmtSeconds = totalSeconds % 60;

    return `${fmtMinutes}:${fmtSeconds.toString().padStart(2, '0')}`;
}


export async function searchYoutube(
  input: YoutubeSearchInput
): Promise<YoutubeSearchOutput> {
  return searchYoutubeFlow(input);
}

const searchYoutubeFlow = ai.defineFlow(
  {
    name: 'searchYoutubeFlow',
    inputSchema: YoutubeSearchInputSchema,
    outputSchema: YoutubeSearchOutputSchema,
  },
  async ({ query }) => {
    const youtube = google.youtube('v3');
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable not set.');
    }

    try {
        const searchResponse = await youtube.search.list({
            key: apiKey,
            part: ['snippet'],
            q: `${query} music`,
            type: ['video'],
            videoCategoryId: '10', // Music category
            maxResults: 15,
        });

        const videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];
        
        if (videoIds.length === 0) {
            return { results: [] };
        }

        const videoResponse = await youtube.videos.list({
            key: apiKey,
            part: ['snippet', 'contentDetails'],
            id: videoIds,
        });

        const results = videoResponse.data.items?.map(item => {
            const artistTitle = item.snippet?.title || 'Unknown';
            let artist = item.snippet?.channelTitle || 'Unknown Artist';
            let title = artistTitle;

            // Basic attempt to split artist and title
            const separators = [' - ', ' – ', ' -- '];
            for (const sep of separators) {
                if (artistTitle.includes(sep)) {
                    [artist, title] = artistTitle.split(sep, 2);
                    break;
                }
            }

            return {
                id: item.id || '',
                title: title.trim(),
                artist: artist.trim().replace(' - Topic', ''),
                thumbnail: item.snippet?.thumbnails?.default?.url || '',
                duration: item.contentDetails?.duration ? formatDuration(item.contentDetails.duration) : '0:00',
            };
        }) || [];

        return { results };

    } catch (e: any) {
        console.error("Error searching YouTube:", e.message);
        // It's better to return an empty list than to throw, to avoid crashing the client app.
        return { results: [] };
    }
  }
);
