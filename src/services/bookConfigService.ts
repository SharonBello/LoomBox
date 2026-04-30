import {
  doc, setDoc, getDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { BookConfig, BookStyle } from '@/types'

const toDate = (val: unknown): Date => {
  if (val instanceof Date) return val
  if (val instanceof Timestamp) return val.toDate()
  return new Date()
}

const DEFAULT_CONFIG = (userId: string): BookConfig => ({
  userId,
  style:       'heritage',
  title:       'Our Family Story',
  subtitle:    '',
  dedication:  '',
  sections: [
    { type: 'stories',  enabled: true,  order: 0 },
    { type: 'tree',     enabled: true,  order: 1 },
    { type: 'recipes',  enabled: true,  order: 2 },
    { type: 'photos',   enabled: false, order: 3 },
  ],
  updatedAt: new Date(),
})

export const bookConfigService = {
  async get(userId: string): Promise<BookConfig> {
    const ref  = doc(db, 'bookConfigs', userId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return DEFAULT_CONFIG(userId)
    const d = snap.data()
    return {
      userId:      d.userId      as string,
      style:       (d.style      as BookStyle) ?? 'heritage',
      title:       (d.title      as string)    ?? 'Our Family Story',
      subtitle:    (d.subtitle   as string)    ?? '',
      dedication:  (d.dedication as string)    ?? '',
      sections:    (d.sections   as BookConfig['sections']) ?? DEFAULT_CONFIG(userId).sections,
      updatedAt:   toDate(d.updatedAt),
    }
  },

  async save(userId: string, config: Partial<BookConfig>): Promise<void> {
    const ref = doc(db, 'bookConfigs', userId)
    await setDoc(ref, { ...config, userId, updatedAt: serverTimestamp() }, { merge: true })
  },
}
