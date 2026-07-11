import { Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  email: string
  canAdd: boolean
  canEdit: boolean
  isSaving?: boolean
  onClose: () => void
  onSave: (next: { canAdd: boolean; canEdit: boolean }) => void
  onRemoveUser: () => void
}

export function EditPermissionModal({
  open,
  email,
  canAdd,
  canEdit,
  isSaving = false,
  onClose,
  onSave,
  onRemoveUser,
}: Props) {
  const [draftAdd, setDraftAdd] = useState(canAdd)
  const [draftEdit, setDraftEdit] = useState(canEdit)

  useEffect(() => {
    if (!open) return
    setDraftAdd(canAdd)
    setDraftEdit(canEdit)
  }, [open, canAdd, canEdit])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, isSaving, onClose])

  if (!open || typeof document === 'undefined') return null

  const canSave = draftAdd || draftEdit

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
      onClick={isSaving ? undefined : onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-permission-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="pr-8">
          <h2 id="edit-permission-title" className="text-xl font-semibold text-slate-900">
            Update access
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Change article permissions for{' '}
            <span className="font-medium text-slate-800">{email}</span>.
          </p>
        </div>

        <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-800">
            <span>
              <span className="font-medium">Can Add articles</span>
              <span className="mt-0.5 block text-xs text-slate-500">Create and publish new posts</span>
            </span>
            <input
              type="checkbox"
              checked={draftAdd}
              onChange={(e) => setDraftAdd(e.target.checked)}
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d]"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-800">
            <span>
              <span className="font-medium">Can Edit articles</span>
              <span className="mt-0.5 block text-xs text-slate-500">Edit existing published posts</span>
            </span>
            <input
              type="checkbox"
              checked={draftEdit}
              onChange={(e) => setDraftEdit(e.target.checked)}
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d]"
            />
          </label>
          {!canSave && (
            <p className="text-xs text-amber-700">
              Select at least one permission, or remove this user from the list.
            </p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-red-100 bg-red-50/60 p-4">
          <p className="text-sm font-medium text-slate-900">Remove user</p>
          <p className="mt-1 text-xs text-slate-600">
            Delete this person from the permissions list. They will lose add and edit access.
          </p>
          <button
            type="button"
            disabled={isSaving}
            onClick={onRemoveUser}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={15} />
            Remove user
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || !canSave}
            onClick={() => onSave({ canAdd: draftAdd, canEdit: draftEdit })}
            className="rounded-lg bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
