'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized music recommendations.
 *
 * - generatePersonalizedRecommendations -  A function that takes a user's listening history as input and returns personalized music recommendations.
 * - PersonalizedRecommendationsInput - The input type for the generatePersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The output type for the PersonalizedRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedRecommendationsInputSchema = z.object({
  listeningHistory: z
    .array(z.string())
    .describe("An array of song titles and artists representing the user's listening history."),
});
export type PersonalizedRecommendationsInput = z.infer<
  typeof PersonalizedRecommendationsInputSchema
>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe("An array of recommended song titles and artists based on the user's listening history."),
});
export type PersonalizedRecommendationsOutput = z.infer<
  typeof PersonalizedRecommendationsOutputSchema
>;

export async function generatePersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  prompt: `You are a music recommendation expert. Based on the user's listening history, you will provide a list of songs that the user might enjoy.

  Listening History:
  {{#each listeningHistory}}
  - {{this}}
  {{/each}}

  Recommendations:`, //The recommendations should be a JSON array of strings
  // examples:
  //[{"recommendations": ["Song 1 - Artist 1", "Song 2 - Artist 2", "Song 3 - Artist 3"]}]
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
