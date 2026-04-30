// Generates the story behind a family recipe using the Anthropic API

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL   = 'claude-sonnet-4-20250514'

const langBlock = (lang: 'en' | 'he'): string =>
  lang === 'he'
    ? '\n===== MANDATORY =====\nWrite EVERY word in Hebrew (עברית). No English at all.\n=====================\n'
    : 'Write in English.'

export const callRecipeStoryAI = async (
  name:      string,
  from?:     string,
  occasion?: string,
  lang:      'en' | 'he' = 'en',
): Promise<string> => {
  const system = `You are a warm family story writer. Write a short, evocative paragraph (4-6 sentences) about the story and memory behind a family recipe. 
Focus on: who made it, what occasion it was for, what it tasted like, why it matters to the family.
Write warmly, personally, as if the family member is speaking.
${from ? `It was passed down from: ${from}` : ''}
${occasion ? `Special occasion: ${occasion}` : ''}
${langBlock(lang)}
Write ONLY the story paragraph — no title, no extra text.`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':                              'application/json',
      'x-api-key':                                 import.meta.env.VITE_ANTHROPIC_API_KEY as string,
      'anthropic-version':                         '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL, max_tokens: 400,
      system, messages: [{ role: 'user', content: `Write the story behind this family recipe: ${name}` }],
    }),
  })
  if (!res.ok) throw new Error(`AI failed: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}
