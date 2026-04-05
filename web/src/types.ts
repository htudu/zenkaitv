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

export type BlobUploadResponse = {
  blob_name: string
  url: string
  content_type: string
  size_bytes: number
  overwritten: boolean
}

export type BlobCatalogSyncResponse = {
  container_name: string
  scanned_blob_names: string[]
  discovered_movie_ids: string[]
  created_movie_ids: string[]
  updated_movie_ids: string[]
  updated_tables: string[]
  entitlement_records_created: number
  total_blobs: number
  movies: BlobCatalogSyncMovieResult[]
}

export type BlobCatalogSyncMovieResult = {
  movie_id: string
  title: string
  status: string
  metadata_found: boolean
  blob_count: number
}

export type SourceVideoUploadResponse = {
  movie_id: string
  source_blob_name: string
  task_id: string
  status: string
  message: string
}
