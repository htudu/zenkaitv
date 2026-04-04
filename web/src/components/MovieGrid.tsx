import type { Movie } from '../types'

type MovieGridProps = {
  movies: Movie[]
  loading: boolean
  onRequestPlayback: (movieId: string) => void
}

export function MovieGrid({ movies, loading, onRequestPlayback }: MovieGridProps) {
  if (loading) {
    return <div className="placeholder-grid">Loading catalog...</div>
  }

  if (movies.length === 0) {
    return <div className="placeholder-grid">No titles are currently available for this account.</div>
  }

  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <article key={movie.id} className="movie-card">
          <img src={movie.poster_url} alt={movie.title} />
          <div className="movie-card-body">
            <div className="movie-meta">
              <p>{movie.year}</p>
              <p>{movie.duration_minutes} min</p>
            </div>
            <h3>{movie.title}</h3>
            <p className="synopsis">{movie.synopsis}</p>
            <div className="genre-list">
              {movie.genres.map((genre) => (
                <span key={genre}>{genre}</span>
              ))}
              {movie.is_local ? <span>Local File</span> : null}
            </div>
            <button type="button" onClick={() => onRequestPlayback(movie.id)}>
              Request playback grant
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
