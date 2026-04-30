import type { AIPromptQuestion, AIStoryResponse } from '@/types'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

const callClaude = async (system: string, userMsg: string, maxTokens = 1000): Promise<string> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY as string,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL, max_tokens: maxTokens,
      system, messages: [{ role: 'user', content: userMsg }],
    }),
  })
  if (!res.ok) throw new Error(`AI failed: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

export const detectLang = (text: string): 'he' | 'en' => {
  const heb = (text.match(/[\u0590-\u05FF]/g) ?? []).length
  const total = text.replace(/\s/g, '').length
  return total > 0 && heb / total > 0.15 ? 'he' : 'en'
}

const langBlock = (lang: 'en' | 'he'): string =>
  lang === 'he'
    ? `\n===== MANDATORY =====\nWrite EVERY word in Hebrew (עברית). No English at all.\n=====================\n`
    : 'Write in English.'

const toneBlock = (tone?: string): string => {
  const map: Record<string, string> = {
    longer: 'Make the story significantly longer — expand scenes, add sensory details, deepen emotions.',
    shorter: 'Make the story more concise — keep only the most powerful moments.',
    dramatic: 'Make it more dramatic — heighten emotions, add tension, use vivid language.',
    funny: 'Add warmth and gentle humour — find the funny moments while keeping it respectful.',
    poetic: 'Write lyrically — use metaphors, rhythmic sentences, beautiful imagery.',
    formal: 'Write formally — dignified, literary, memoir-quality prose.',
  }
  return tone && map[tone] ? `\nTONE: ${map[tone]}` : ''
}

// ── 1. Enhance story (XML format — handles multiline Hebrew perfectly) ──

export const enhanceStory = async (
  rawText: string,
  era?: string,
  location?: string,
  lang?: 'en' | 'he',
  extraContext?: string,
  tone?: string,
): Promise<AIStoryResponse> => {
  const l = lang ?? detectLang(rawText)
  const ctx = [era, location].filter(Boolean).join(', ')

  const system = `You are a warm family story editor. Enhance the story to be vivid and emotionally resonant while preserving the author's voice. Never fabricate facts.
${ctx ? `Context: ${ctx}` : ''}
${extraContext ? `\nExtra details from the author:\n${extraContext}\nWeave these naturally into the story.` : ''}
${toneBlock(tone)}
${langBlock(l)}
Use EXACTLY this format — nothing else before or after:
<enhanced>
[full enhanced story — multiple paragraphs fine]
</enhanced>
<title>[3-7 word title]</title>`

  const raw = await callClaude(system, `Enhance this story:\n\n${rawText}`, 1500)
  const enhancedMatch = raw.match(/<enhanced>([\s\S]*?)<\/enhanced>/)
  const titleMatch = raw.match(/<title>([\s\S]*?)<\/title>/)
  return {
    enhancedContent: enhancedMatch?.[1]?.trim() ?? raw.trim(),
    title: titleMatch?.[1]?.trim(),
  }
}

// ── 2. Memory prompts ─────────────────────────────────────

export const getMemoryPrompts = async (
  topic?: string, memberName?: string, lang?: 'en' | 'he',
): Promise<AIPromptQuestion[]> => {
  const l = lang ?? 'en'
  const system = `Family historian generating 6 warm specific memory questions.
${memberName ? `Person: ${memberName}` : ''}${topic ? `\nTopic: ${topic}` : ''}
${langBlock(l)}
Return ONLY a JSON array — no markdown:
[{"id":"1","question":"...","category":"memory|emotion|detail|context"}]`

  const raw = await callClaude(system, 'Generate 6 memory questions.')
  try {
    const s = raw.indexOf('['), e = raw.lastIndexOf(']') + 1
    if (s === -1) throw new Error('no array')
    return JSON.parse(raw.slice(s, e)) as AIPromptQuestion[]
  } catch { return l === 'he' ? DEFAULT_HE : DEFAULT_EN }
}

// ── 3. Historical context ─────────────────────────────────

export const getHistoricalContext = async (
  era: string, location: string, lang?: 'en' | 'he',
): Promise<string> => {
  const system = `Historian writing 3-4 sentences about everyday family life in a specific place and era.
Focus on: food, clothing, sounds, social customs. Warm memoir-like tone.
${langBlock(lang ?? 'en')}`
  return callClaude(system, `Family life in ${location} during ${era}.`)
}

// ── 4. Title suggestion ───────────────────────────────────

export const suggestTitle = async (content: string, lang?: 'en' | 'he'): Promise<string> => {
  const l = lang ?? detectLang(content)
  const system = `Literary editor. One evocative 3-7 word memoir chapter title.
${langBlock(l)}
Reply with ONLY the title text — no quotes, nothing else.`
  return callClaude(system, content)
}

// ── 5. SVG Illustration ───────────────────────────────────

export const generateStoryIllustration = async (
  title: string, era?: string, location?: string,
): Promise<string> => {
  const ctx = [title, era ? `circa ${era}` : '', location ?? ''].filter(Boolean).join(' · ')

  const system = `Master illustrator creating vintage SVG illustrations for family memoirs.
Generate a UNIQUE SVG (viewBox="0 0 800 500") specific to the story context.

Be specific to the content:
- Kitchen story → draw kitchen with stove, pots, warm light
- Immigration → ship, harbour, new city skyline  
- Market/shop → stalls, goods, people
- Nature/farm → fields, trees, sky
- Family gathering → table, chairs, figures

Rules:
- Warm sepia palette only: #8B6914 #C9954A #F8F0E0 #4A3728 #E8DCC8 #2C1810 #D4A853
- Decorative border rect (stroke, no fill, rounded corners)
- Small italic title text at bottom
- Use only: rect circle ellipse polygon path line text g
- Background rect in warm cream

CRITICAL: Return ONLY raw SVG — starts with <svg ends with </svg>. Nothing else.`

  const raw = await callClaude(system, `Vintage illustration for: "${ctx}"`, 2000)
  const s = raw.indexOf('<svg')
  const e = raw.lastIndexOf('</svg>') + 6
  if (s === -1 || e < 6) throw new Error('No SVG returned')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw.slice(s, e))}`
}

