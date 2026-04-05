import { useEffect, useState } from 'react'
import { MovieGrid } from './components/MovieGrid'
import { VideoPlayer } from './components/VideoPlayer'
import type {
  AuthResponse,
  BlobUploadResponse,
  LocalMediaSyncResponse,
  Movie,
  PlaybackGrant,
  SourceVideoUploadResponse,
  User,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const TOKEN_STORAGE_KEY = 'stream-movies-access-token'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedGrant, setSelectedGrant] = useState<PlaybackGrant | null>(null)
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null)
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [playbackLoading, setPlaybackLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem(TOKEN_STORAGE_KEY) ?? '')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('demo123')
  const [blobPath, setBlobPath] = useState('')
  const [blobFile, setBlobFile] = useState<File | null>(null)
  const [overwriteBlob, setOverwriteBlob] = useState(false)
  const [blobUploadMessage, setBlobUploadMessage] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceMovieId, setSourceMovieId] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceYear, setSourceYear] = useState<string>(String(new Date().getFullYear()))
  const [sourceSynopsis, setSourceSynopsis] = useState('Uploaded for worker-based HLS packaging into Azure Blob Storage.')
  const [sourceGenres, setSourceGenres] = useState('Uploaded,Production')
  const [sourceUploadMessage, setSourceUploadMessage] = useState<string | null>(null)

  async function loadLibrary(token: string) {
    const moviesResponse = await fetch(`${API_BASE_URL}/api/v1/catalog/movies`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (moviesResponse.status === 401) {
      logout()
      throw new Error('Your session expired. Log in again.')
    }

    if (!moviesResponse.ok) {
      throw new Error('Unable to load your library')
    }

    const moviesPayload = (await moviesResponse.json()) as { items: Movie[] }
    setMovies(moviesPayload.items)
  }

  useEffect(() => {
    if (!authToken) {
      setCurrentUser(null)
      setMovies([])
      setSelectedMovieId(null)
      setSelectedGrant(null)
      setIsUserPanelOpen(false)
      return
    }

    void bootstrapSession(authToken)
  }, [authToken])

  useEffect(() => {
    if (movies.length === 0) {
      setSelectedMovieId(null)
      setSelectedGrant(null)
      return
    }

    const selectedMovieStillExists = selectedMovieId
      ? movies.some((movie) => movie.id === selectedMovieId)
      : false

    if (!selectedMovieStillExists) {
      setSelectedMovieId(movies[0].id)
    }
  }, [movies, selectedMovieId])

  useEffect(() => {
    if (!authToken || !selectedMovieId) {
      return
    }

    void requestPlaybackGrant(selectedMovieId)
  }, [authToken, selectedMovieId])

  async function bootstrapSession(token: string) {
    setLoading(true)
    setError(null)

    try {
      const meResponse = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (meResponse.status === 401) {
        logout()
        throw new Error('Your session expired. Log in again.')
      }

      if (!meResponse.ok) {
        throw new Error('Unable to load your account')
      }

      const mePayload = (await meResponse.json()) as User
      setCurrentUser(mePayload)
      await loadLibrary(token)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function syncLocalMedia() {
    if (!authToken || !currentUser?.is_admin) {
      setError('Only the curator account can sync local media files')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/local-media/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      })

      if (!response.ok) {
        const payload = (await response.json()) as { detail?: string }
        throw new Error(payload.detail ?? 'Unable to sync local media')
      }

      const payload = (await response.json()) as LocalMediaSyncResponse
      await loadLibrary(authToken)
      setError(
        payload.imported_movie_ids.length > 0
          ? `Imported ${payload.imported_movie_ids.length} new local video(s).`
          : `Local media scan complete. ${payload.total_local_files} file(s) available.`,
      )
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function uploadBlobFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!authToken || !currentUser?.is_admin) {
      setError('Only the curator account can upload files to production blob storage')
      return
    }

    if (!blobFile) {
      setError('Choose a file before uploading to blob storage')
      return
    }

    if (!blobPath.trim()) {
      setError('Enter a blob path such as hls/movie-id/master.m3u8')
      return
    }

    setBlobUploadMessage(null)
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('blob_path', blobPath.trim())
      formData.append('overwrite', String(overwriteBlob))
      formData.append('file', blobFile)

      const response = await fetch(`${API_BASE_URL}/api/v1/admin/blob/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const payload = (await response.json()) as { detail?: string }
        throw new Error(payload.detail ?? 'Unable to upload file to blob storage')
      }

      const payload = (await response.json()) as BlobUploadResponse
      setBlobUploadMessage(`Uploaded ${payload.blob_name} (${payload.size_bytes} bytes)`)
      setBlobFile(null)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function uploadSourceVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!authToken || !currentUser?.is_admin) {
      setError('Only the curator account can upload source videos for packaging')
      return
    }

    if (!sourceFile) {
      setError('Choose a source video file before starting packaging')
      return
    }

    if (!sourceMovieId.trim() || !sourceTitle.trim()) {
      setError('Movie ID and title are required for source uploads')
      return
    }

    setSourceUploadMessage(null)
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('movie_id', sourceMovieId.trim())
      formData.append('title', sourceTitle.trim())
      formData.append('year', sourceYear.trim())
      formData.append('synopsis', sourceSynopsis.trim())
      formData.append('genres', sourceGenres.trim())
      formData.append('file', sourceFile)

      const response = await fetch(`${API_BASE_URL}/api/v1/admin/source-video/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      })

      if (!response.ok) {
        const payload = (await response.json()) as { detail?: string }
        throw new Error(payload.detail ?? 'Unable to upload source video')
      }

      const payload = (await response.json()) as SourceVideoUploadResponse
      setSourceUploadMessage(`Queued ${payload.movie_id} for packaging. Task: ${payload.task_id}`)
      setSourceFile(null)
      await loadLibrary(authToken)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error('Invalid username or password')
      }

      const payload = (await response.json()) as AuthResponse
      localStorage.setItem(TOKEN_STORAGE_KEY, payload.access_token)
      setAuthToken(payload.access_token)
      setCurrentUser(payload.user)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setAuthToken('')
    setCurrentUser(null)
    setMovies([])
    setSelectedMovieId(null)
    setSelectedGrant(null)
    setIsUserPanelOpen(false)
  }

  async function requestPlaybackGrant(movieId: string) {
    if (!authToken) {
      setError('Log in before requesting a playback grant')
      return
    }

    setError(null)
    setPlaybackLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/playback/grant`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movie_id: movieId }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { detail?: string }
        throw new Error(payload.detail ?? 'Unable to create playback grant')
      }

      const payload = (await response.json()) as PlaybackGrant
      setSelectedGrant(payload)
    } catch (grantError) {
      setError(grantError instanceof Error ? grantError.message : 'Unknown error')
    } finally {
      setPlaybackLoading(false)
    }
  }

  const selectedMovie = selectedMovieId ? movies.find((movie) => movie.id === selectedMovieId) ?? null : null

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div className="nav-brand">
          <p className="eyebrow">Private streaming platform</p>
          <h1 className="brand-title">Priyanka TV</h1>
        </div>

        {currentUser ? (
          <div className={`nav-user-menu${isUserPanelOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="nav-user-panel"
              aria-expanded={isUserPanelOpen}
              aria-label="Toggle user menu"
              onClick={() => setIsUserPanelOpen((currentValue) => !currentValue)}
            >
              <div className="nav-avatar" aria-hidden="true">{getInitials(currentUser.full_name)}</div>
              <div className="nav-user-copy">
                <p className="nav-user-name">{currentUser.full_name}</p>
                <div className="nav-user-meta">
                  <span>{currentUser.username}</span>
                  <span>{currentUser.is_admin ? 'Curator' : 'Viewer'}</span>
                </div>
              </div>
              <span className="nav-user-chevron" aria-hidden="true">{isUserPanelOpen ? '▴' : '▾'}</span>
            </button>
            {isUserPanelOpen ? (
              <div className="nav-user-dropdown">
                <p className="nav-user-dropdown-label">Signed in as {currentUser.username}</p>
                <button type="button" className="nav-action nav-action-secondary nav-dropdown-action" onClick={logout}>
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <form className="nav-login-form" onSubmit={login}>
            <input
              id="username"
              aria-label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
            />
            <input
              id="password"
              aria-label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
            <button type="submit" className="nav-action" disabled={loading}>Log in</button>
          </form>
        )}
      </header>

      {!currentUser ? <p className="helper-copy nav-helper">Try demo / demo123 or curator / curator123.</p> : null}

      {error ? <p className="error-banner">{error}</p> : null}

      <main className="home-layout">
        <section className="player-stage">
          {selectedGrant && selectedMovie ? (
            <div className="player-shell">
              <div className="player-copy">
                <p className="eyebrow">Now showing</p>
                <h2>{selectedMovie.title}</h2>
                <p className="player-summary">{selectedMovie.synopsis}</p>
                <div className="player-facts">
                  <span>{selectedMovie.year}</span>
                  <span>{selectedMovie.duration_minutes} min</span>
                  <span>{selectedGrant.stream_type}</span>
                </div>
              </div>
              <div className="player-frame">
                <VideoPlayer src={`${API_BASE_URL}${selectedGrant.manifest_url}`} streamType={selectedGrant.stream_type} />
              </div>
            </div>
          ) : (
            <div className="empty-stage">
              <p>{currentUser ? (playbackLoading ? 'Loading player...' : 'Choose a movie below to start playback.') : 'Log in to load the catalog.'}</p>
            </div>
          )}
        </section>

        <section className="catalog-dock">
          <div className="section-header compact-header">
            <h2>Movie catalog</h2>
            <span>{currentUser ? (loading ? 'Loading catalog' : `${movies.length} titles`) : 'Authentication required'}</span>
          </div>
          <MovieGrid
            movies={movies}
            loading={loading}
            selectedMovieId={selectedMovieId}
            onSelectMovie={setSelectedMovieId}
          />
        </section>

        {currentUser?.is_admin ? (
          <details className="admin-drawer">
            <summary>Curator tools</summary>
            <div className="admin-actions">
              <button type="button" onClick={syncLocalMedia} disabled={loading}>
                Sync local videos
              </button>
              <form className="upload-form" onSubmit={uploadBlobFile}>
                <label htmlFor="blob-path">Production blob path</label>
                <input
                  id="blob-path"
                  value={blobPath}
                  onChange={(event) => setBlobPath(event.target.value)}
                  placeholder="hls/movie-id/master.m3u8"
                />
                <label htmlFor="blob-file">File</label>
                <input
                  id="blob-file"
                  type="file"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null
                    setBlobFile(nextFile)
                    if (nextFile && !blobPath) {
                      setBlobPath(`uploads/${nextFile.name}`)
                    }
                  }}
                />
                <label className="checkbox-row" htmlFor="overwrite-blob">
                  <input
                    id="overwrite-blob"
                    type="checkbox"
                    checked={overwriteBlob}
                    onChange={(event) => setOverwriteBlob(event.target.checked)}
                  />
                  <span>Overwrite existing blob</span>
                </label>
                <button type="submit" disabled={loading}>
                  Upload to blob
                </button>
                {blobUploadMessage ? <p className="helper-copy">{blobUploadMessage}</p> : null}
              </form>
              <form className="upload-form" onSubmit={uploadSourceVideo}>
                <label htmlFor="source-title">Source video title</label>
                <input
                  id="source-title"
                  value={sourceTitle}
                  onChange={(event) => {
                    const nextTitle = event.target.value
                    setSourceTitle(nextTitle)
                    if (!sourceMovieId.trim()) {
                      setSourceMovieId(slugify(nextTitle))
                    }
                  }}
                  placeholder="Movie title"
                />
                <label htmlFor="source-movie-id">Movie ID</label>
                <input
                  id="source-movie-id"
                  value={sourceMovieId}
                  onChange={(event) => setSourceMovieId(slugify(event.target.value))}
                  placeholder="movie-id"
                />
                <label htmlFor="source-year">Release year</label>
                <input
                  id="source-year"
                  value={sourceYear}
                  onChange={(event) => setSourceYear(event.target.value)}
                  placeholder="2026"
                />
                <label htmlFor="source-genres">Genres</label>
                <input
                  id="source-genres"
                  value={sourceGenres}
                  onChange={(event) => setSourceGenres(event.target.value)}
                  placeholder="Drama,Production"
                />
                <label htmlFor="source-synopsis">Synopsis</label>
                <textarea
                  id="source-synopsis"
                  value={sourceSynopsis}
                  onChange={(event) => setSourceSynopsis(event.target.value)}
                  rows={3}
                />
                <label htmlFor="source-file">Source video file</label>
                <input
                  id="source-file"
                  type="file"
                  accept="video/*"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null
                    setSourceFile(nextFile)
                    if (nextFile && !sourceTitle) {
                      const inferredTitle = nextFile.name.replace(/\.[^.]+$/, '')
                      setSourceTitle(inferredTitle)
                      if (!sourceMovieId.trim()) {
                        setSourceMovieId(slugify(inferredTitle))
                      }
                    }
                  }}
                />
                <button type="submit" disabled={loading}>
                  Upload source and queue packaging
                </button>
                {sourceUploadMessage ? <p className="helper-copy">{sourceUploadMessage}</p> : null}
              </form>
            </div>
          </details>
        ) : null}
      </main>
    </div>
  )
}
