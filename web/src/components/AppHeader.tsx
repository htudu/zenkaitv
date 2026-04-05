import type { User } from '../types'

type AppHeaderProps = {
  activeView: 'home' | 'admin'
  currentUser: User | null
  onViewChange: (view: 'home' | 'admin') => void
}

export function AppHeader({
  activeView,
  currentUser,
  onViewChange,
}: AppHeaderProps) {
  const isAdmin = Boolean(currentUser?.is_admin)

  return (
    <header className="app-nav">
      <div className="nav-brand">
        <p className="eyebrow">Private streaming platform</p>
        <h1 className="brand-title">Priyanka TV</h1>
      </div>

      {currentUser ? (
        <div className="nav-center-actions" role="tablist" aria-label="Primary sections">
          <button
            type="button"
            className={`nav-view-toggle${activeView === 'home' ? ' is-active' : ''}`}
            aria-pressed={activeView === 'home'}
            onClick={() => onViewChange('home')}
          >
            Home
          </button>
          {isAdmin ? (
            <button
              type="button"
              className={`nav-view-toggle${activeView === 'admin' ? ' is-active' : ''}`}
              aria-pressed={activeView === 'admin'}
              onClick={() => onViewChange('admin')}
            >
              Admin Workspace
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}
