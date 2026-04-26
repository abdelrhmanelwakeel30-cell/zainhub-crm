'use client'

/**
 * I-005 (CRM-V3-PRODUCTION-AUDIT-2026-04-25.md): convenience wrapper that
 * wires up Label + Input/Textarea + error message with proper ARIA
 * attributes (`aria-required`, `aria-describedby`, `aria-invalid`).
 *
 * Adoption is opt-in: existing forms continue to work; new forms (and any
 * legacy form being touched) should prefer FormField over manual
 * <Label>/<Input>/<p> trios.
 *
 * Usage
 * -----
 *   <FormField
 *     id="email"
 *     label="Email"
 *     required
 *     error={errors.email?.message}
 *     description="We'll never share your email."
 *   >
 *     <Input id="email" type="email" {...register('email')} />
 *   </FormField>
 *
 * The child input must accept `id` matching the FormField's `id` prop and
 * — if `required` is true — should not also set its own `required` (we
 * pass aria-required and let RHF/Zod do the actual validation).
 */
import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  id: string
  label: React.ReactNode
  required?: boolean
  error?: string
  description?: React.ReactNode
  children: React.ReactElement
  className?: string
  labelClassName?: string
}

export function FormField({
  id,
  label,
  required = false,
  error,
  description,
  children,
  className,
  labelClassName,
}: FormFieldProps) {
  const errorId = `${id}-error`
  const descId = `${id}-description`

  // Build the aria-describedby reference list — only include ids that
  // actually point at rendered nodes. Order: description first, then error.
  const describedBy = [description ? descId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined

  // Inject aria-* attrs onto the child (typically <Input>, <Textarea>,
  // or a Controller-rendered Select). Preserves any aria-* the caller set.
  const child = React.cloneElement(
    children as React.ReactElement<Record<string, unknown>>,
    {
      id,
      'aria-required': required || undefined,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy,
    },
  )

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className={cn('flex items-center gap-1', labelClassName)}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </Label>
      {child}
      {description && (
        <p id={descId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
