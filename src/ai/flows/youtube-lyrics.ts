'use server';

/**
 * @fileOverview A Genkit flow for fetching YouTube video captions/lyrics.
 *
 * - getYoutubeLyrics - A function that takes a video ID and returns its lyrics.
 * - YoutubeLyricsInput - The input type for the getYoutubeLyrics function.
 * - YoutubeLyricsOutput - The output type for the getYoutubeLyrics function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getSubtitles } from 'youtube-captions-scraper';

const YoutubeLyricsInputSchema = z.object({
  videoId: z.string().describe('The YouTube video ID.'),
});
export type YoutubeLyricsInput = z.infer<typeof YoutubeLyricsInputSchema>;

const LyricLineSchema = z.object({
    start: z.string(),
    dur: z.string(),
    text: z.string()
});

const YoutubeLyricsOutputSchema = z.object({
  lyrics: z.array(LyricLineSchema).describe("An array of lyric lines with timing information."),
});
export type YoutubeLyricsOutput = z.infer<typeof YoutubeLyricsOutputSchema>;

export async function getYoutubeLyrics(
  input: YoutubeLyricsInput
): Promise<YoutubeLyricsOutput> {
  return getYoutubeLyricsFlow(input);
}

const getYoutubeLyricsFlow = ai.defineFlow(
  {
    name: 'getYoutubeLyricsFlow',
    inputSchema: YoutubeLyricsInputSchema,
    outputSchema: YoutubeLyricsOutputSchema,
  },
  async ({ videoId }) => {
    try {
      const subtitles = await getSubtitles({
        videoID: videoId,
        lang: 'en' // You might want to make this configurable
      });

      return { lyrics: subtitles };
    } catch (error: any) {
      console.error(`Error fetching lyrics for videoId ${videoId}:`, error.message);
      // Return empty lyrics array on error to prevent client crashes
      return { lyrics: [] };
    }
  }
);
