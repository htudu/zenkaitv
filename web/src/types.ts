export type Movie = {
  id: string
  title: string
  year: number
  duration_minutes: number
  synopsis: string
  poster_url: string
  genres: string[]
  is_local: boolean
}

export type User = {
  id: number
  username: string
  full_name: string
  is_admin: boolean
}

export type AuthResponse = {
  access_token: string
  token_type: string
  user: User
}

export type PlaybackGrant = {
  movie_id: string
  manifest_url: string
  token: string
  expires_at: string
  delivery_notes: string[]
  user_id: number
  stream_type: string
}

export type LocalMediaSyncResponse = {
  imported_movie_ids: string[]
  total_local_files: number
}
