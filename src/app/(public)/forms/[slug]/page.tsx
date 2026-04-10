'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface FormFieldConfig {
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select'
  required: boolean
  options?: string[]
}

interface FormConfig {
  id: string
  name: string
  description: string | null
  fields: FormFieldConfig[]
  thankYouMsg: string | null
  redirectUrl: string | null
}

export default function PublicFormPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [form, setForm] = useState<FormConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [thankYouMsg, setThankYouMsg] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!slug) return
    fetch(`/api/public/forms/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setForm(data.data)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  const validate = () => {
    if (!form) return false
    const newErrors: Record<string, string> = {}
    for (const field of form.fields) {
      if (field.required && !values[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`
      }
      if (field.type === 'email' && values[field.name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.name])) {
        newErrors[field.name] = 'Please enter a valid email address'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/forms/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (data.success) {
        if (data.data.redirectUrl) {
          window.location.href = data.data.redirectUrl
        } else {
          setThankYouMsg(data.data.thankYouMsg || "Thank you! We'll be in touch soon.")
          setSubmitted(true)
        }
      } else {
        alert('Failed to submit. Please try again.')
      }
    } catch {
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Form Not Found</h1>
          <p className="text-muted-foreground mt-2">This form is not available or has been deactivated.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">{thankYouMsg}</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-bold mb-1">{form.name}</h1>
          {form.description && (
            <p className="text-muted-foreground text-sm mb-6">{form.description}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {form.fields.map(field => (
              <div key={field.name}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-red-500 ms-0.5">*</span>}
                </Label>

                {field.type === 'textarea' ? (
                  <Textarea
                    value={values[field.name] ?? ''}
                    onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="mt-1"
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={values[field.name] ?? ''}
                    onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select an option...</option>
                    {(field.options ?? []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                    value={values[field.name] ?? ''}
                    onChange={e => setValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                    className="mt-1"
                  />
                )}

                {errors[field.name] && (
                  <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>
                )}
              </div>
            ))}

            <Button type="submit" className="w-full mt-2" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Submit
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
