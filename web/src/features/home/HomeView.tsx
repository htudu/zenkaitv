import { API_BASE_URL } from '../../lib/config'
import { MovieGrid } from '../../components/MovieGrid'
import { VideoPlayer } from '../../components/VideoPlayer'
import type { Movie, PlaybackGrant } from '../../types'

type HomeViewProps = {
  currentUserPresent: boolean
  loading: boolean
  movies: Movie[]
  playbackLoading: boolean
  selectedGrant: PlaybackGrant | null
  selectedMovie: Movie | null
  selectedMovieId: string | null
  onSelectMovie: (movieId: string) => void
}

export function HomeView({
  currentUserPresent,
  loading,
  movies,
  playbackLoading,
  selectedGrant,
  selectedMovie,
  selectedMovieId,
  onSelectMovie,
}: HomeViewProps) {
  return (
    <main className="home-layout">
      <section className="player-stage">
        {selectedGrant && selectedMovie ? (
          <div className="player-shell">
            <div className="player-copy">
              <p className="eyebrow">Now showing</p>
              <h2>{selectedMovie.title}</h2>
              <p className="player-summary">{selectedMovie.synopsis}</p>
              <div className="player-facts">
                <span>{selectedMovie.year}</span>
                <span>{selectedMovie.duration_minutes} min</span>
                <span>{selectedGrant.stream_type}</span>
              </div>
            </div>
            <div className="player-frame">
              <VideoPlayer src={`${API_BASE_URL}${selectedGrant.manifest_url}`} streamType={selectedGrant.stream_type} />
            </div>
          </div>
        ) : (
          <div className="empty-stage">
            <p>
              {currentUserPresent
                ? (playbackLoading ? 'Loading player...' : 'Choose a movie below to start playback.')
                : 'Log in to load the catalog.'}
            </p>
          </div>
        )}
      </section>

      <section className="catalog-dock">
        <div className="section-header compact-header">
          <h2>Movie catalog</h2>
          <span>{currentUserPresent ? (loading ? 'Loading catalog' : `${movies.length} titles`) : 'Authentication required'}</span>
        </div>
        <MovieGrid
          movies={movies}
          loading={loading}
          selectedMovieId={selectedMovieId}
          onSelectMovie={onSelectMovie}
        />
      </section>
    </main>
  )
}
