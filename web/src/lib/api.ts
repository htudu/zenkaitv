import { API_BASE_URL } from './config'
import type {
  AdminMovie,
  AdminMovieListResponse,
  AdminMovieUpdateRequest,
  AdminMovieVisibilityResponse,
  AdminUserCreateRequest,
  AdminUserListResponse,
  AdminUserUpdateRequest,
  AuthResponse,
  BlobCatalogSyncResponse,
  BlobUploadResponse,
  LocalMediaSyncResponse,
  Movie,
  NoteReaction,
  NoteReactionListResponse,
  PlaybackGrant,
  RandomNote,
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

export async function getAdminUsers(token: string) {
  const payload = await request<AdminUserListResponse>(
    '/api/v1/admin/users',
    {
      headers: buildAuthHeaders(token),
    },
    'Unable to load users',
  )

  return payload.items
}

export async function getAdminReactions(token: string, page = 1, pageSize = 20) {
  return request<NoteReactionListResponse>(
    `/api/v1/admin/reactions?page=${page}&page_size=${pageSize}`,
    {
      headers: buildAuthHeaders(token),
    },
    'Unable to load reactions',
  )
}

export async function createAdminUser(token: string, payload: AdminUserCreateRequest) {
  return request<User>(
    '/api/v1/admin/users',
    {
      method: 'POST',
      headers: buildAuthHeaders(token, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    },
    'Unable to create user',
  )
}

export async function updateAdminUser(token: string, userId: number, payload: AdminUserUpdateRequest) {
  return request<User>(
    `/api/v1/admin/users/${userId}`,
    {
      method: 'PUT',
      headers: buildAuthHeaders(token, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    },
    'Unable to update user',
  )
}

export async function deleteAdminUser(token: string, userId: number) {
  return request<User>(
    `/api/v1/admin/users/${userId}`,
    {
      method: 'DELETE',
      headers: buildAuthHeaders(token),
    },
    'Unable to delete user',
  )
}

export async function getAdminMovies(token: string) {
  const payload = await request<AdminMovieListResponse>(
    '/api/v1/admin/movies',
    {
      headers: buildAuthHeaders(token),
    },
    'Unable to load movies',
  )

  return payload.items
}

export async function updateAdminMovie(token: string, movieId: string, payload: AdminMovieUpdateRequest) {
  return request<AdminMovie>(
    `/api/v1/admin/movies/${movieId}`,
    {
      method: 'PUT',
      headers: buildAuthHeaders(token, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    },
    'Unable to update movie',
  )
}

export async function softDeleteAdminMovie(token: string, movieId: string) {
  return request<AdminMovieVisibilityResponse>(
    `/api/v1/admin/movies/${movieId}/soft-delete`,
    {
      method: 'POST',
      headers: buildAuthHeaders(token),
    },
    'Unable to soft delete movie',
  )
}

export async function restoreAdminMovie(token: string, movieId: string) {
  return request<AdminMovieVisibilityResponse>(
    `/api/v1/admin/movies/${movieId}/restore`,
    {
      method: 'POST',
      headers: buildAuthHeaders(token),
    },
    'Unable to restore movie',
  )
}

export async function getNoteReaction(noteId: string) {
  return request<NoteReaction>(
    `/api/v1/reactions/${encodeURIComponent(noteId)}`,
    {},
    'Unable to load reaction',
  )
}

export async function setNoteReaction(noteId: string, emoji: string, noteMessage?: string) {
  return request<NoteReaction>(
    `/api/v1/reactions/${encodeURIComponent(noteId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji, note_message: noteMessage }),
    },
    'Unable to save reaction',
  )
}

export async function getRandomNote() {
  return request<RandomNote>(
    '/api/v1/notes/random',
    {},
    'Unable to load note',
  )
}
