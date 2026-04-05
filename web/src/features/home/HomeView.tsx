import { API_BASE_URL } from '../../lib/config'
import { getInitials } from '../../lib/utils'
import { MovieGrid } from '../../components/MovieGrid'
import { NoteReactionBar } from '../../components/NoteReactionBar'
import { TypewriterText } from '../../components/TypewriterText'
import { VideoPlayer } from '../../components/VideoPlayer'
import type { Movie, PlaybackGrant, User } from '../../types'

type HomeViewProps = {
  currentUser: User | null
  currentUserPresent: boolean
  isAdmin: boolean
  isPriyankaNoteOpen: boolean
  loading: boolean
  movies: Movie[]
  noteLoading: boolean
  noteMessage: string | null
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void
  onLogout: () => void
  onNoteToggle: () => void
  onPasswordChange: (value: string) => void
  onUseCuratorCredentials: () => void
  onUseDemoCredentials: () => void
  onUsernameChange: (value: string) => void
  playbackLoading: boolean
  password: string
  selectedGrant: PlaybackGrant | null
  selectedMovie: Movie | null
  selectedMovieId: string | null
  onSelectMovie: (movieId: string) => void
  username: string
}

export function HomeView({
  currentUser,
  currentUserPresent,
  isAdmin,
  isPriyankaNoteOpen,
  loading,
  movies,
  noteLoading,
  noteMessage,
  onLogin,
  onLogout,
  onNoteToggle,
  onPasswordChange,
  onUseCuratorCredentials,
  onUseDemoCredentials,
  onUsernameChange,
  playbackLoading,
  password,
  selectedGrant,
  selectedMovie,
  selectedMovieId,
  onSelectMovie,
  username,
}: HomeViewProps) {
  if (!currentUserPresent) {
    return (
      <main className="home-layout home-layout-logged-out">
        <section className="logged-out-hero">
          <div className="logged-out-copy">
            <p className="eyebrow logged-out-greeting">✦ For Priyanka</p>

            <TypewriterText
              id="landing-tagline"
              className="landing-tagline"
              sequence={[
                'I left something here for you — a small note, tucked away, waiting to be found.',
              ]}
              speed={40}
              pauseBetween={3000}
            />

            <div className="logged-out-divider" aria-hidden="true" />

            <button
              type="button"
              className="landing-note-trigger"
              aria-expanded={isPriyankaNoteOpen}
              aria-controls="priyanka-note-panel"
              onClick={onNoteToggle}
            >
              <span className="landing-note-trigger-icon" aria-hidden="true">
                {isPriyankaNoteOpen ? '✕' : '✉'}
              </span>
              <span className="landing-note-trigger-text">
                {isPriyankaNoteOpen ? 'Close note' : 'Open the note'}
              </span>
            </button>

            <div
              id="priyanka-note-panel"
              className={`landing-note-panel ${isPriyankaNoteOpen ? 'landing-note-panel--visible' : ''}`}
            >
              <blockquote className="landing-note-quote">
                {noteLoading ? '...' : (noteMessage ?? 'Click the button to reveal a note.')}
              </blockquote>
              <NoteReactionBar noteId="priyanka-note" noteMessage={noteMessage ?? undefined} />
            </div>
          </div>

          <form className="landing-login-panel" onSubmit={onLogin}>
            <div className="landing-login-head">
              <p className="eyebrow">Member sign-in</p>
              <h3>Enter your screening room</h3>
              <p className="helper-copy landing-login-copy">
                Use your account credentials or start with a seeded demo profile.
              </p>
            </div>

            <label htmlFor="landing-username">Username</label>
            <input
              id="landing-username"
              aria-label="Username"
              value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              placeholder="Username"
              autoComplete="username"
            />

            <label htmlFor="landing-password">Password</label>
            <input
              id="landing-password"
              aria-label="Password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />

            <button type="submit" className="landing-login-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Log in'}
            </button>

            <div className="landing-login-presets" aria-label="Quick sign-in presets">
              <button type="button" className="landing-login-preset" onClick={onUseDemoCredentials}>
                Use demo account
              </button>
              <button type="button" className="landing-login-preset" onClick={onUseCuratorCredentials}>
                Use curator account
              </button>
            </div>

            <p className="helper-copy logged-out-helper">Demo: demo / demo123. Curator: curator / curator123.</p>
            <p className="landing-login-caption">Curator access includes movie management, user tables, uploads, sync, and packaging tools.</p>
          </form>
        </section>

        <footer className="landing-footer" aria-label="Founder and developer">
          <div className="landing-footer-copy">
            <p className="eyebrow landing-footer-eyebrow">Creator</p>
            <h3>Hambira Tudu</h3>
            <p className="landing-footer-manifesto">
              Quiet in approach, relentless in execution. He doesn't announce himself — he arrives with a sharp mind, calm hands, and a loyalty so fierce it looks dangerous from the outside. The gentleness is real. So is everything underneath it. Not the loudest, not the brightest light in the room — just the one still standing after every storm, precise, restless, and impossibly gentle with the things that matter.
            </p>
          </div>
          <div className="landing-footer-meta">
            <p className="landing-footer-meta-line">
              Python. Systems. Cloud. Quietly dangerous engineering.
            </p>
            <a href="https://htudu.github.io/hambira_tudu/" target="_blank" rel="noreferrer">
              Explore the profile
            </a>
          </div>
        </footer>
      </main>
    )
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar home-sidebar-full" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {currentUser && (
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
        )}

        {movies.length > 0 && (
          <div className="sidebar-catalog-section" style={{ flexGrow: 1 }}>
            <p className="eyebrow" style={{ marginBottom: '16px' }}>Recommended for you</p>
            <div className="sidebar-movie-list">
              {movies.slice(0, 6).map(movie => (
                <button
                  key={movie.id}
                  className={`sidebar-movie-card ${selectedMovieId === movie.id ? 'is-active' : ''}`}
                  onClick={() => onSelectMovie(movie.id)}
                >
                  {movie.poster_url ? (
                    <img src={`${API_BASE_URL}${movie.poster_url}`} alt={movie.title} />
                  ) : (
                    <div className="sidebar-movie-placeholder" />
                  )}
                  <div className="sidebar-movie-card-info">
                    <p className="sidebar-movie-card-title">{movie.title}</p>
                    <span className="sidebar-movie-card-meta">{movie.year} &bull; {movie.duration_minutes}m</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="home-content">
        <section className="player-stage">
        {selectedGrant && selectedMovie ? (
          <div className="player-shell">
            <div className="player-frame">
              <VideoPlayer src={`${API_BASE_URL}${selectedGrant.manifest_url}`} streamType={selectedGrant.stream_type} />
            </div>
            <div className="player-compact-metadata">
              <h2 className="player-compact-title">{selectedMovie.title}</h2>
              <div className="player-compact-facts">
                <span>{selectedMovie.year}</span>
                <span>{selectedMovie.duration_minutes} min</span>
                <span>{selectedGrant.stream_type}</span>
              </div>
              <p className="player-compact-summary">{selectedMovie.synopsis}</p>
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
    </div>
  )
}
