import { OPENAI_API_ENDPOINT, OPENAI_API_KEY } from '$/constants';
import { TokenJS } from 'token.js';

const tokenjs = new TokenJS({ baseURL: OPENAI_API_ENDPOINT, apiKey: OPENAI_API_KEY });

export async function chat(prompt: string, query: string): Promise<string> {
  const completion = await tokenjs.chat.completions.create({
    provider: 'openai-compatible',
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'developer', content: prompt },
      { role: 'user', content: query },
    ],
  });

  return completion.choices[0].message.content ?? 'No response from LLM';
}
