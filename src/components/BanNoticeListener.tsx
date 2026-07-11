import { useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { consumeBanNotice } from '../lib/user-bans'

/** Shows a toast if the user was signed out because of a ban. */
export function BanNoticeListener() {
  const { error: toastError } = useToast()

  useEffect(() => {
    const notice = consumeBanNotice()
    if (notice) {
      toastError(`Your account has been banned. ${notice}`)
    }
  }, [toastError])

  return null
}