// ── 6. Moderation ─────────────────────────────────────────

export const moderateContent = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  const system = `Content moderator for family platform. JSON only: {"safe":true} or {"safe":false,"reason":"..."}`
  try { return JSON.parse((await callClaude(system, text)).replace(/```json|```/g, '').trim()) }
  catch { return { safe: true } }
}

// ── Fallbacks ─────────────────────────────────────────────

const DEFAULT_EN: AIPromptQuestion[] = [
  { id: '1', question: 'What did the place look, smell or sound like?', category: 'detail' },
  { id: '2', question: 'How did you feel in that moment?', category: 'emotion' },
  { id: '3', question: 'Who else was there, and what were they doing?', category: 'memory' },
  { id: '4', question: 'What was happening in the world or your family at that time?', category: 'context' },
  { id: '5', question: 'What would you want your grandchildren to know about this?', category: 'memory' },
  { id: '6', question: 'Is there an object, smell or song that takes you back there?', category: 'detail' },
]

const DEFAULT_HE: AIPromptQuestion[] = [
  { id: '1', question: 'איך נראה, הריח והישמע המקום?', category: 'detail' },
  { id: '2', question: 'מה הרגשת באותו רגע?', category: 'emotion' },
  { id: '3', question: 'מי עוד היה שם ומה הם עשו?', category: 'memory' },
  { id: '4', question: 'מה קרה אז בעולם או במשפחה שלך?', category: 'context' },
  { id: '5', question: 'מה היית רוצה שנכדיך ידעו על הרגע הזה?', category: 'memory' },
  { id: '6', question: 'האם יש חפץ, ריח או שיר שמחזיר אותך לשם?', category: 'detail' },
]