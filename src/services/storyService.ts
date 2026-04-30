import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where,
  serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Story } from '@/types'

const COL = 'stories'

// Safely convert Firestore Timestamp OR plain Date to Date
const toDate = (val: unknown): Date => {
  if (val instanceof Date) return val
  if (val instanceof Timestamp) return val.toDate()
  if (val && typeof (val as { toDate?: unknown }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate()
  }
  return new Date()
}

const fromDoc = (id: string, data: Record<string, unknown>): Story => ({
  id,
  userId: data.userId as string,
  title: data.title as string,
  content: data.content as string,
  enhancedContent: data.enhancedContent as string | undefined,
  era: data.era as string | undefined,
  location: data.location as string | undefined,
  historicalContext: data.historicalContext as string | undefined,
  aiImageUrl: data.aiImageUrl as string | undefined,
  photoUrls: (data.photoUrls as string[]) ?? [],
  taggedMemberIds: (data.taggedMemberIds as string[]) ?? [],
  isInBook: (data.isInBook as boolean) ?? false,
  createdAt: toDate(data.createdAt),
  updatedAt: toDate(data.updatedAt),
})

export const storyService = {
  // Sort in JS — avoids composite index requirement on Firestore
  async list(userId: string): Promise<Story[]> {
    const q = query(collection(db, COL), where('userId', '==', userId))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => fromDoc(d.id, d.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async get(id: string): Promise<Story | null> {
    const snap = await getDoc(doc(db, COL, id))
    if (!snap.exists()) return null
    return fromDoc(snap.id, snap.data())
  },

  async create(userId: string, data: Partial<Story>): Promise<Story> {
    const now = new Date()
    const ref = await addDoc(collection(db, COL), {
      userId,
      title: data.title ?? 'Untitled Story',
      content: data.content ?? '',
      enhancedContent: data.enhancedContent ?? null,
      era: data.era ?? null,
      location: data.location ?? null,
      historicalContext: data.historicalContext ?? null,
      aiImageUrl: data.aiImageUrl ?? null,
      photoUrls: data.photoUrls ?? [],
      taggedMemberIds: data.taggedMemberIds ?? [],
      isInBook: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    // Use plain Date so fromDoc doesn't crash on the returned object
    return fromDoc(ref.id, { ...data, userId, createdAt: now, updatedAt: now } as Record<string, unknown>)
  },

  async update(id: string, data: Partial<Story>): Promise<void> {
    const { id: _id, createdAt: _ca, ...rest } = data as Record<string, unknown>
    void _id; void _ca
    await updateDoc(doc(db, COL, id), { ...rest, updatedAt: serverTimestamp() })
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id))
  },

  async toggleInBook(id: string, isInBook: boolean): Promise<void> {
    await updateDoc(doc(db, COL, id), { isInBook, updatedAt: serverTimestamp() })
  },
}