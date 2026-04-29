// ============================================================
// AI Service — Anthropic API calls for story features
// All prompts are carefully crafted for family story context.
// ============================================================

import type { AIPromptQuestion, AIStoryResponse } from '@/types'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

// Core fetch helper
const callClaude = async (systemPrompt: string, userMessage: string): Promise<string> => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY as string,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

// ── 1. Enhance a story ────────────────────────────────────

export const enhanceStory = async (
  rawText: string,
  era?: string,
  location?: string
): Promise<AIStoryResponse> => {
  const context = [era, location].filter(Boolean).join(', ')

  const system = `You are a warm, empathetic family story editor. 
Your job is to help people preserve their family memories beautifully.
Enhance the story to be vivid, emotionally resonant and well-structured — 
but keep the author's authentic voice. Never fabricate facts.
${context ? `Historical/location context: ${context}` : ''}
Respond ONLY with valid JSON: {"enhancedContent": "...", "title": "..."}`

  const text = await callClaude(system, `Please enhance this family story:\n\n${rawText}`)

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return parsed as AIStoryResponse
  } catch {
    return { enhancedContent: text, title: undefined }
  }
}

// ── 2. Generate memory prompt questions ──────────────────

export const getMemoryPrompts = async (
  topic?: string,
  memberName?: string
): Promise<AIPromptQuestion[]> => {
  const system = `You are a gentle family historian helping people unlock memories.
Generate 6 thoughtful, specific questions to help someone tell a family story.
${memberName ? `The story involves: ${memberName}` : ''}
${topic ? `Topic/theme: ${topic}` : ''}
Questions should be warm, specific and evoke sensory details.
Respond ONLY with valid JSON array: 
[{"id":"1","question":"...","category":"memory|emotion|detail|context"}]`

  const text = await callClaude(system, 'Generate memory prompt questions.')

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as AIPromptQuestion[]
  } catch {
    return DEFAULT_PROMPTS
  }
}

// ── 3. Get historical context ─────────────────────────────

export const getHistoricalContext = async (
  era: string,
  location: string
): Promise<string> => {
  const system = `You are a historian specializing in everyday life across different eras.
Provide a short, vivid paragraph (3-4 sentences) describing what daily life was like
for ordinary families in the given time and place.
Focus on sensory details: food, clothing, sounds, social customs.
Write warmly, as if setting the scene for a family story.`

  return callClaude(
    system,
    `Describe everyday family life in ${location} during ${era}.`
  )
}

// ── 4. Generate story title suggestion ───────────────────

export const suggestTitle = async (content: string): Promise<string> => {
  const system = `You are a literary editor. 
Suggest one evocative, short title (3-7 words) for this family story.
The title should feel warm and timeless, like a chapter in a memoir.
Respond with ONLY the title text, nothing else.`

  return callClaude(system, content)
}

// ── 5. Generate AI image prompt for Pollinations ─────────

export const buildImagePrompt = (
  title: string,
  era?: string,
  location?: string
): string => {
  const parts = [
    'warm vintage photograph style',
    title,
    era ? `circa ${era}` : '',
    location ? `in ${location}` : '',
    'soft lighting, nostalgic, family memory, sepia tones, detailed, cinematic',
  ].filter(Boolean)
  return parts.join(', ')
}

export const getPollinationsImageUrl = (prompt: string): string =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=500&nologo=true`

// ── 6. Moderate / flag content ───────────────────────────

export const moderateContent = async (text: string): Promise<{
  safe: boolean
  reason?: string
}> => {
  const system = `You are a content moderator for a family-friendly platform.
Check if the text contains: hate speech, explicit sexual content, graphic violence, 
or content that could harm children.
Respond ONLY with JSON: {"safe": true} or {"safe": false, "reason": "brief reason"}`

  try {
    const result = await callClaude(system, text)
    const clean = result.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return { safe: true }
  }
}

// ── Default prompts (fallback) ────────────────────────────

const DEFAULT_PROMPTS: AIPromptQuestion[] = [
  { id: '1', question: 'What did the place look, smell or sound like?', category: 'detail' },
  { id: '2', question: 'How did you feel in that moment?', category: 'emotion' },
  { id: '3', question: 'Who else was there, and what were they doing?', category: 'memory' },
  { id: '4', question: 'What was happening in the world or your family at that time?', category: 'context' },
  { id: '5', question: 'What would you want your grandchildren to know about this?', category: 'memory' },
  { id: '6', question: 'Is there an object, smell or song that takes you back there?', category: 'detail' },
]