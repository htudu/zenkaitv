import type { BlobCatalogSyncResponse } from '../../types'

type AdminViewProps = {
  blobCatalogSyncResult: BlobCatalogSyncResponse | null
  blobFile: File | null
  blobPath: string
  blobUploadMessage: string | null
  loading: boolean
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
  onOverwriteBlobChange: (value: boolean) => void
  onSourceFileChange: (file: File | null) => void
  onSourceGenresChange: (value: string) => void
  onSourceMovieIdChange: (value: string) => void
  onSourceSynopsisChange: (value: string) => void
  onSourceTitleChange: (value: string) => void
  onSourceYearChange: (value: string) => void
  onSyncBlobCatalog: () => void
  onSyncLocalMedia: () => void
  onUploadBlobFile: (event: React.FormEvent<HTMLFormElement>) => void
  onUploadSourceVideo: (event: React.FormEvent<HTMLFormElement>) => void
}

export function AdminView({
  blobCatalogSyncResult,
  blobFile,
  blobPath,
  blobUploadMessage,
  loading,
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
  onOverwriteBlobChange,
  onSourceFileChange,
  onSourceGenresChange,
  onSourceMovieIdChange,
  onSourceSynopsisChange,
  onSourceTitleChange,
  onSourceYearChange,
  onSyncBlobCatalog,
  onSyncLocalMedia,
  onUploadBlobFile,
  onUploadSourceVideo,
}: AdminViewProps) {
  return (
    <main className="admin-layout">
      <section className="admin-panel admin-hero">
        <div>
          <p className="eyebrow">Curator workspace</p>
          <h2>Catalog operations</h2>
          <p className="helper-copy admin-hero-copy">
            Sync titles from local storage or Azure Blob, upload source masters, and queue packaging without cluttering the playback screen.
          </p>
        </div>
        <div className="admin-metrics">
          <div className="admin-metric-card">
            <strong>{movieCount}</strong>
            <span>Catalog titles</span>
          </div>
          <div className="admin-metric-card">
            <strong>{blobCatalogSyncResult?.discovered_movie_ids.length ?? 0}</strong>
            <span>Blob titles found</span>
          </div>
          <div className="admin-metric-card">
            <strong>{blobCatalogSyncResult?.updated_movie_ids.length ?? 0}</strong>
            <span>Last sync updated</span>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="section-header compact-header">
          <h2>Catalog sync</h2>
          <span>{loading ? 'Working...' : 'Reads from the movies blob container'}</span>
        </div>
        <div className="admin-actions admin-button-row">
          <button type="button" onClick={onSyncLocalMedia} disabled={loading}>
            Sync local videos
          </button>
          <button type="button" onClick={onSyncBlobCatalog} disabled={loading}>
            Sync movies container
          </button>
        </div>
        {blobCatalogSyncResult ? (
          <div className="sync-result-card">
            <p>
              Synced container <strong>{blobCatalogSyncResult.container_name}</strong>: {blobCatalogSyncResult.total_blobs} blob(s), discovered {blobCatalogSyncResult.discovered_movie_ids.length} movie id(s), created {blobCatalogSyncResult.created_movie_ids.length}, updated {blobCatalogSyncResult.updated_movie_ids.length}.
            </p>
            <p className="helper-copy">
              Refreshed tables: {blobCatalogSyncResult.updated_tables.join(', ')}. New entitlements: {blobCatalogSyncResult.entitlement_records_created}.
            </p>
            <p className="helper-copy">
              Movie ids: {blobCatalogSyncResult.discovered_movie_ids.length > 0 ? blobCatalogSyncResult.discovered_movie_ids.join(', ') : 'None'}
            </p>
            <div className="sync-result-table">
              <div className="sync-result-table-row sync-result-table-head">
                <span>Movie</span>
                <span>Status</span>
                <span>Metadata</span>
                <span>Blobs</span>
              </div>
              {blobCatalogSyncResult.movies.map((movieResult) => (
                <div key={movieResult.movie_id} className="sync-result-table-row">
                  <span>{movieResult.title}</span>
                  <span>{movieResult.status}</span>
                  <span>{movieResult.metadata_found ? 'metadata.json' : 'defaulted'}</span>
                  <span>{movieResult.blob_count}</span>
                </div>
              ))}
            </div>
            <details className="sync-result-details">
              <summary>Show scanned blob names</summary>
              <div className="sync-result-list">
                {blobCatalogSyncResult.scanned_blob_names.map((blobName) => (
                  <span key={blobName}>{blobName}</span>
                ))}
              </div>
            </details>
          </div>
        ) : null}
      </section>

      <section className="admin-grid">
        <form className="admin-panel upload-form" onSubmit={onUploadBlobFile}>
          <div className="section-header compact-header admin-panel-header">
            <h2>Blob upload</h2>
            <span>Direct file placement</span>
          </div>
          <label htmlFor="blob-path">Production blob path</label>
          <input
            id="blob-path"
            value={blobPath}
            onChange={(event) => onBlobPathChange(event.target.value)}
            placeholder="movie.mp4"
          />
          <label htmlFor="blob-file">File</label>
          <input
            id="blob-file"
            type="file"
            onChange={(event) => onBlobFileChange(event.target.files?.[0] ?? null)}
          />
          <label className="checkbox-row" htmlFor="overwrite-blob">
            <input
              id="overwrite-blob"
              type="checkbox"
              checked={overwriteBlob}
              onChange={(event) => onOverwriteBlobChange(event.target.checked)}
            />
            <span>Overwrite existing blob</span>
          </label>
          <button type="submit" disabled={loading || !blobFile}>
            Upload to blob
          </button>
          {blobUploadMessage ? <p className="helper-copy">{blobUploadMessage}</p> : null}
        </form>

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
      </section>
    </main>
  )
}
