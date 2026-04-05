import type { AdminMovie, BlobCatalogSyncResponse, User } from '../../types'
import { AdminHeroSection } from './components/AdminHeroSection'
import { BlobUploadSection } from './components/BlobUploadSection'
import { CatalogSyncSection } from './components/CatalogSyncSection'
import { MovieManagementSection } from './components/MovieManagementSection'
import { SourcePackagingSection } from './components/SourcePackagingSection'
import { UserManagementSection } from './components/UserManagementSection'

type AdminViewProps = {
  adminMovieMessage: string | null
  adminMovies: AdminMovie[]
  adminUserMessage: string | null
  adminUsers: User[]
  blobCatalogSyncResult: BlobCatalogSyncResponse | null
  blobFile: File | null
  blobPath: string
  blobUploadMessage: string | null
  editingMovieId: string | null
  editingUserId: number | null
  loading: boolean
  movieFormDurationMinutes: string
  movieFormGenres: string
  movieFormPosterUrl: string
  movieFormSynopsis: string
  movieFormTitle: string
  movieFormYear: string
  movieCount: number
  overwriteBlob: boolean
  sourceGenres: string
  sourceMovieId: string
  sourceSynopsis: string
  sourceTitle: string
  sourceUploadMessage: string | null
  sourceYear: string
  onBlobFileChange: (file: File | null) => void
  onBlobPathChange: (value: string) => void
  onDeleteUser: (userId: number) => void
  onMovieFormDurationMinutesChange: (value: string) => void
  onMovieFormGenresChange: (value: string) => void
  onMovieFormPosterUrlChange: (value: string) => void
  onMovieFormSynopsisChange: (value: string) => void
  onMovieFormTitleChange: (value: string) => void
  onMovieFormYearChange: (value: string) => void
  onOverwriteBlobChange: (value: boolean) => void
  onResetMovieForm: () => void
  onResetUserForm: () => void
  onSelectMovieForEdit: (movie: AdminMovie) => void
  onSelectUserForEdit: (user: User) => void
  onSourceFileChange: (file: File | null) => void
  onSourceGenresChange: (value: string) => void
  onSourceMovieIdChange: (value: string) => void
  onSourceSynopsisChange: (value: string) => void
  onSourceTitleChange: (value: string) => void
  onSourceYearChange: (value: string) => void
  onSubmitAdminMovie: (event: React.FormEvent<HTMLFormElement>) => void
  onSubmitAdminUser: (event: React.FormEvent<HTMLFormElement>) => void
  onSyncBlobCatalog: () => void
  onSyncLocalMedia: () => void
  onToggleMovieDeleted: (movie: AdminMovie) => void
  onUploadBlobFile: (event: React.FormEvent<HTMLFormElement>) => void
  onUploadSourceVideo: (event: React.FormEvent<HTMLFormElement>) => void
  onUserFormFullNameChange: (value: string) => void
  onUserFormIsAdminChange: (value: boolean) => void
  onUserFormPasswordChange: (value: string) => void
  onUserFormUsernameChange: (value: string) => void
  userFormFullName: string
  userFormIsAdmin: boolean
  userFormPassword: string
  userFormUsername: string
}

