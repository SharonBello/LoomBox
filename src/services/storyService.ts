// ============================================================
// Story Service — Firestore CRUD for stories
// ============================================================

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy,
  serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Story } from '@/types'

const COL = 'stories'

// Firestore doc → Story
const fromDoc = (id: string, data: Record<string, unknown>): Story => ({
  id,
  userId:           data.userId as string,
  title:            data.title as string,
  content:          data.content as string,
  enhancedContent:  data.enhancedContent as string | undefined,
  era:              data.era as string | undefined,
  location:         data.location as string | undefined,
  historicalContext: data.historicalContext as string | undefined,
  aiImageUrl:       data.aiImageUrl as string | undefined,
  photoUrls:        (data.photoUrls as string[]) ?? [],
  taggedMemberIds:  (data.taggedMemberIds as string[]) ?? [],
  isInBook:         (data.isInBook as boolean) ?? false,
  createdAt:        (data.createdAt as Timestamp)?.toDate() ?? new Date(),
  updatedAt:        (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
})

export const storyService = {
  // List all stories for a user
  async list(userId: string): Promise<Story[]> {
    const q = query(
      collection(db, COL),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => fromDoc(d.id, d.data()))
  },

  // Get single story
  async get(id: string): Promise<Story | null> {
    const snap = await getDoc(doc(db, COL, id))
    if (!snap.exists()) return null
    return fromDoc(snap.id, snap.data())
  },

  // Create new story
  async create(userId: string, data: Partial<Story>): Promise<Story> {
    const ref = await addDoc(collection(db, COL), {
      userId,
      title:           data.title           ?? 'Untitled Story',
      content:         data.content         ?? '',
      enhancedContent: data.enhancedContent ?? null,
      era:             data.era             ?? null,
      location:        data.location        ?? null,
      historicalContext: data.historicalContext ?? null,
      aiImageUrl:      data.aiImageUrl      ?? null,
      photoUrls:       data.photoUrls       ?? [],
      taggedMemberIds: data.taggedMemberIds ?? [],
      isInBook:        false,
      createdAt:       serverTimestamp(),
      updatedAt:       serverTimestamp(),
    })
    return fromDoc(ref.id, { ...data, userId, createdAt: new Date(), updatedAt: new Date() } as Record<string, unknown>)
  },

  // Update story
  async update(id: string, data: Partial<Story>): Promise<void> {
    const { id: _id, createdAt: _ca, ...rest } = data as Record<string, unknown>
    void _id; void _ca
    await updateDoc(doc(db, COL, id), { ...rest, updatedAt: serverTimestamp() })
  },

  // Delete story
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id))
  },

  // Toggle in book
  async toggleInBook(id: string, isInBook: boolean): Promise<void> {
    await updateDoc(doc(db, COL, id), { isInBook, updatedAt: serverTimestamp() })
  },
}
