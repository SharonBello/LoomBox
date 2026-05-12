/**
 * Admin Service — reads all content across all users.
 * Only accessible to users with role === 'admin' in Firestore.
 */

import {
    collection, getDocs, doc, updateDoc, deleteDoc,
    query, orderBy, limit, where, getDoc,
    serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Story } from '@/types'

export interface AdminUser {
    uid: string
    email: string
    name: string
    role: 'admin' | 'member'
    createdAt: Date
    storyCount?: number
}

export interface FlaggedItem {
    id: string
    type: 'story' | 'recipe'
    title: string
    userId: string
    reason: string
    flaggedAt: Date
    reviewed: boolean
}

const toDate = (val: unknown): Date => {
    if (val instanceof Date) return val
    if (val instanceof Timestamp) return val.toDate()
    return new Date()
}

// ── User management ───────────────────────────────────────

export const adminService = {

    // Check if current user is admin
    async isAdmin(uid: string): Promise<boolean> {
        try {
            const snap = await getDoc(doc(db, 'users', uid))
            if (!snap.exists()) return false
            return snap.data()?.role === 'admin'
        } catch { return false }
    },

    // Get all users
    async listUsers(): Promise<AdminUser[]> {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(200)))
        return snap.docs.map(d => ({
            uid: d.id,
            email: d.data().email as string ?? '',
            name: d.data().name as string ?? 'Unknown',
            role: (d.data().role as 'admin' | 'member') ?? 'member',
            createdAt: toDate(d.data().createdAt),
        }))
    },

    // Promote/demote user role
    async setUserRole(uid: string, role: 'admin' | 'member'): Promise<void> {
        await updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() })
    },

    // ── Content overview ────────────────────────────────────

    async getAllStories(limitCount = 100): Promise<Story[]> {
        const snap = await getDocs(query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(limitCount)))
        return snap.docs.map(d => ({
            id: d.id,
            userId: d.data().userId as string,
            title: d.data().title as string,
            content: d.data().content as string,
            enhancedContent: d.data().enhancedContent as string | undefined,
            era: d.data().era as string | undefined,
            location: d.data().location as string | undefined,
            historicalContext: d.data().historicalContext as string | undefined,
            aiImageUrl: d.data().aiImageUrl as string | undefined,
            photoUrls: (d.data().photoUrls as string[]) ?? [],
            taggedMemberIds: (d.data().taggedMemberIds as string[]) ?? [],
            isInBook: (d.data().isInBook as boolean) ?? false,
            flagged: (d.data().flagged as boolean) ?? false,
            flagReason: d.data().flagReason as string | undefined,
            createdAt: toDate(d.data().createdAt),
            updatedAt: toDate(d.data().updatedAt),
        }))
    },

    // ── Flagged content ─────────────────────────────────────

    async getFlaggedStories(): Promise<Story[]> {
        const snap = await getDocs(query(
            collection(db, 'stories'),
            where('flagged', '==', true),
            orderBy('createdAt', 'desc'),
        ))
        return snap.docs.map(d => ({
            id: d.id,
            userId: d.data().userId as string,
            title: d.data().title as string,
            content: d.data().content as string,
            flagged: true,
            flagReason: d.data().flagReason as string | undefined,
            photoUrls: [],
            taggedMemberIds: [],
            isInBook: false,
            createdAt: toDate(d.data().createdAt),
            updatedAt: toDate(d.data().updatedAt),
        }))
    },

    // Flag a story
    async flagStory(storyId: string, reason: string): Promise<void> {
        await updateDoc(doc(db, 'stories', storyId), {
            flagged: true,
            flagReason: reason,
            flaggedAt: serverTimestamp(),
        })
    },

    // Clear flag (approve content)
    async approveStory(storyId: string): Promise<void> {
        await updateDoc(doc(db, 'stories', storyId), {
            flagged: false,
            flagReason: null,
            flaggedAt: null,
            reviewedAt: serverTimestamp(),
        })
    },

    // Delete any story (admin only)
    async deleteStory(storyId: string): Promise<void> {
        await deleteDoc(doc(db, 'stories', storyId))
    },

    // ── Stats ───────────────────────────────────────────────

    async getStats(): Promise<{
        totalStories: number
        totalUsers: number
        totalRecipes: number
        totalMembers: number
        flaggedCount: number
    }> {
        const [stories, users, recipes, members, flagged] = await Promise.all([
            getDocs(collection(db, 'stories')),
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'recipes')),
            getDocs(collection(db, 'familyMembers')),
            getDocs(query(collection(db, 'stories'), where('flagged', '==', true))),
        ])
        return {
            totalStories: stories.size,
            totalUsers: users.size,
            totalRecipes: recipes.size,
            totalMembers: members.size,
            flaggedCount: flagged.size,
        }
    },
}