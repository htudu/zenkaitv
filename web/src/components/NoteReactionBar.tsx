import { useEffect, useState } from 'react'
import { getNoteReaction, setNoteReaction } from '../lib/api'

const REACTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '�', label: 'Fire' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '🥰', label: 'Blush' },
  { emoji: '😳', label: 'Shy' },
  { emoji: '😐', label: 'Meh' },
  { emoji: '😒', label: 'Unamused' },
  { emoji: '😤', label: 'Angry' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '💔', label: 'Heartbreak' },
]

export function NoteReactionBar({ noteId }: { noteId: string }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void getNoteReaction(noteId)
      .then((data) => {
        if (data.emoji) {
          setSelected(data.emoji)
        }
      })
      .catch(() => {})
  }, [noteId])

  async function handleReaction(emoji: string) {
    if (saving) return

    const next = selected === emoji ? null : emoji
    setSelected(next)
    setPickerOpen(false)
    setSaving(true)

    try {
      if (next) {
        await setNoteReaction(noteId, next)
      }
    } catch {
      setSelected(selected)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="note-reactions">
      {/* Active reaction badge */}
      {selected && !pickerOpen && (
        <button
          type="button"
          className="note-reaction-badge note-reaction-badge--active"
          onClick={() => setPickerOpen(true)}
          title="Change reaction"
        >
          <span className="note-reaction-badge-emoji">{selected}</span>
        </button>
      )}

      {/* Picker trigger */}
      {!pickerOpen && (
        <button
          type="button"
          className="note-reaction-badge note-reaction-add"
          onClick={() => setPickerOpen(true)}
          title={selected ? 'Change reaction' : 'React to this note'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" x2="9.01" y1="9" y2="9" />
            <line x1="15" x2="15.01" y1="9" y2="9" />
          </svg>
        </button>
      )}

      {/* Inline picker tray */}
      {pickerOpen && (
        <div className="note-reaction-picker">
          {REACTIONS.map(({ emoji, label }) => (
            <button
              key={emoji}
              type="button"
              className={`note-reaction-pick ${selected === emoji ? 'note-reaction-pick--selected' : ''}`}
              aria-label={label}
              title={label}
              onClick={() => void handleReaction(emoji)}
              disabled={saving}
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            className="note-reaction-pick note-reaction-pick--close"
            onClick={() => setPickerOpen(false)}
            aria-label="Close reactions"
            title="Close"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
