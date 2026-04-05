import { getInitials } from '../lib/utils'
import type { User } from '../types'

type AppHeaderProps = {
  activeView: 'home' | 'admin'
  currentUser: User | null
  isLoading: boolean
  isUserPanelOpen: boolean
  password: string
  username: string
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void
  onLogout: () => void
  onPasswordChange: (value: string) => void
  onToggleUserPanel: () => void
  onUsernameChange: (value: string) => void
  onViewChange: (view: 'home' | 'admin') => void
}

export function AppHeader({
  activeView,
  currentUser,
  isLoading,
  isUserPanelOpen,
  password,
  username,
  onLogin,
  onLogout,
  onPasswordChange,
  onToggleUserPanel,
  onUsernameChange,
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
              Admin
            </button>
          ) : null}
        </div>
      ) : null}

      {currentUser ? (
        <div className={`nav-user-menu${isUserPanelOpen ? ' is-open' : ''}`}>
          <button
            type="button"
            className="nav-user-panel"
            aria-expanded={isUserPanelOpen}
            aria-label="Toggle user menu"
            onClick={onToggleUserPanel}
          >
            <div className="nav-avatar" aria-hidden="true">{getInitials(currentUser.full_name)}</div>
            <div className="nav-user-copy">
              <p className="nav-user-name">{currentUser.full_name}</p>
              <div className="nav-user-meta">
                <span>{currentUser.username}</span>
                <span>{currentUser.is_admin ? 'Curator' : 'Viewer'}</span>
              </div>
            </div>
            <span className="nav-user-chevron" aria-hidden="true">{isUserPanelOpen ? '▴' : '▾'}</span>
          </button>
          {isUserPanelOpen ? (
            <div className="nav-user-dropdown">
              <p className="nav-user-dropdown-label">Signed in as {currentUser.username}</p>
              <button type="button" className="nav-action nav-action-secondary nav-dropdown-action" onClick={onLogout}>
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <form className="nav-login-form" onSubmit={onLogin}>
          <input
            id="username"
            aria-label="Username"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="Username"
          />
          <input
            id="password"
            aria-label="Password"
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Password"
          />
          <button type="submit" className="nav-action" disabled={isLoading}>Log in</button>
        </form>
      )}
    </header>
  )
}
