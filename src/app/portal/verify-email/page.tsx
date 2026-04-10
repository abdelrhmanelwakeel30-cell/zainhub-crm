'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ZainHubLogo } from '@/components/shared/zainhub-logo'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('No verification token found in the URL.')
      return
    }

    fetch(`/api/client-portal/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success')
        } else {
          setStatus('error')
          setErrorMessage(data.error || 'Verification failed.')
        }
      })
      .catch(() => {
        setStatus('error')
        setErrorMessage('Something went wrong. Please try again.')
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <ZainHubLogo variant="login" />
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-14 w-14 text-blue-500 animate-spin" />
                <h2 className="text-xl font-bold">Verifying your email...</h2>
                <p className="text-slate-500 text-sm">Please wait a moment.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <h2 className="text-xl font-bold">Email Verified!</h2>
                <p className="text-slate-500 text-sm max-w-xs">
                  Your email has been verified successfully. You can now sign in to your account.
                </p>
                <Link href="/portal/login">
                  <Button className="mt-2 bg-blue-600 hover:bg-blue-700">Go to Login</Button>
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-14 w-14 text-red-500" />
                <h2 className="text-xl font-bold">Verification Failed</h2>
                <p className="text-slate-500 text-sm max-w-xs">{errorMessage}</p>
                <Link href="/portal/login">
                  <Button variant="outline" className="mt-2">
                    Back to Login
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
