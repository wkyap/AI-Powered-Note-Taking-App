import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages, noteContext, noteTitle } = await req.json();

  const systemPrompt = `You are a helpful AI writing assistant integrated into a note-taking app. Your role is to help users with their notes by:
- Answering questions about their content
- Helping them brainstorm and expand ideas
- Summarizing and organizing information
- Improving their writing style and clarity
- Suggesting related topics or connections

${
  noteContext
    ? `The user is currently working on a note titled "${noteTitle || 'Untitled'}". Here is the content of their note:
---
${noteContext}
---

Use this context to provide relevant and helpful responses.`
    : 'The user is not currently viewing a specific note.'
}

Be concise, helpful, and friendly. Format your responses using markdown when appropriate.`;

  const result = await streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
