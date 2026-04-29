// ============================================================
// Auth Service
// All Firebase authentication operations.
// ============================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from './firebase'
import type { User } from '@/types'

// --- Convert Firebase user to our User type ---------------

export const toAppUser = (fbUser: FirebaseUser): User => ({
  uid:         fbUser.uid,
  email:       fbUser.email,
  displayName: fbUser.displayName,
  photoURL:    fbUser.photoURL,
  createdAt:   new Date(),
})

// --- Ensure user doc exists in Firestore ------------------

const upsertUserDoc = async (fbUser: FirebaseUser): Promise<void> => {
  const ref  = doc(db, 'users', fbUser.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         fbUser.uid,
      email:       fbUser.email,
      displayName: fbUser.displayName,
      photoURL:    fbUser.photoURL,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    })
  }
}

// --- Sign In with Email -----------------------------------

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return toAppUser(cred.user)
}

// --- Sign Up with Email -----------------------------------

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  await upsertUserDoc(cred.user)
  return toAppUser(cred.user)
}

// --- Sign In with Google ----------------------------------

export const signInWithGoogle = async (): Promise<User> => {
  const cred = await signInWithPopup(auth, googleProvider)
  await upsertUserDoc(cred.user)
  return toAppUser(cred.user)
}

// --- Sign Out --------------------------------------------

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth)
}

// --- Password Reset --------------------------------------

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email)
}

// --- Auth State Observer ---------------------------------

export const onAuthChange = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, (fbUser) => {
    callback(fbUser ? toAppUser(fbUser) : null)
  })
}
