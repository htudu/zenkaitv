import { API_BASE_URL } from './config'
import type {
  AuthResponse,
  BlobCatalogSyncResponse,
  BlobUploadResponse,
  LocalMediaSyncResponse,
  Movie,
  PlaybackGrant,
  SourceVideoUploadResponse,
  User,
} from '../types'

export class ApiRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

async function parseError(response: Response, fallbackMessage: string) {
  try {
    const payload = (await response.json()) as { detail?: string }
    return payload.detail ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

async function request<T>(path: string, init: RequestInit = {}, fallbackMessage: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, init)

  if (!response.ok) {
    throw new ApiRequestError(await parseError(response, fallbackMessage), response.status)
  }

  return (await response.json()) as T
}

function buildAuthHeaders(token: string, headers?: HeadersInit) {
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  }
}

export async function loginRequest(username: string, password: string) {
  return request<AuthResponse>(
    '/api/v1/auth/login',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    },
    'Invalid username or password',
  )
}

export async function getCurrentUser(token: string) {
  return request<User>(
    '/api/v1/auth/me',
    {
      headers: buildAuthHeaders(token),
    },
    'Unable to load your account',
  )
}

export async function getCatalog(token: string) {
  const payload = await request<{ items: Movie[] }>(
    '/api/v1/catalog/movies',
    {
      headers: buildAuthHeaders(token),
    },
    'Unable to load your library',
  )

  return payload.items
}

export async function createPlaybackGrant(token: string, movieId: string) {
  return request<PlaybackGrant>(
    '/api/v1/playback/grant',
    {
      method: 'POST',
      headers: buildAuthHeaders(token, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ movie_id: movieId }),
    },
    'Unable to create playback grant',
  )
}

export async function syncLocalMediaRequest(token: string) {
  return request<LocalMediaSyncResponse>(
    '/api/v1/admin/local-media/sync',
    {
      method: 'POST',
      headers: buildAuthHeaders(token),
    },
    'Unable to sync local media',
  )
}

export async function syncBlobCatalogRequest(token: string) {
  return request<BlobCatalogSyncResponse>(
    '/api/v1/admin/blob/sync-catalog',
    {
      method: 'POST',
      headers: buildAuthHeaders(token),
    },
    'Unable to sync the blob catalog',
  )
}

export async function uploadBlobFileRequest(token: string, formData: FormData) {
  return request<BlobUploadResponse>(
    '/api/v1/admin/blob/upload',
    {
      method: 'POST',
      headers: buildAuthHeaders(token),
      body: formData,
    },
    'Unable to upload file to blob storage',
  )
}

export async function uploadSourceVideoRequest(token: string, formData: FormData) {
  return request<SourceVideoUploadResponse>(
    '/api/v1/admin/source-video/upload',
    {
      method: 'POST',
      headers: buildAuthHeaders(token),
      body: formData,
    },
    'Unable to upload source video',
  )
}
