import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Recipe } from '@/types'

const COL = 'recipes'

const toDate = (val: unknown): Date => {
  if (val instanceof Date) return val
  if (val instanceof Timestamp) return val.toDate()
  return new Date()
}

const fromDoc = (id: string, d: Record<string, unknown>): Recipe => ({
  id,
  userId:          d.userId      as string,
  name:            d.name        as string,
  from:            d.from        as string | undefined,
  occasion:        d.occasion    as string | undefined,
  ingredients:     d.ingredients as string,
  steps:           d.steps       as string,
  storyText:       d.storyText   as string | undefined,
  photoUrls:       (d.photoUrls  as string[]) ?? [],
  taggedMemberIds: (d.taggedMemberIds as string[]) ?? [],
  isInBook:        (d.isInBook   as boolean) ?? false,
  createdAt:       toDate(d.createdAt),
  updatedAt:       toDate(d.updatedAt),
})

export const recipeService = {
  async list(userId: string): Promise<Recipe[]> {
    const q    = query(collection(db, COL), where('userId', '==', userId))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => fromDoc(d.id, d.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async get(id: string): Promise<Recipe | null> {
    const snap = await getDoc(doc(db, COL, id))
    if (!snap.exists()) return null
    return fromDoc(snap.id, snap.data())
  },

  async create(userId: string, data: Partial<Recipe>): Promise<Recipe> {
    const now = new Date()
    const ref = await addDoc(collection(db, COL), {
      userId,
      name:            data.name        ?? 'Untitled Recipe',
      from:            data.from        ?? null,
      occasion:        data.occasion    ?? null,
      ingredients:     data.ingredients ?? '',
      steps:           data.steps       ?? '',
      storyText:       data.storyText   ?? null,
      photoUrls:       data.photoUrls   ?? [],
      taggedMemberIds: data.taggedMemberIds ?? [],
      isInBook:        false,
      createdAt:       serverTimestamp(),
      updatedAt:       serverTimestamp(),
    })
    return fromDoc(ref.id, { ...data, userId, createdAt: now, updatedAt: now } as Record<string, unknown>)
  },

  async update(id: string, data: Partial<Recipe>): Promise<void> {
    const { id: _id, createdAt: _ca, userId: _uid, ...rest } = data as Record<string, unknown>
    void _id; void _ca; void _uid
    await updateDoc(doc(db, COL, id), { ...rest, updatedAt: serverTimestamp() })
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id))
  },

  async toggleInBook(id: string, isInBook: boolean): Promise<void> {
    await updateDoc(doc(db, COL, id), { isInBook, updatedAt: serverTimestamp() })
  },
}
