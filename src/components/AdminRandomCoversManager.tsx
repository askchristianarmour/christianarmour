import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { useRef } from 'react'
import { CrossLoader, CrossSpinner } from './CrossLoader'
import { useToast } from '../contexts/ToastContext'
import {
  deletePrandomCover,
  fetchPrandomCoverPool,
  isPoolCover,
  LOCAL_FALLBACK_COVER_IMAGES,
  uploadPrandomCover,
} from '../lib/cover-images'

export function AdminRandomCoversManager() {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()

  const { data: pool = [], isLoading } = useQuery({
    queryKey: ['prandom-cover-pool'],
    queryFn: fetchPrandomCoverPool,
  })

  const remotePool = pool.filter((url) => isPoolCover(url) && !url.startsWith('/rprofile/'))
  const showingLocalOnly =
    remotePool.length === 0 && pool.every((url) => url.startsWith('/rprofile/'))

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
    mutationFn: (url: string) => deletePrandomCover(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prandom-cover-pool'] })
      toastSuccess('Cover image removed')
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to delete cover image')
    },
  })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-in fade-in duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Default Cover Pool</h2>
          <p className="mt-1 text-sm text-slate-500">
            Images in the Supabase <span className="font-medium text-slate-700">prandom</span>{' '}
            bucket. Used when an article has no cover photo. Only admins can upload or delete.
          </p>
        </div>
        <div>
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
      </div>

      {showingLocalOnly && (
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
            {(remotePool.length > 0 ? remotePool : [...LOCAL_FALLBACK_COVER_IMAGES]).map((url) => {
              const isRemote = isPoolCover(url) && !url.startsWith('/rprofile/')
              return (
                <li
                  key={url}
                  className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <img src={url} alt="" className="aspect-[16/10] w-full object-cover" />
                  {isRemote && (
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(url)}
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1.5 text-xs font-medium text-red-600 opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  )}
                </li>
              )
            })}
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
          </ul>
        )}
      </div>
    </div>
  )
}
