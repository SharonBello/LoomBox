import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { FamilyMember } from '@/types'

const COL = 'familyMembers'

const toDate = (val: unknown): Date => {
  if (val instanceof Date) return val
  if (val instanceof Timestamp) return val.toDate()
  return new Date()
}

const fromDoc = (id: string, d: Record<string, unknown>): FamilyMember => ({
  id,
  userId:    d.userId    as string,
  name:      d.name      as string,
  born:      d.born      as string | undefined,
  died:      d.died      as string | undefined,
  birthplace: d.birthplace as string | undefined,
  bio:       d.bio       as string | undefined,
  photoUrl:  d.photoUrl  as string | undefined,
  relations: (d.relations as FamilyMember['relations']) ?? [],
  createdAt: toDate(d.createdAt),
  updatedAt: toDate(d.updatedAt),
})

export const memberService = {
  async list(userId: string): Promise<FamilyMember[]> {
    const q    = query(collection(db, COL), where('userId', '==', userId))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => fromDoc(d.id, d.data()))
      .sort((a, b) => a.name.localeCompare(b.name))
  },

  async get(id: string): Promise<FamilyMember | null> {
    const snap = await getDoc(doc(db, COL, id))
    if (!snap.exists()) return null
    return fromDoc(snap.id, snap.data())
  },

  async create(userId: string, data: Partial<FamilyMember>): Promise<FamilyMember> {
    const now = new Date()
    const ref = await addDoc(collection(db, COL), {
      userId,
      name:      data.name      ?? 'Unknown',
      born:      data.born      ?? null,
      died:      data.died      ?? null,
      birthplace: data.birthplace ?? null,
      bio:       data.bio       ?? null,
      photoUrl:  data.photoUrl  ?? null,
      relations: data.relations ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return fromDoc(ref.id, { ...data, userId, createdAt: now, updatedAt: now } as Record<string, unknown>)
  },

  async update(id: string, data: Partial<FamilyMember>): Promise<void> {
    const { id: _id, createdAt: _ca, userId: _uid, ...rest } = data as Record<string, unknown>
    void _id; void _ca; void _uid
    await updateDoc(doc(db, COL, id), { ...rest, updatedAt: serverTimestamp() })
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id))
  },
}
