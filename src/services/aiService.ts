// ============================================================
// AI Service — routes through Cloudflare Worker
// The Anthropic API key lives in the Worker, never in the browser.
// VITE_WORKER_URL = your deployed worker URL (e.g. https://loombox-worker.USERNAME.workers.dev)
// Falls back to localhost:8787 for local development.
// ============================================================

import type { AIPromptQuestion, AIStoryResponse } from '@/types'

const WORKER_URL = (import.meta.env.VITE_WORKER_URL as string | undefined)?.replace(/\/$/, '')
  ?? 'http://localhost:8787'

const MODEL = 'claude-sonnet-4-20250514'

const callClaude = async (systemPrompt: string, userMessage: string, maxTokens = 1000): Promise<string> => {
  const res = await fetch(`${WORKER_URL}/api/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// Detect language from text content
export const detectLang = (text: string): 'he' | 'en' => {
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) ?? []).length
  const totalChars = text.replace(/\s/g, '').length
  return totalChars > 0 && hebrewChars / totalChars > 0.2 ? 'he' : 'en'
}

const langInstruction = (lang: 'en' | 'he'): string =>
  lang === 'he'
    ? 'CRITICAL: You MUST write your entire response in Hebrew (עברית). Every word must be in Hebrew.'
    : 'Respond in English.'

// ── 1. Enhance a story ────────────────────────────────────

const toneInstruction = (tone?: string): string => {
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

export const enhanceStory = async (
  rawText: string,
  era?: string,
  location?: string,
  lang?: 'en' | 'he',
  extraContext?: string,
  tone?: string,
): Promise<AIStoryResponse> => {
  const detectedLang = lang ?? detectLang(rawText)
  const context = [era, location].filter(Boolean).join(', ')

  const system = `You are a warm, empathetic family story editor helping people preserve memories beautifully.
Enhance the story to be vivid, emotionally resonant and well-structured — keep the author's authentic voice. Never fabricate facts.
${context ? `Historical/location context: ${context}` : ''}
${extraContext ? `\nAdditional details the author provided:\n${extraContext}\nWeave these naturally into the story.` : ''}
${toneInstruction(tone)}
${langInstruction(detectedLang)}
Respond using EXACTLY this format — nothing else before or after:
<enhanced>
[full enhanced story — multiple paragraphs fine]
</enhanced>
<title>[3-7 word title]</title>`

  const raw = await callClaude(system, `Enhance this family story:\n\n${rawText}`, 1500)

  const enhancedMatch = raw.match(/<enhanced>([\s\S]*?)<\/enhanced>/)
  const titleMatch = raw.match(/<title>([\s\S]*?)<\/title>/)

  return {
    enhancedContent: enhancedMatch?.[1]?.trim() ?? raw.trim(),
    title: titleMatch?.[1]?.trim(),
  }
}

// ── 2. Memory prompts ─────────────────────────────────────

export const getMemoryPrompts = async (
  topic?: string,
  memberName?: string,
  lang?: 'en' | 'he',
): Promise<AIPromptQuestion[]> => {
  const resolvedLang = lang ?? 'en'

  const system = `You are a gentle family historian helping people unlock memories.
Generate 6 thoughtful, specific questions to help someone tell a family story.
${memberName ? `The story involves: ${memberName}` : ''}
${topic ? `Topic/theme: ${topic}` : ''}
Questions should be warm, specific, and evoke sensory details.
${langInstruction(resolvedLang)}
Respond ONLY with valid JSON array (no markdown):
[{"id":"1","question":"...","category":"memory|emotion|detail|context"}]`

  const text = await callClaude(system, 'Generate memory prompt questions.')
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as AIPromptQuestion[]
  } catch {
    return resolvedLang === 'he' ? DEFAULT_PROMPTS_HE : DEFAULT_PROMPTS_EN
  }
}

// ── 3. Historical context ─────────────────────────────────

export const getHistoricalContext = async (
  era: string,
  location: string,
  lang?: 'en' | 'he',
): Promise<string> => {
  const system = `You are a historian specializing in everyday family life across different eras.
Provide a short vivid paragraph (3-4 sentences) about daily life for ordinary families.
Focus on sensory details: food, clothing, sounds, social customs.
Write warmly, as if setting the scene for a family story.
${langInstruction(lang ?? 'en')}`

  return callClaude(system, `Describe everyday family life in ${location} during ${era}.`)
}

// ── 4. Title suggestion ───────────────────────────────────

export const suggestTitle = async (
  content: string,
  lang?: 'en' | 'he',
): Promise<string> => {
  const detectedLang = lang ?? detectLang(content)

  const system = `You are a literary editor.
Suggest one evocative short title (3-7 words) for this family story.
The title should feel warm and timeless, like a memoir chapter.
${langInstruction(detectedLang)}
Respond with ONLY the title text — no quotes, no extra text.`

  return callClaude(system, content)
}

// ── 5. Image generation ───────────────────────────────────

export const buildImagePrompt = (
  title: string,
  era?: string,
  location?: string,
): string =>
  [
    'warm vintage photograph, soft lighting, nostalgic, family memory, sepia tones, detailed, cinematic',
    title,
    era ? `circa ${era}` : '',
    location ? `in ${location}` : '',
  ].filter(Boolean).join(', ')

export const getPollinationsImageUrl = (prompt: string, seed?: number): string =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=500&nologo=true&seed=${seed ?? Date.now()}`

// Robust loader with 30s timeout + one retry
export const loadPollinationsImage = async (prompt: string): Promise<string> => {
  const tryLoad = (url: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const timer = setTimeout(() => { reject(new Error('timeout')) }, 30000)
      img.onload = () => { clearTimeout(timer); resolve(url) }
      img.onerror = () => { clearTimeout(timer); reject(new Error('error')) }
      img.src = url
    })

  try {
    return await tryLoad(getPollinationsImageUrl(prompt))
  } catch {
    // retry with new seed
    return tryLoad(getPollinationsImageUrl(prompt, Date.now() + 999))
  }
}

// ── 5. SVG Illustration (via Worker → Anthropic) ─────────

export const generateStoryIllustration = async (
  title: string,
  era?: string,
  location?: string,
): Promise<string> => {
  const context = [title, era ? `circa ${era}` : '', location ?? ''].filter(Boolean).join(' · ')

  const system = `You are a master illustrator creating vintage illustrations for family memoirs.
Generate a beautiful, unique SVG (viewBox="0 0 800 500") in a warm vintage lithograph style.

Be specific to the content:
- Kitchen story → draw kitchen with stove, pots, warm light
- Immigration → ship, harbour, new city skyline
- Family gathering → table, chairs, figures

Rules:
- Warm sepia palette only: #8B6914 #C9954A #F8F0E0 #4A3728 #E8DCC8 #2C1810 #D4A853
- Decorative border rect (stroke, no fill, rounded corners)
- Small italic title text at bottom
- Use only: rect circle ellipse polygon path line text g
- Background rect in warm cream (#F8F0E0)

CRITICAL: Return ONLY raw SVG — starts with <svg ends with </svg>. Nothing else.`

  const raw = await callClaude(system, `Create a vintage memoir illustration for: "${context}"`, 2000)
  const s = raw.indexOf('<svg')
  const e = raw.lastIndexOf('</svg>') + 6
  if (s === -1 || e < 6) throw new Error('No SVG returned')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(raw.slice(s, e))}`
}

// ── 6. Content moderation ─────────────────────────────────

export const moderateContent = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  const system = `You are a content moderator for a family-friendly platform.
Respond ONLY with JSON: {"safe": true} or {"safe": false, "reason": "brief reason"}`
  try {
    const result = await callClaude(system, text)
    return JSON.parse(result.replace(/```json|```/g, '').trim())
  } catch {
    return { safe: true }
  }
}

// ── Fallback prompts ──────────────────────────────────────

const DEFAULT_PROMPTS_EN: AIPromptQuestion[] = [
  { id: '1', question: 'What did the place look, smell or sound like?', category: 'detail' },
  { id: '2', question: 'How did you feel in that moment?', category: 'emotion' },
  { id: '3', question: 'Who else was there, and what were they doing?', category: 'memory' },
  { id: '4', question: 'What was happening in the world or your family at that time?', category: 'context' },
  { id: '5', question: 'What would you want your grandchildren to know about this?', category: 'memory' },
  { id: '6', question: 'Is there an object, smell or song that takes you back there?', category: 'detail' },
]

const DEFAULT_PROMPTS_HE: AIPromptQuestion[] = [
  { id: '1', question: 'איך נראה, הריח והישמע המקום?', category: 'detail' },
  { id: '2', question: 'מה הרגשת באותו רגע?', category: 'emotion' },
  { id: '3', question: 'מי עוד היה שם ומה עשו?', category: 'memory' },
  { id: '4', question: 'מה קרה אז בעולם או במשפחה שלך?', category: 'context' },
  { id: '5', question: 'מה היית רוצה שנכדיך ידעו על הרגע הזה?', category: 'memory' },
  { id: '6', question: 'האם יש חפץ, ריח או שיר שמחזיר אותך לשם?', category: 'detail' },
]