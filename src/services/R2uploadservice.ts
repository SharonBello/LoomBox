/**
 * R2 Upload Service
 * Sends files to the Cloudflare Worker which stores them in R2.
 * Replaces the old base64-in-Firestore approach.
 */

const WORKER_URL = (import.meta.env.VITE_WORKER_URL as string | undefined)?.replace(/\/$/, '')
    ?? 'http://localhost:8787'

export interface UploadResult {
    url: string   // public URL to the uploaded file
    key: string   // R2 object key
}

/**
 * Upload a File to R2 via the Worker.
 * @param file     The File object to upload
 * @param userId   Firebase user UID (used to namespace files)
 * @param folder   Optional folder prefix (default: 'uploads')
 */
export const uploadToR2 = async (
    file: File,
    userId: string,
    folder = 'uploads',
): Promise<UploadResult> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', userId)
    formData.append('folder', folder)

    const res = await fetch(`${WORKER_URL}/api/upload`, {
        method: 'POST',
        body: formData,
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? `Upload failed: ${res.status}`)
    }

    return res.json() as Promise<UploadResult>
}

/**
 * Upload a base64 data URL to R2.
 * Useful for AI-generated SVG illustrations stored as data URLs.
 */
export const uploadDataUrlToR2 = async (
    dataUrl: string,
    userId: string,
    folder = 'illustrations',
): Promise<UploadResult> => {
    // Convert data URL to File
    const [header, base64] = dataUrl.split(',')
    const mimeMatch = header.match(/data:([^;]+)/)
    const mime = mimeMatch?.[1] ?? 'image/png'
    const ext = mime.split('/')[1] ?? 'png'
    const bytes = atob(base64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)

    const blob = new Blob([arr], { type: mime })
    const file = new File([blob], `image.${ext}`, { type: mime })

    return uploadToR2(file, userId, folder)
}