export function AdminView({
  adminMovieMessage,
  adminMovies,
  adminUserMessage,
  adminUsers,
  blobCatalogSyncResult,
  blobFile,
  blobPath,
  blobUploadMessage,
  editingMovieId,
  editingUserId,
  loading,
  movieFormDurationMinutes,
  movieFormGenres,
  movieFormPosterUrl,
  movieFormSynopsis,
  movieFormTitle,
  movieFormYear,
  movieCount,
  overwriteBlob,
  sourceGenres,
  sourceMovieId,
  sourceSynopsis,
  sourceTitle,
  sourceUploadMessage,
  sourceYear,
  onBlobFileChange,
  onBlobPathChange,
  onDeleteUser,
  onMovieFormDurationMinutesChange,
  onMovieFormGenresChange,
  onMovieFormPosterUrlChange,
  onMovieFormSynopsisChange,
  onMovieFormTitleChange,
  onMovieFormYearChange,
  onOverwriteBlobChange,
  onResetMovieForm,
  onResetUserForm,
  onSelectMovieForEdit,
  onSelectUserForEdit,
  onSourceFileChange,
  onSourceGenresChange,
  onSourceMovieIdChange,
  onSourceSynopsisChange,
  onSourceTitleChange,
  onSourceYearChange,
  onSubmitAdminMovie,
  onSubmitAdminUser,
  onSyncBlobCatalog,
  onSyncLocalMedia,
  onToggleMovieDeleted,
  onUploadBlobFile,
  onUploadSourceVideo,
  onUserFormFullNameChange,
  onUserFormIsAdminChange,
  onUserFormPasswordChange,
  onUserFormUsernameChange,
  userFormFullName,
  userFormIsAdmin,
  userFormPassword,
  userFormUsername,
}: AdminViewProps) {
  return (
    <main className="admin-layout">
      <AdminHeroSection
        movieCount={movieCount}
        discoveredMovieCount={blobCatalogSyncResult?.discovered_movie_ids.length ?? 0}
        updatedMovieCount={blobCatalogSyncResult?.updated_movie_ids.length ?? 0}
      />

      <CatalogSyncSection
        blobCatalogSyncResult={blobCatalogSyncResult}
        loading={loading}
        onSyncBlobCatalog={onSyncBlobCatalog}
        onSyncLocalMedia={onSyncLocalMedia}
      />

      <section className="admin-grid admin-grid-management">
        <UserManagementSection
          adminUserMessage={adminUserMessage}
          adminUsers={adminUsers}
          editingUserId={editingUserId}
          loading={loading}
          onDeleteUser={onDeleteUser}
          onResetUserForm={onResetUserForm}
          onSelectUserForEdit={onSelectUserForEdit}
          onSubmitAdminUser={onSubmitAdminUser}
          onUserFormFullNameChange={onUserFormFullNameChange}
          onUserFormIsAdminChange={onUserFormIsAdminChange}
          onUserFormPasswordChange={onUserFormPasswordChange}
          onUserFormUsernameChange={onUserFormUsernameChange}
          userFormFullName={userFormFullName}
          userFormIsAdmin={userFormIsAdmin}
          userFormPassword={userFormPassword}
          userFormUsername={userFormUsername}
        />

        <MovieManagementSection
          adminMovieMessage={adminMovieMessage}
          adminMovies={adminMovies}
          editingMovieId={editingMovieId}
          loading={loading}
          movieFormDurationMinutes={movieFormDurationMinutes}
          movieFormGenres={movieFormGenres}
          movieFormPosterUrl={movieFormPosterUrl}
          movieFormSynopsis={movieFormSynopsis}
          movieFormTitle={movieFormTitle}
          movieFormYear={movieFormYear}
          onMovieFormDurationMinutesChange={onMovieFormDurationMinutesChange}
          onMovieFormGenresChange={onMovieFormGenresChange}
          onMovieFormPosterUrlChange={onMovieFormPosterUrlChange}
          onMovieFormSynopsisChange={onMovieFormSynopsisChange}
          onMovieFormTitleChange={onMovieFormTitleChange}
          onMovieFormYearChange={onMovieFormYearChange}
          onResetMovieForm={onResetMovieForm}
          onSelectMovieForEdit={onSelectMovieForEdit}
          onSubmitAdminMovie={onSubmitAdminMovie}
          onToggleMovieDeleted={onToggleMovieDeleted}
        />
      </section>

      <section className="admin-grid">
        <BlobUploadSection
          blobFile={blobFile}
          blobPath={blobPath}
          blobUploadMessage={blobUploadMessage}
          loading={loading}
          overwriteBlob={overwriteBlob}
          onBlobFileChange={onBlobFileChange}
          onBlobPathChange={onBlobPathChange}
          onOverwriteBlobChange={onOverwriteBlobChange}
          onUploadBlobFile={onUploadBlobFile}
        />

        <SourcePackagingSection
          loading={loading}
          onSourceFileChange={onSourceFileChange}
          onSourceGenresChange={onSourceGenresChange}
          onSourceMovieIdChange={onSourceMovieIdChange}
          onSourceSynopsisChange={onSourceSynopsisChange}
          onSourceTitleChange={onSourceTitleChange}
          onSourceYearChange={onSourceYearChange}
          onUploadSourceVideo={onUploadSourceVideo}
          sourceGenres={sourceGenres}
          sourceMovieId={sourceMovieId}
          sourceSynopsis={sourceSynopsis}
          sourceTitle={sourceTitle}
          sourceUploadMessage={sourceUploadMessage}
          sourceYear={sourceYear}
        />
      </section>
    </main>
  )
}
