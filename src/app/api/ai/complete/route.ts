import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { context } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    prompt: `Continue this text naturally. Only output the continuation, no explanations or formatting. Keep it brief (1-2 sentences max):

${context}`,
  });

  return result.toTextStreamResponse();
}
