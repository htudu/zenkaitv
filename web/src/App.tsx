import { useEffect, useState } from 'react'
import { MovieGrid } from './components/MovieGrid'
import { VideoPlayer } from './components/VideoPlayer'
import type { AuthResponse, BlobUploadResponse, LocalMediaSyncResponse, Movie, PlaybackGrant, User } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const TOKEN_STORAGE_KEY = 'stream-movies-access-token'

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedGrant, setSelectedGrant] = useState<PlaybackGrant | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem(TOKEN_STORAGE_KEY) ?? '')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('demo123')
  const [blobPath, setBlobPath] = useState('')
  const [blobFile, setBlobFile] = useState<File | null>(null)
  const [overwriteBlob, setOverwriteBlob] = useState(false)
  const [blobUploadMessage, setBlobUploadMessage] = useState<string | null>(null)

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
      setSelectedGrant(null)
      return
    }

    void bootstrapSession(authToken)
  }, [authToken])

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
    setSelectedGrant(null)
  }

  async function requestPlaybackGrant(movieId: string) {
    if (!authToken) {
      setError('Log in before requesting a playback grant')
      return
    }

    setError(null)

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
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Private video platform foundation</p>
          <h1>Stream licensed movies with an open-source-first stack.</h1>
          <p className="hero-text">
            This implementation now includes seeded users, persisted catalog data, entitlement-aware access,
            and authenticated playback grants on top of the original UI and infrastructure scaffold.
          </p>
        </div>
        <aside className="hero-panel">
          {currentUser ? (
            <>
              <h2>Current session</h2>
              <p><strong>User:</strong> {currentUser.full_name}</p>
              <p><strong>Role:</strong> {currentUser.is_admin ? 'Curator' : 'Viewer'}</p>
              <p><strong>Username:</strong> {currentUser.username}</p>
              {currentUser.is_admin ? (
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
                </div>
              ) : null}
              <button type="button" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <h2>Demo login</h2>
              <form className="login-form" onSubmit={login}>
                <label htmlFor="username">Username</label>
                <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} />
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button type="submit" disabled={loading}>Log in</button>
              </form>
              <p className="helper-copy">Try `demo / demo123` or `curator / curator123`.</p>
            </>
          )}
        </aside>
      </header>

      <main className="content-grid">
        <section className="catalog-panel">
          <div className="section-header">
            <h2>Catalog</h2>
            <span>{currentUser ? (loading ? 'Loading' : `${movies.length} entitled titles`) : 'Authentication required'}</span>
          </div>
          {error ? <p className="error-banner">{error}</p> : null}
          <MovieGrid movies={movies} loading={loading} onRequestPlayback={requestPlaybackGrant} />
        </section>

        <section className="grant-panel">
          <div className="section-header">
            <h2>Playback grant</h2>
            <span>{currentUser ? 'Authenticated grant flow' : 'Sign in first'}</span>
          </div>

          {selectedGrant ? (
            <div className="grant-card">
              <p><strong>Movie:</strong> {selectedGrant.movie_id}</p>
              <p><strong>User ID:</strong> {selectedGrant.user_id}</p>
              <p><strong>Stream Type:</strong> {selectedGrant.stream_type}</p>
              <p><strong>Expires:</strong> {new Date(selectedGrant.expires_at).toLocaleString()}</p>
              <VideoPlayer src={`${API_BASE_URL}${selectedGrant.manifest_url}`} streamType={selectedGrant.stream_type} />
              <label htmlFor="manifest-url">Manifest URL</label>
              <textarea id="manifest-url" readOnly value={selectedGrant.manifest_url} rows={4} />
              <label htmlFor="delivery-notes">Delivery notes</label>
              <textarea
                id="delivery-notes"
                readOnly
                value={selectedGrant.delivery_notes.join('\n')}
                rows={6}
              />
            </div>
          ) : (
            <div className="empty-state">
              <p>{currentUser ? 'Select an entitled movie and request a playback grant.' : 'Log in to load your entitled library.'}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
