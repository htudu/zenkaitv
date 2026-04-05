import { useRef } from 'react'
import type { Movie } from '../types'

type MovieGridProps = {
  movies: Movie[]
  loading: boolean
  selectedMovieId: string | null
  onSelectMovie: (movieId: string) => void
}

export function MovieGrid({ movies, loading, selectedMovieId, onSelectMovie }: MovieGridProps) {
  const railRef = useRef<HTMLDivElement | null>(null)

  if (loading) {
    return <div className="placeholder-grid">Loading catalog...</div>
  }

  if (movies.length === 0) {
    return <div className="placeholder-grid">No titles are currently available for this account.</div>
  }

  function scrollRail(direction: 'left' | 'right') {
    const railElement = railRef.current
    if (!railElement) {
      return
    }

    const scrollOffset = railElement.clientWidth * 0.8
    railElement.scrollBy({
      left: direction === 'left' ? -scrollOffset : scrollOffset,
      behavior: 'smooth',
    })
  }

  return (
    <div className="movie-rail-shell">
      <button type="button" className="rail-arrow" aria-label="Scroll catalog left" onClick={() => scrollRail('left')}>
        ‹
      </button>
      <div ref={railRef} className="movie-rail" role="list" aria-label="Movie catalog">
        {movies.map((movie) => (
          <button
            key={movie.id}
            type="button"
            className={`movie-tile${selectedMovieId === movie.id ? ' is-selected' : ''}`}
            onClick={() => onSelectMovie(movie.id)}
            aria-label={`${movie.title} (${movie.year})`}
          >
            <img src={movie.poster_url} alt={movie.title} />
            <div className="movie-tile-overlay">
              <h3>{movie.title}</h3>
            </div>
          </button>
        ))}
      </div>
      <button type="button" className="rail-arrow" aria-label="Scroll catalog right" onClick={() => scrollRail('right')}>
        ›
      </button>
    </div>
  )
}
