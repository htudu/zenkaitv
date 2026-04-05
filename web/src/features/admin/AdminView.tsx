import { useState } from 'react'
import { getInitials } from '../../lib/utils'
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
  currentUser: User
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
  onLogout: () => void
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
  currentUser,
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
  onLogout,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'movie-form' | 'movie-list' | 'pipeline' | 'user-form' | 'user-list'>('overview')

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-profile">
          <div className="admin-sidebar-avatar">{getInitials(currentUser.full_name)}</div>
          <div className="admin-sidebar-user-info">
            <p className="admin-sidebar-name">{currentUser.full_name}</p>
            <p className="admin-sidebar-role">{currentUser.username} &bull; {currentUser.is_admin ? 'Curator' : 'Viewer'}</p>
          </div>
          <button type="button" className="admin-sidebar-logout" onClick={onLogout} aria-label="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </div>
        <nav className="admin-sidebar-nav">
          <button 
            type="button" 
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Overview
          </button>
          <button 
            type="button" 
            className={`admin-nav-item ${activeTab === 'movie-form' ? 'active' : ''}`}
            onClick={() => setActiveTab('movie-form')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            Media Management
          </button>
          <button 
            type="button" 
            className={`admin-nav-item ${activeTab === 'movie-list' ? 'active' : ''}`}
            onClick={() => setActiveTab('movie-list')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>
            Media Catalog
          </button>
          <button 
            type="button" 
            className={`admin-nav-item ${activeTab === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            Upload Pipeline
          </button>
          <button 
            type="button" 
            className={`admin-nav-item ${activeTab === 'user-form' ? 'active' : ''}`}
            onClick={() => setActiveTab('user-form')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            Add/Edit User
          </button>
          <button 
            type="button" 
            className={`admin-nav-item ${activeTab === 'user-list' ? 'active' : ''}`}
            onClick={() => setActiveTab('user-list')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            User Directory
          </button>
        </nav>
      </aside>

      <main className="admin-content">
        {activeTab === 'overview' && (
          <div className="admin-tab-pane">
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
          </div>
        )}

        {activeTab === 'movie-form' && (
          <div className="admin-tab-pane">
            <MovieManagementSection
              mode="form"
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
          </div>
        )}

        {activeTab === 'movie-list' && (
          <div className="admin-tab-pane">
            <MovieManagementSection
              mode="list"
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
              onSelectMovieForEdit={(movie) => {
                onSelectMovieForEdit(movie)
                setActiveTab('movie-form')
              }}
              onSubmitAdminMovie={onSubmitAdminMovie}
              onToggleMovieDeleted={onToggleMovieDeleted}
            />
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="admin-tab-pane admin-grid">
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
          </div>
        )}

        {activeTab === 'user-form' && (
          <div className="admin-tab-pane">
            <UserManagementSection
              mode="form"
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
          </div>
        )}

        {activeTab === 'user-list' && (
          <div className="admin-tab-pane">
            <UserManagementSection
              mode="list"
              adminUserMessage={adminUserMessage}
              adminUsers={adminUsers}
              editingUserId={editingUserId}
              loading={loading}
              onDeleteUser={onDeleteUser}
              onResetUserForm={onResetUserForm}
              onSelectUserForEdit={(user) => {
                onSelectUserForEdit(user)
                setActiveTab('user-form')
              }}
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
          </div>
        )}
      </main>
    </div>
  )
}
