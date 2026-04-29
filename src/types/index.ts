// ============================================================
// LoomBox — Shared TypeScript Types
// ============================================================

// --- Auth ------------------------------------------------

export interface User {
  uid:         string
  email:       string | null
  displayName: string | null
  photoURL:    string | null
  createdAt:   Date
}

// --- Family Tree ----------------------------------------

export type RelationType =
  | 'parent'
  | 'child'
  | 'sibling'
  | 'spouse'
  | 'grandparent'
  | 'grandchild'
  | 'aunt_uncle'
  | 'niece_nephew'
  | 'cousin'

export interface FamilyMember {
  id:          string
  userId:      string
  name:        string
  born?:       string        // ISO date string
  died?:       string        // ISO date string
  birthplace?: string
  bio?:        string
  photoUrl?:   string
  relations:   Relation[]
  createdAt:   Date
  updatedAt:   Date
}

export interface Relation {
  memberId: string
  type:     RelationType
}

// --- Stories --------------------------------------------

export interface Story {
  id:           string
  userId:       string
  title:        string
  content:      string
  enhancedContent?: string
  era?:         string        // e.g. "1950s", "1942"
  location?:    string
  historicalContext?: string
  aiImageUrl?:  string
  photoUrls:    string[]
  taggedMemberIds: string[]
  isInBook:     boolean
  createdAt:    Date
  updatedAt:    Date
}

// --- Recipes --------------------------------------------

export interface Recipe {
  id:          string
  userId:      string
  name:        string
  from?:       string        // Who passed it down
  occasion?:   string
  ingredients: string
  steps:       string
  storyText?:  string
  photoUrls:   string[]
  taggedMemberIds: string[]
  isInBook:    boolean
  createdAt:   Date
  updatedAt:   Date
}

// --- Book -----------------------------------------------

export type BookStyle = 'heritage' | 'canvas' | 'scrapbook'

export interface BookConfig {
  userId:     string
  style:      BookStyle
  title:      string
  subtitle?:  string
  dedication?: string
  sections:   BookSection[]
  updatedAt:  Date
}

export type BookSectionType = 'stories' | 'tree' | 'recipes' | 'photos'

export interface BookSection {
  type:    BookSectionType
  enabled: boolean
  order:   number
  title?:  string
}

// --- UI / Store -----------------------------------------

export type Language = 'en' | 'he'

export interface AppState {
  user:         User | null
  language:     Language
  direction:    'ltr' | 'rtl'
  sidebarOpen:  boolean
  isAuthLoading: boolean
}

// --- AI Responses ---------------------------------------

export interface AIStoryResponse {
  enhancedContent:  string
  title?:           string
  historicalContext?: string
}

export interface AIImagePrompt {
  era:      string
  location: string
  keywords: string[]
}

export interface AIPromptQuestion {
  id:       string
  question: string
  category: 'memory' | 'emotion' | 'detail' | 'context'
}

// --- Firebase -------------------------------------------

export type FirestoreTimestamp = {
  toDate: () => Date
}

// Utility: convert Firestore timestamps to Date objects
export type WithDates<T> = {
  [K in keyof T]: T[K] extends Date ? Date : T[K]
}
