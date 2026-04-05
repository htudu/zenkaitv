import type { BlobCatalogSyncResponse } from '../../../types'

type CatalogSyncSectionProps = {
  blobCatalogSyncResult: BlobCatalogSyncResponse | null
  loading: boolean
  onSyncBlobCatalog: () => void
  onSyncLocalMedia: () => void
}

export function CatalogSyncSection({
  blobCatalogSyncResult,
  loading,
  onSyncBlobCatalog,
  onSyncLocalMedia,
}: CatalogSyncSectionProps) {
  return (
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
  )
}
