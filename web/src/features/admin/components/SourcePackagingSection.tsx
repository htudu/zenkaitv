type SourcePackagingSectionProps = {
  loading: boolean
  onSourceFileChange: (file: File | null) => void
  onSourceGenresChange: (value: string) => void
  onSourceMovieIdChange: (value: string) => void
  onSourceSynopsisChange: (value: string) => void
  onSourceTitleChange: (value: string) => void
  onSourceYearChange: (value: string) => void
  onUploadSourceVideo: (event: React.FormEvent<HTMLFormElement>) => void
  sourceGenres: string
  sourceMovieId: string
  sourceSynopsis: string
  sourceTitle: string
  sourceUploadMessage: string | null
  sourceYear: string
}

export function SourcePackagingSection({
  loading,
  onSourceFileChange,
  onSourceGenresChange,
  onSourceMovieIdChange,
  onSourceSynopsisChange,
  onSourceTitleChange,
  onSourceYearChange,
  onUploadSourceVideo,
  sourceGenres,
  sourceMovieId,
  sourceSynopsis,
  sourceTitle,
  sourceUploadMessage,
  sourceYear,
}: SourcePackagingSectionProps) {
  return (
    <form className="admin-panel upload-form" onSubmit={onUploadSourceVideo}>
      <div className="section-header compact-header admin-panel-header">
        <h2>Source packaging</h2>
        <span>Upload master and queue HLS job</span>
      </div>
      <label htmlFor="source-title">Source video title</label>
      <input
        id="source-title"
        value={sourceTitle}
        onChange={(event) => onSourceTitleChange(event.target.value)}
        placeholder="Movie title"
      />
      <label htmlFor="source-movie-id">Movie ID</label>
      <input
        id="source-movie-id"
        value={sourceMovieId}
        onChange={(event) => onSourceMovieIdChange(event.target.value)}
        placeholder="movie-id"
      />
      <label htmlFor="source-year">Release year</label>
      <input
        id="source-year"
        value={sourceYear}
        onChange={(event) => onSourceYearChange(event.target.value)}
        placeholder="2026"
      />
      <label htmlFor="source-genres">Genres</label>
      <input
        id="source-genres"
        value={sourceGenres}
        onChange={(event) => onSourceGenresChange(event.target.value)}
        placeholder="Drama,Production"
      />
      <label htmlFor="source-synopsis">Synopsis</label>
      <textarea
        id="source-synopsis"
        value={sourceSynopsis}
        onChange={(event) => onSourceSynopsisChange(event.target.value)}
        rows={3}
      />
      <label htmlFor="source-file">Source video file</label>
      <input
        id="source-file"
        type="file"
        accept="video/*"
        onChange={(event) => onSourceFileChange(event.target.files?.[0] ?? null)}
      />
      <button type="submit" disabled={loading}>
        Upload source and queue packaging
      </button>
      {sourceUploadMessage ? <p className="helper-copy">{sourceUploadMessage}</p> : null}
    </form>
  )
}
