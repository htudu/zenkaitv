import type { User } from '../../../types'

type UserManagementSectionProps = {
  mode: 'form' | 'list'
  adminUserMessage: string | null
  adminUsers: User[]
  editingUserId: number | null
  loading: boolean
  onDeleteUser: (userId: number) => void
  onResetUserForm: () => void
  onSelectUserForEdit: (user: User) => void
  onSubmitAdminUser: (event: React.FormEvent<HTMLFormElement>) => void
  onUserFormFullNameChange: (value: string) => void
  onUserFormIsAdminChange: (value: boolean) => void
  onUserFormPasswordChange: (value: string) => void
  onUserFormUsernameChange: (value: string) => void
  userFormFullName: string
  userFormIsAdmin: boolean
  userFormPassword: string
  userFormUsername: string
}

export function UserManagementSection({
  mode,
  adminUserMessage,
  adminUsers,
  editingUserId,
  loading,
  onDeleteUser,
  onResetUserForm,
  onSelectUserForEdit,
  onSubmitAdminUser,
  onUserFormFullNameChange,
  onUserFormIsAdminChange,
  onUserFormPasswordChange,
  onUserFormUsernameChange,
  userFormFullName,
  userFormIsAdmin,
  userFormPassword,
  userFormUsername,
}: UserManagementSectionProps) {
  return (
    <div className="admin-panel admin-management-panel">
      {mode === 'form' && (
        <>
          <div className="section-header compact-header admin-panel-header">
            <h2>User management</h2>
          </div>
          <form className="upload-form" onSubmit={onSubmitAdminUser}>
        <label htmlFor="admin-user-username">Username</label>
        <input
          id="admin-user-username"
          value={userFormUsername}
          onChange={(event) => onUserFormUsernameChange(event.target.value)}
          placeholder="new-user"
        />
        <label htmlFor="admin-user-full-name">Full name</label>
        <input
          id="admin-user-full-name"
          value={userFormFullName}
          onChange={(event) => onUserFormFullNameChange(event.target.value)}
          placeholder="Viewer Name"
        />
        <label htmlFor="admin-user-password">Password {editingUserId !== null ? '(leave blank to keep current)' : ''}</label>
        <input
          id="admin-user-password"
          type="password"
          value={userFormPassword}
          onChange={(event) => onUserFormPasswordChange(event.target.value)}
          placeholder="Password"
        />
        <label className="checkbox-row" htmlFor="admin-user-is-admin">
          <input
            id="admin-user-is-admin"
            type="checkbox"
            checked={userFormIsAdmin}
            onChange={(event) => onUserFormIsAdminChange(event.target.checked)}
          />
          <span>Grant admin access</span>
        </label>
        <div className="admin-inline-actions">
          <button type="submit" disabled={loading}>
            {editingUserId === null ? 'Add user' : 'Update user'}
          </button>
          <button type="button" className="admin-muted-button" onClick={onResetUserForm} disabled={loading}>
            Clear
          </button>
        </div>
          {adminUserMessage ? <p className="helper-copy">{adminUserMessage}</p> : null}
        </form>
        </>
      )}
      
      {mode === 'list' && (
        <>
          <div className="section-header compact-header admin-panel-header">
            <h2>User directory</h2>
            <span>{adminUsers.length} user(s)</span>
          </div>
          <div className="admin-list-table">
            <div className="admin-list-row admin-list-head">
              <span>User</span>
              <span>Role</span>
              <span>Actions</span>
            </div>
            {adminUsers.map((user) => (
              <div key={user.id} className="admin-list-row">
                <span>{user.full_name} ({user.username})</span>
                <span>{user.is_admin ? 'Admin' : 'Viewer'}</span>
                <span className="admin-row-actions">
                  <button type="button" className="admin-muted-button" onClick={() => onSelectUserForEdit(user)} disabled={loading}>
                    Edit
                  </button>
                  <button type="button" className="admin-danger-button" onClick={() => onDeleteUser(user.id)} disabled={loading}>
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
