import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { HomeView } from './features/home/HomeView'
import {
  syncBlobCatalogRequest,
  syncLocalMediaRequest,
  uploadBlobFileRequest,
  uploadSourceVideoRequest,
} from './lib/api'
import { usePlaybackCatalog } from './hooks/usePlaybackCatalog'
import { useSession } from './hooks/useSession'
import { slugify } from './lib/utils'
import type { BlobCatalogSyncResponse } from './types'

const AdminView = lazy(async () => import('./features/admin/AdminView').then((module) => ({ default: module.AdminView })))

export default function App() {
  const [activeView, setActiveView] = useState<'home' | 'admin'>('home')
  const [blobPath, setBlobPath] = useState('')
  const [blobFile, setBlobFile] = useState<File | null>(null)
  const [overwriteBlob, setOverwriteBlob] = useState(false)
  const [blobCatalogSyncResult, setBlobCatalogSyncResult] = useState<BlobCatalogSyncResponse | null>(null)
  const [blobUploadMessage, setBlobUploadMessage] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceMovieId, setSourceMovieId] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceYear, setSourceYear] = useState<string>(String(new Date().getFullYear()))
  const [sourceSynopsis, setSourceSynopsis] = useState('Uploaded for worker-based HLS packaging into Azure Blob Storage.')
  const [sourceGenres, setSourceGenres] = useState('Uploaded,Production')
  const [sourceUploadMessage, setSourceUploadMessage] = useState<string | null>(null)

  const resetView = useCallback(() => {
    setActiveView('home')
  }, [])

  const {
    authToken,
    currentUser,
    error,
    isUserPanelOpen,
    loading,
    password,
    setError,
    setIsUserPanelOpen,
    setLoading,
    setPassword,
    setUsername,
    username,
    login,
    logout,
  } = useSession({
    onRequireHomeView: resetView,
  })

  const {
    movies,
    playbackLoading,
    refreshLibrary,
    resetLibrary,
    selectedGrant,
    selectedMovieId,
    setSelectedMovieId,
  } = usePlaybackCatalog({
    authToken,
    onSessionExpired: logout,
  })

  useEffect(() => {
    if (!authToken) {
      resetLibrary()
      return
    }

    if (!currentUser) {
      return
    }

    void refreshLibrary(authToken).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
    })
  }, [authToken, currentUser, refreshLibrary, resetLibrary, setError])

  useEffect(() => {
    if (!currentUser?.is_admin && activeView === 'admin') {
      setActiveView('home')
    }
  }, [activeView, currentUser])

  async function syncLocalMedia() {
    if (!authToken || !currentUser?.is_admin) {
      setError('Only the curator account can sync local media files')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const payload = await syncLocalMediaRequest(authToken)
      await refreshLibrary(authToken)
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

      const payload = await uploadBlobFileRequest(authToken, formData)
      setBlobUploadMessage(`Uploaded ${payload.blob_name} (${payload.size_bytes} bytes)`)
      setBlobFile(null)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function syncBlobCatalog() {
    if (!authToken || !currentUser?.is_admin) {
      setError('Only the curator account can sync movies from blob storage')
      return
    }

    setBlobCatalogSyncResult(null)
    setError(null)
    setLoading(true)

    try {
      const payload = await syncBlobCatalogRequest(authToken)
      setBlobCatalogSyncResult(payload)
      await refreshLibrary(authToken)
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Unknown error')
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

      const payload = await uploadSourceVideoRequest(authToken, formData)
      setSourceUploadMessage(`Queued ${payload.movie_id} for packaging. Task: ${payload.task_id}`)
      setSourceFile(null)
      await refreshLibrary(authToken)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function handleBlobFileChange(file: File | null) {
    setBlobFile(file)

    if (file && !blobPath) {
      setBlobPath(`uploads/${file.name}`)
    }
  }

  function handleSourceTitleChange(value: string) {
    setSourceTitle(value)

    if (!sourceMovieId.trim()) {
      setSourceMovieId(slugify(value))
    }
  }

  function handleSourceMovieIdChange(value: string) {
    setSourceMovieId(slugify(value))
  }

  function handleSourceFileChange(file: File | null) {
    setSourceFile(file)

    if (file && !sourceTitle) {
      const inferredTitle = file.name.replace(/\.[^.]+$/, '')
      setSourceTitle(inferredTitle)

      if (!sourceMovieId.trim()) {
        setSourceMovieId(slugify(inferredTitle))
      }
    }
  }

  const selectedMovie = selectedMovieId ? movies.find((movie) => movie.id === selectedMovieId) ?? null : null
  const isAdmin = Boolean(currentUser?.is_admin)

  return (
    <div className="app-shell">
      <AppHeader
        activeView={activeView}
        currentUser={currentUser}
        isLoading={loading}
        isUserPanelOpen={isUserPanelOpen}
        password={password}
        username={username}
        onLogin={login}
        onLogout={logout}
        onPasswordChange={setPassword}
        onToggleUserPanel={() => setIsUserPanelOpen((currentValue) => !currentValue)}
        onUsernameChange={setUsername}
        onViewChange={setActiveView}
      />

      {!currentUser ? <p className="helper-copy nav-helper">Try demo / demo123 or curator / curator123.</p> : null}

      {error ? <p className="error-banner">{error}</p> : null}

      {activeView === 'admin' && isAdmin ? (
        <Suspense fallback={<main className="admin-layout"><section className="admin-panel">Loading admin tools...</section></main>}>
          <AdminView
            blobCatalogSyncResult={blobCatalogSyncResult}
            blobFile={blobFile}
            blobPath={blobPath}
            blobUploadMessage={blobUploadMessage}
            loading={loading}
            movieCount={movies.length}
            overwriteBlob={overwriteBlob}
            sourceGenres={sourceGenres}
            sourceMovieId={sourceMovieId}
            sourceSynopsis={sourceSynopsis}
            sourceTitle={sourceTitle}
            sourceUploadMessage={sourceUploadMessage}
            sourceYear={sourceYear}
            onBlobFileChange={handleBlobFileChange}
            onBlobPathChange={setBlobPath}
            onOverwriteBlobChange={setOverwriteBlob}
            onSourceFileChange={handleSourceFileChange}
            onSourceGenresChange={setSourceGenres}
            onSourceMovieIdChange={handleSourceMovieIdChange}
            onSourceSynopsisChange={setSourceSynopsis}
            onSourceTitleChange={handleSourceTitleChange}
            onSourceYearChange={setSourceYear}
            onSyncBlobCatalog={syncBlobCatalog}
            onSyncLocalMedia={syncLocalMedia}
            onUploadBlobFile={uploadBlobFile}
            onUploadSourceVideo={uploadSourceVideo}
          />
        </Suspense>
      ) : (
        <HomeView
          currentUserPresent={Boolean(currentUser)}
          loading={loading}
          movies={movies}
          playbackLoading={playbackLoading}
          selectedGrant={selectedGrant}
          selectedMovie={selectedMovie}
          selectedMovieId={selectedMovieId}
          onSelectMovie={setSelectedMovieId}
        />
      )}
    </div>
  )
}
