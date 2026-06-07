'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const [company, setCompany] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/public/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ company, name, email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Could not create your account')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 1600)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8 text-center space-y-3">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Workspace created</h2>
          <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="company">Company / Workspace Name</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} required minLength={2} placeholder="Acme Inc." className="h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" placeholder="Jane Doe" className="h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@company.com" className="h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Workspace
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">Sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
