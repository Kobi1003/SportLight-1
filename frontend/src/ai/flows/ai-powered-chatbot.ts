'use server';

/**
 * @fileOverview Implements an AI-powered chatbot for handling basic to moderate player and club queries.
 *
 * - aiChatbot - A function that processes user queries and returns chatbot responses.
 * - AIChatbotInput - The input type for the aiChatbot function.
 * - AIChatbotOutput - The return type for the aiChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatbotInputSchema = z.object({
  query: z.string().describe('The user query or question.'),
  liveContext: z.string().optional().describe('Real-time database records of players and clubs on the platform.'),
});
export type AIChatbotInput = z.infer<typeof AIChatbotInputSchema>;

const AIChatbotOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user query.'),
});
export type AIChatbotOutput = z.infer<typeof AIChatbotOutputSchema>;

export async function aiChatbot(input: AIChatbotInput): Promise<AIChatbotOutput> {
  return aiChatbotFlow(input);
}

const aiChatbotPrompt = ai.definePrompt({
  name: 'aiChatbotPrompt',
  input: {schema: AIChatbotInputSchema},
  output: {schema: AIChatbotOutputSchema},
  prompt: `You are Sportlight's official AI assistant.
You answer questions for athletes, fans, and club scouts based strictly on the REAL LIVE data currently stored in the website database.

{{#if liveContext}}
{{{liveContext}}}
{{/if}}

Guidelines:
1. When asked what clubs are currently present on the website, list the exact clubs from the live data above (e.g. Manchester United, FC Barcelona, Biswanath Kobi's Club, etc.).
2. When asked who is the owner or representative of a club (e.g. "who is the owner of Biswanath Kobi's Club"), extract and reply directly with their owner/representative name (e.g. "The owner of Biswanath Kobi's Club is Biswanath Kobi.").
3. When asked what players are present on the website, list the exact players from the live data above (e.g. Alex Johnson, Priya Sharma, Swapnil Kobi, etc.).
4. Do not make up fake clubs or players that are not in the database.
5. STRICT GUARDRAIL: If the user asks ANY question out of the range of the Sportlight platform, sports, registered players, or clubs (such as general world trivia, politics, recipes, code generation, weather, etc.), you MUST reply:
"No, I can't answer this question. I can only assist with questions regarding the Sportlight platform, its registered players, clubs, and sports scouting features."
6. Keep responses clear, professional, and formatted with markdown.

User Query: {{{query}}}
`,
});

const aiChatbotFlow = ai.defineFlow(
  {
    name: 'aiChatbotFlow',
    inputSchema: AIChatbotInputSchema,
    outputSchema: AIChatbotOutputSchema,
  },
  async input => {
    const {output} = await aiChatbotPrompt(input);
    return output!;
  }
);
