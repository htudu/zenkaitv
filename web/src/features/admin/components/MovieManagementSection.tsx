import type { AdminMovie } from '../../../types'

type MovieManagementSectionProps = {
  mode: 'form' | 'list'
  adminMovieMessage: string | null
  adminMovies: AdminMovie[]
  editingMovieId: string | null
  loading: boolean
  movieFormDurationMinutes: string
  movieFormGenres: string
  movieFormPosterUrl: string
  movieFormSynopsis: string
  movieFormTitle: string
  movieFormYear: string
  onMovieFormDurationMinutesChange: (value: string) => void
  onMovieFormGenresChange: (value: string) => void
  onMovieFormPosterUrlChange: (value: string) => void
  onMovieFormSynopsisChange: (value: string) => void
  onMovieFormTitleChange: (value: string) => void
  onMovieFormYearChange: (value: string) => void
  onResetMovieForm: () => void
  onSelectMovieForEdit: (movie: AdminMovie) => void
  onSubmitAdminMovie: (event: React.FormEvent<HTMLFormElement>) => void
  onToggleMovieDeleted: (movie: AdminMovie) => void
}

export function MovieManagementSection({
  mode,
  adminMovieMessage,
  adminMovies,
  editingMovieId,
  loading,
  movieFormDurationMinutes,
  movieFormGenres,
  movieFormPosterUrl,
  movieFormSynopsis,
  movieFormTitle,
  movieFormYear,
  onMovieFormDurationMinutesChange,
  onMovieFormGenresChange,
  onMovieFormPosterUrlChange,
  onMovieFormSynopsisChange,
  onMovieFormTitleChange,
  onMovieFormYearChange,
  onResetMovieForm,
  onSelectMovieForEdit,
  onSubmitAdminMovie,
  onToggleMovieDeleted,
}: MovieManagementSectionProps) {
  return (
    <div className="admin-panel admin-management-panel">
      {mode === 'form' && (
        <>
          <div className="section-header compact-header admin-panel-header">
            <h2>Movie management</h2>
          </div>
          <form className="upload-form" onSubmit={onSubmitAdminMovie}>
        <label htmlFor="admin-movie-title">Title</label>
        <input
          id="admin-movie-title"
          value={movieFormTitle}
          onChange={(event) => onMovieFormTitleChange(event.target.value)}
          placeholder="Select a movie below"
          disabled={editingMovieId === null}
        />
        <label htmlFor="admin-movie-year">Year</label>
        <input
          id="admin-movie-year"
          value={movieFormYear}
          onChange={(event) => onMovieFormYearChange(event.target.value)}
          disabled={editingMovieId === null}
        />
        <label htmlFor="admin-movie-duration">Duration minutes</label>
        <input
          id="admin-movie-duration"
          value={movieFormDurationMinutes}
          onChange={(event) => onMovieFormDurationMinutesChange(event.target.value)}
          disabled={editingMovieId === null}
        />
        <label htmlFor="admin-movie-genres">Genres</label>
        <input
          id="admin-movie-genres"
          value={movieFormGenres}
          onChange={(event) => onMovieFormGenresChange(event.target.value)}
          placeholder="Drama,Sci-Fi"
          disabled={editingMovieId === null}
        />
        <label htmlFor="admin-movie-poster">Poster URL</label>
        <input
          id="admin-movie-poster"
          value={movieFormPosterUrl}
          onChange={(event) => onMovieFormPosterUrlChange(event.target.value)}
          disabled={editingMovieId === null}
        />
        <label htmlFor="admin-movie-synopsis">Synopsis</label>
        <textarea
          id="admin-movie-synopsis"
          rows={4}
          value={movieFormSynopsis}
          onChange={(event) => onMovieFormSynopsisChange(event.target.value)}
          disabled={editingMovieId === null}
        />
        <div className="admin-inline-actions">
          <button type="submit" disabled={loading || editingMovieId === null}>
            Update movie
          </button>
          <button type="button" className="admin-muted-button" onClick={onResetMovieForm} disabled={loading}>
            Clear
          </button>
        </div>
          {adminMovieMessage ? <p className="helper-copy">{adminMovieMessage}</p> : null}
        </form>
        </>
      )}

      {mode === 'list' && (
        <>
          <div className="section-header compact-header admin-panel-header">
            <h2>Movie library</h2>
            <span>{adminMovies.length} movie row(s)</span>
          </div>
          <div className="admin-list-table">
            <div className="admin-list-row admin-list-head admin-list-row-movie">
              <span>Movie</span>
              <span>Status</span>
              <span>Entitlements</span>
              <span>Actions</span>
            </div>
            {adminMovies.map((movie) => (
              <div key={movie.id} className="admin-list-row admin-list-row-movie">
                <span>{movie.title}</span>
                <span>{movie.is_deleted ? 'Soft deleted' : 'Visible'}</span>
                <span>{movie.entitlement_count}</span>
                <span className="admin-row-actions">
                  <button type="button" className="admin-muted-button" onClick={() => onSelectMovieForEdit(movie)} disabled={loading}>
                    Edit
                  </button>
                  <button type="button" className={movie.is_deleted ? 'admin-muted-button' : 'admin-danger-button'} onClick={() => onToggleMovieDeleted(movie)} disabled={loading}>
                    {movie.is_deleted ? 'Restore' : 'Soft delete'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
