type AdminHeroSectionProps = {
  movieCount: number
  discoveredMovieCount: number
  updatedMovieCount: number
}

export function AdminHeroSection({ movieCount, discoveredMovieCount, updatedMovieCount }: AdminHeroSectionProps) {
  return (
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
          <strong>{discoveredMovieCount}</strong>
          <span>Blob titles found</span>
        </div>
        <div className="admin-metric-card">
          <strong>{updatedMovieCount}</strong>
          <span>Last sync updated</span>
        </div>
      </div>
    </section>
  )
}
