import { OPENAI_API_ENDPOINT, OPENAI_API_KEY } from '$/constants';
import { TokenJS } from 'token.js';
import { CompletionNonStreaming } from 'token.js/dist/chat';

export const tokenjs = new TokenJS({
  baseURL: OPENAI_API_ENDPOINT,
  apiKey: OPENAI_API_KEY,
});

export async function chat(
  prompt: string,
  query: string,
  model: string,
  rest?: CompletionNonStreaming<'openai-compatible'>
): Promise<string> {
  console.log(`Making request to ${model}`);
  const completion = await tokenjs.chat.completions.create({
    provider: 'openai-compatible',
    model,
    messages: [
      { role: 'developer', content: prompt },
      { role: 'user', content: query },
    ],
    ...rest,
  });

  return completion.choices[0].message.content ?? 'No response from LLM';
}
