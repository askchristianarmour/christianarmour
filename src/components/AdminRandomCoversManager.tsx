import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckSquare, ImagePlus, Square, Trash2, Upload } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CrossLoader, CrossSpinner } from './CrossLoader'
import { useToast } from '../contexts/ToastContext'
import {
  deletePrandomCovers,
  fetchPrandomCoverPool,
  isPoolCover,
  LOCAL_FALLBACK_COVER_IMAGES,
  uploadPrandomCover,
} from '../lib/cover-images'

const PREVIEW_LIMIT = 8

type Props = {
  /** Preview on Profile settings: first images + link to full page. */
  variant?: 'preview' | 'full'
}

export function AdminRandomCoversManager({ variant = 'full' }: Props) {
  const isPreview = variant === 'preview'
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: pool = [], isLoading } = useQuery({
    queryKey: ['prandom-cover-pool'],
    queryFn: fetchPrandomCoverPool,
  })

  const remotePool = pool.filter((url) => isPoolCover(url) && !url.startsWith('/rprofile/'))
  const fullDisplayPool = remotePool.length > 0 ? remotePool : [...LOCAL_FALLBACK_COVER_IMAGES]
  const displayPool = isPreview ? fullDisplayPool.slice(0, PREVIEW_LIMIT) : fullDisplayPool
  const showingLocalOnly =
    remotePool.length === 0 && pool.every((url) => url.startsWith('/rprofile/'))
  const poolCount = remotePool.length > 0 ? remotePool.length : LOCAL_FALLBACK_COVER_IMAGES.length
  const hasMoreThanPreview = poolCount > PREVIEW_LIMIT

  const allSelected =
    !isPreview &&
    remotePool.length > 0 &&
    remotePool.every((url) => selectedUrls.includes(url))

  useEffect(() => {
    if (isPreview) return
    const remote = new Set(
      pool.filter((url) => isPoolCover(url) && !url.startsWith('/rprofile/'))
    )
    setSelectedUrls((prev) => {
      const next = prev.filter((url) => remote.has(url))
      return next.length === prev.length ? prev : next
    })
  }, [pool, isPreview])

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList | File[]) => {
      const list = Array.from(files)
      for (const file of list) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`Skipped non-image file: ${file.name}`)
        }
        await uploadPrandomCover(file)
      }
      return list.length
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['prandom-cover-pool'] })
      toastSuccess(
        count === 1 ? 'Cover image uploaded' : `${count} cover images uploaded`
      )
      if (inputRef.current) inputRef.current.value = ''
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to upload cover image')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (urls: string[]) => deletePrandomCovers(urls),
    onSuccess: (_data, urls) => {
      queryClient.invalidateQueries({ queryKey: ['prandom-cover-pool'] })
      setSelectedUrls([])
      setConfirmOpen(false)
      toastSuccess(
        urls.length === 1
          ? 'Cover image removed'
          : `${urls.length} cover images removed`
      )
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to delete cover images')
    },
  })

  const toggleOne = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]
    )
  }

  const toggleAll = () => {
    setSelectedUrls(allSelected ? [] : [...remotePool])
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Default Cover Pool</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isPreview
              ? 'Fallback covers used when an article has no photo. Open the manager to upload or delete.'
              : (
                <>
                  Images in the Supabase{' '}
                  <span className="font-medium text-slate-700">prandom</span> bucket. Used when an
                  article has no cover photo. Only admins can upload or delete.
                </>
              )}
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {isPreview
            ? `Showing ${Math.min(PREVIEW_LIMIT, poolCount)} of ${poolCount}`
            : `${poolCount} total`}
        </p>
      </div>

      {!isPreview && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadMutation.mutate(e.target.files)
            }}
          />
          {remotePool.length > 0 && (
            <>
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                {allSelected ? 'Clear selection' : 'Select all'}
              </button>
              <button
                type="button"
                disabled={selectedUrls.length === 0 || deleteMutation.isPending}
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={15} />
                Delete selected
                {selectedUrls.length > 0 ? ` (${selectedUrls.length})` : ''}
              </button>
            </>
          )}
          <button
            type="button"
            disabled={uploadMutation.isPending}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
          >
            {uploadMutation.isPending ? (
              <CrossSpinner size="xs" />
            ) : (
              <Upload size={15} />
            )}
            Upload images
          </button>
        </div>
      )}

      {!isPreview && selectedUrls.length > 0 && (
        <p className="mt-3 text-xs font-medium text-[#8a6d2b]">
          {selectedUrls.length} image{selectedUrls.length === 1 ? '' : 's'} selected
        </p>
      )}

      {showingLocalOnly && !isPreview && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The <strong>prandom</strong> bucket is empty (or unreachable). The site is temporarily
          using local <code className="text-xs">/rprofile</code> images. Upload files here after
          creating the bucket and running migration{' '}
          <code className="text-xs">015_prandom_storage.sql</code>.
        </div>
      )}

      <div className="mt-5">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <CrossLoader size="md" label="Loading cover pool..." />
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {displayPool.map((url) => {
              const isRemote = isPoolCover(url) && !url.startsWith('/rprofile/')
              const selected = !isPreview && selectedUrls.includes(url)
              return (
                <li
                  key={url}
                  className={`group relative overflow-hidden rounded-xl border bg-slate-50 ${
                    selected ? 'border-[#c6a14d] ring-2 ring-[#c6a14d]/25' : 'border-slate-200'
                  }`}
                >
                  <img src={url} alt="" className="aspect-[16/10] w-full object-cover" />
                  {!isPreview && isRemote && (
                    <label className="absolute left-2 top-2 inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOne(url)}
                        className="h-4 w-4 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d]"
                      />
                      <span className="sr-only">Select cover image</span>
                    </label>
                  )}
                </li>
              )
            })}
            {!isPreview && (
              <li>
                <button
                  type="button"
                  disabled={uploadMutation.isPending}
                  onClick={() => inputRef.current?.click()}
                  className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white text-sm font-medium text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
                >
                  <ImagePlus size={22} />
                  Add image
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {isPreview && (
        <div className="mt-4 flex justify-center">
          <Link
            to="/manage-cover-pool"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Manage Cover Pool
            {hasMoreThanPreview ? ` (${poolCount})` : ''}
          </Link>
        </div>
      )}

      {!isPreview && confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Delete cover images?</h3>
            <p className="mt-2 text-sm text-slate-600">
              {selectedUrls.length === 1
                ? 'This will permanently remove the selected image from the prandom bucket.'
                : `This will permanently remove ${selectedUrls.length} selected images from the prandom bucket.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(selectedUrls)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? <CrossSpinner size="xs" /> : <Trash2 size={15} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
