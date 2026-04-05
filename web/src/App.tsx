import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { HomeView } from './features/home/HomeView'
import {
  createAdminUser,
  deleteAdminUser,
  getAdminMovies,
  getAdminUsers,
  getRandomNote,
  restoreAdminMovie,
  syncBlobCatalogRequest,
  syncLocalMediaRequest,
  updateAdminMovie,
  updateAdminUser,
  uploadBlobFileRequest,
  uploadSourceVideoRequest,
  softDeleteAdminMovie,
} from './lib/api'
import { usePlaybackCatalog } from './hooks/usePlaybackCatalog'
import { useSession } from './hooks/useSession'
import { slugify } from './lib/utils'
import type { AdminMovie, BlobCatalogSyncResponse, User } from './types'

const AdminView = lazy(async () => import('./features/admin/AdminView').then((module) => ({ default: module.AdminView })))

export default function App() {
  const [activeView, setActiveView] = useState<'home' | 'admin'>('home')
  const [isPriyankaNoteOpen, setIsPriyankaNoteOpen] = useState(false)
  const [noteMessage, setNoteMessage] = useState<string | null>(null)
  const [noteLoading, setNoteLoading] = useState(false)
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
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [adminMovies, setAdminMovies] = useState<AdminMovie[]>([])
  const [adminUserMessage, setAdminUserMessage] = useState<string | null>(null)
  const [adminMovieMessage, setAdminMovieMessage] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [userFormUsername, setUserFormUsername] = useState('')
  const [userFormFullName, setUserFormFullName] = useState('')
  const [userFormPassword, setUserFormPassword] = useState('')
  const [userFormIsAdmin, setUserFormIsAdmin] = useState(false)
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null)
  const [movieFormTitle, setMovieFormTitle] = useState('')
  const [movieFormYear, setMovieFormYear] = useState('')
  const [movieFormDurationMinutes, setMovieFormDurationMinutes] = useState('0')
  const [movieFormSynopsis, setMovieFormSynopsis] = useState('')
  const [movieFormPosterUrl, setMovieFormPosterUrl] = useState('')
  const [movieFormGenres, setMovieFormGenres] = useState('')

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
    setCurrentUser,
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

  const isAdmin = Boolean(currentUser?.is_admin)

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

  useEffect(() => {
    if (!authToken || !isAdmin || activeView !== 'admin') {
      return
    }

    void refreshAdminData(authToken).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
    })
  }, [activeView, authToken, isAdmin])

  async function refreshAdminData(token: string) {
    const [users, moviesPayload] = await Promise.all([getAdminUsers(token), getAdminMovies(token)])
    setAdminUsers(users)
    setAdminMovies(moviesPayload)
  }

  function resetUserForm() {
    setEditingUserId(null)
    setUserFormUsername('')
    setUserFormFullName('')
    setUserFormPassword('')
    setUserFormIsAdmin(false)
  }

  function resetMovieForm() {
    setEditingMovieId(null)
    setMovieFormTitle('')
    setMovieFormYear('')
    setMovieFormDurationMinutes('0')
    setMovieFormSynopsis('')
    setMovieFormPosterUrl('')
    setMovieFormGenres('')
  }

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

  async function submitAdminUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!authToken || !currentUser?.is_admin) {
      setError('Only the curator account can manage users')
      return
    }

    setAdminUserMessage(null)
    setError(null)
    setLoading(true)

    try {
      if (editingUserId === null) {
        await createAdminUser(authToken, {
          username: userFormUsername.trim(),
          full_name: userFormFullName.trim(),
          password: userFormPassword,
          is_admin: userFormIsAdmin,
        })
        setAdminUserMessage('User created.')
      } else {
        const updatedUser = await updateAdminUser(authToken, editingUserId, {
          username: userFormUsername.trim(),
          full_name: userFormFullName.trim(),
          password: userFormPassword.trim() ? userFormPassword : undefined,
          is_admin: userFormIsAdmin,
        })
        if (currentUser.id === updatedUser.id) {
          setCurrentUser(updatedUser)
        }
        setAdminUserMessage('User updated.')
      }

      await refreshAdminData(authToken)
      resetUserForm()
    } catch (userError) {
      setError(userError instanceof Error ? userError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function startEditingUser(user: User) {
    setEditingUserId(user.id)
    setUserFormUsername(user.username)
    setUserFormFullName(user.full_name)
    setUserFormPassword('')
    setUserFormIsAdmin(user.is_admin)
    setAdminUserMessage(null)
  }

  async function removeAdminUser(userId: number) {
    if (!authToken || !currentUser?.is_admin) {
      setError('Only the curator account can manage users')
      return
    }

    setAdminUserMessage(null)
    setError(null)
    setLoading(true)

    try {
      await deleteAdminUser(authToken, userId)
      await refreshAdminData(authToken)
      if (editingUserId === userId) {
        resetUserForm()
      }
      setAdminUserMessage('User deleted.')
    } catch (userError) {
      setError(userError instanceof Error ? userError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function startEditingMovie(movie: AdminMovie) {
    setEditingMovieId(movie.id)
    setMovieFormTitle(movie.title)
    setMovieFormYear(String(movie.year))
    setMovieFormDurationMinutes(String(movie.duration_minutes))
    setMovieFormSynopsis(movie.synopsis)
    setMovieFormPosterUrl(movie.poster_url)
    setMovieFormGenres(movie.genres.join(','))
    setAdminMovieMessage(null)
  }

  async function submitAdminMovie(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!authToken || !currentUser?.is_admin || !editingMovieId) {
      setError('Choose a movie before updating it')
      return
    }

    setAdminMovieMessage(null)
    setError(null)
    setLoading(true)

    try {
      await updateAdminMovie(authToken, editingMovieId, {
        title: movieFormTitle.trim(),
        year: Number(movieFormYear),
        duration_minutes: Number(movieFormDurationMinutes),
        synopsis: movieFormSynopsis.trim(),
        poster_url: movieFormPosterUrl.trim(),
        genres: movieFormGenres.split(',').map((genre) => genre.trim()).filter(Boolean),
      })
      await refreshAdminData(authToken)
      await refreshLibrary(authToken)
      setAdminMovieMessage('Movie updated.')
    } catch (movieError) {
      setError(movieError instanceof Error ? movieError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function toggleMovieDeleted(movie: AdminMovie) {
    if (!authToken || !currentUser?.is_admin) {
      setError('Only the curator account can manage movies')
      return
    }

    setAdminMovieMessage(null)
    setError(null)
    setLoading(true)

    try {
      const payload = movie.is_deleted
        ? await restoreAdminMovie(authToken, movie.id)
        : await softDeleteAdminMovie(authToken, movie.id)
      await refreshAdminData(authToken)
      await refreshLibrary(authToken)
      setAdminMovieMessage(payload.message)
      if (editingMovieId === movie.id && !movie.is_deleted) {
        resetMovieForm()
      }
    } catch (movieError) {
      setError(movieError instanceof Error ? movieError.message : 'Unknown error')
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
      setError('Enter a blob file name such as movie.mp4')
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
      setBlobPath(file.name)
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

  return (
    <div className="app-shell">
      <AppHeader
        activeView={activeView}
        currentUser={currentUser}
        onViewChange={setActiveView}
      />

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
            currentUser={currentUser!}
            onLogout={logout}
            overwriteBlob={overwriteBlob}
            sourceGenres={sourceGenres}
            sourceMovieId={sourceMovieId}
            sourceSynopsis={sourceSynopsis}
            sourceTitle={sourceTitle}
            sourceUploadMessage={sourceUploadMessage}
            sourceYear={sourceYear}
            token={authToken!}
            adminMovieMessage={adminMovieMessage}
            adminMovies={adminMovies}
            adminUserMessage={adminUserMessage}
            adminUsers={adminUsers}
            editingMovieId={editingMovieId}
            editingUserId={editingUserId}
            movieFormDurationMinutes={movieFormDurationMinutes}
            movieFormGenres={movieFormGenres}
            movieFormPosterUrl={movieFormPosterUrl}
            movieFormSynopsis={movieFormSynopsis}
            movieFormTitle={movieFormTitle}
            movieFormYear={movieFormYear}
            onBlobFileChange={handleBlobFileChange}
            onBlobPathChange={setBlobPath}
            onOverwriteBlobChange={setOverwriteBlob}
            onResetMovieForm={resetMovieForm}
            onResetUserForm={resetUserForm}
            onSelectMovieForEdit={startEditingMovie}
            onSelectUserForEdit={startEditingUser}
            onSourceFileChange={handleSourceFileChange}
            onSourceGenresChange={setSourceGenres}
            onSourceMovieIdChange={handleSourceMovieIdChange}
            onSourceSynopsisChange={setSourceSynopsis}
            onSourceTitleChange={handleSourceTitleChange}
            onSourceYearChange={setSourceYear}
            onSubmitAdminMovie={submitAdminMovie}
            onSubmitAdminUser={submitAdminUser}
            onSyncBlobCatalog={syncBlobCatalog}
            onSyncLocalMedia={syncLocalMedia}
            onToggleMovieDeleted={toggleMovieDeleted}
            onUploadBlobFile={uploadBlobFile}
            onUploadSourceVideo={uploadSourceVideo}
            onUserFormFullNameChange={setUserFormFullName}
            onUserFormIsAdminChange={setUserFormIsAdmin}
            onUserFormPasswordChange={setUserFormPassword}
            onUserFormUsernameChange={setUserFormUsername}
            onDeleteUser={removeAdminUser}
            onMovieFormDurationMinutesChange={setMovieFormDurationMinutes}
            onMovieFormGenresChange={setMovieFormGenres}
            onMovieFormPosterUrlChange={setMovieFormPosterUrl}
            onMovieFormSynopsisChange={setMovieFormSynopsis}
            onMovieFormTitleChange={setMovieFormTitle}
            onMovieFormYearChange={setMovieFormYear}
            userFormFullName={userFormFullName}
            userFormIsAdmin={userFormIsAdmin}
            userFormPassword={userFormPassword}
            userFormUsername={userFormUsername}
          />
        </Suspense>
      ) : (
        <HomeView
          currentUser={currentUser}
          currentUserPresent={Boolean(currentUser)}
          isAdmin={isAdmin}
          isPriyankaNoteOpen={isPriyankaNoteOpen}
          loading={loading}
          movies={movies}
          noteLoading={noteLoading}
          noteMessage={noteMessage}
          onLogin={login}
          onLogout={logout}
          onNoteToggle={() => {
            const opening = !isPriyankaNoteOpen
            setIsPriyankaNoteOpen(opening)
            if (opening) {
              setNoteLoading(true)
              void getRandomNote()
                .then((data) => setNoteMessage(data.note))
                .catch(() => setNoteMessage('You are extraordinary — even when no words are enough to say it.'))
                .finally(() => setNoteLoading(false))
            }
          }}
          onPasswordChange={setPassword}
          onUseCuratorCredentials={() => {
            setUsername('curator')
            setPassword('curator123')
          }}
          onUseDemoCredentials={() => {
            setUsername('demo')
            setPassword('demo123')
          }}
          onUsernameChange={setUsername}
          playbackLoading={playbackLoading}
          password={password}
          selectedGrant={selectedGrant}
          selectedMovie={selectedMovie}
          selectedMovieId={selectedMovieId}
          onSelectMovie={setSelectedMovieId}
          username={username}
        />
      )}
    </div>
  )
}
