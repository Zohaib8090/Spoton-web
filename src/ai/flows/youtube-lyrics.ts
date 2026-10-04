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
  error: z.string().optional().describe("Set when captions could not be fetched."),
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
        videoId, // Using videoId instead of videoID
        lang: 'en'
      });

      return { lyrics: subtitles };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching lyrics for videoId ${videoId}:`, message);
      // Return empty lyrics with the reason instead of throwing, so clients don't crash
      return { lyrics: [], error: message };
    }
  }
);
