import { useCallback, useEffect, useState } from 'react'
import { getAdminReactions } from '../../../lib/api'
import type { NoteReaction } from '../../../types'

const PAGE_SIZE = 20

type ReactionListSectionProps = {
  token: string
}

export function ReactionListSection({ token }: ReactionListSectionProps) {
  const [reactions, setReactions] = useState<NoteReaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchPage = useCallback((p: number) => {
    setLoading(true)
    setError(null)
    void getAdminReactions(token, p, PAGE_SIZE)
      .then((data) => {
        setReactions(data.items)
        setTotal(data.total)
        setPage(data.page)
      })
      .catch(() => setError('Failed to load reactions'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  if (loading && reactions.length === 0) {
    return (
      <section className="admin-panel">
        <div className="section-header compact-header">
          <h2>Note Reactions</h2>
          <span>Loading...</span>
        </div>
      </section>
    )
  }

  if (error && reactions.length === 0) {
    return (
      <section className="admin-panel">
        <div className="section-header compact-header">
          <h2>Note Reactions</h2>
          <span className="error-banner">{error}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="admin-panel">
      <div className="section-header compact-header">
        <h2>Note Reactions</h2>
        <span>{total} {total === 1 ? 'reaction' : 'reactions'}</span>
      </div>

      {total === 0 ? (
        <p className="helper-copy">No reactions yet.</p>
      ) : (
        <>
          <div className="admin-list-table">
            <div className="admin-list-row admin-list-row-reaction admin-list-head">
              <span>Emoji</span>
              <span>Note Message</span>
              <span>Timestamp</span>
            </div>
            {reactions.map((reaction, index) => (
              <div
                key={`${reaction.note_id}-${reaction.created_at}-${index}`}
                className="admin-list-row admin-list-row-reaction"
              >
                <span style={{ fontSize: '1.4rem' }}>{reaction.emoji ?? '—'}</span>
                <span title={reaction.note_message ?? ''}>{reaction.note_message ?? <code>{reaction.note_id}</code>}</span>
                <span>{reaction.created_at ?? '—'}</span>
              </div>
            ))}
          </div>

          <div className="admin-pagination">
            <button
              type="button"
              className="admin-pagination-btn"
              disabled={page <= 1 || loading}
              onClick={() => fetchPage(page - 1)}
            >
              ← Prev
            </button>
            <span className="admin-pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="admin-pagination-btn"
              disabled={page >= totalPages || loading}
              onClick={() => fetchPage(page + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </section>
  )
}
