'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select'
  required: boolean
  options?: string[]
}

interface FormFieldBuilderProps {
  fields: FormField[]
  onChange: (fields: FormField[]) => void
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select (dropdown)' },
]

export function FormFieldBuilder({ fields, onChange }: FormFieldBuilderProps) {
  const addField = () => {
    onChange([
      ...fields,
      { name: `field_${fields.length + 1}`, label: '', type: 'text', required: false, options: [] },
    ])
  }

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newFields.length) return
    ;[newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
    onChange(newFields)
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    onChange(newFields)
  }

  const updateOption = (fieldIndex: number, optIndex: number, value: string) => {
    const newFields = [...fields]
    const opts = [...(newFields[fieldIndex].options ?? [])]
    opts[optIndex] = value
    newFields[fieldIndex] = { ...newFields[fieldIndex], options: opts }
    onChange(newFields)
  }

  const addOption = (fieldIndex: number) => {
    const newFields = [...fields]
    const opts = [...(newFields[fieldIndex].options ?? []), '']
    newFields[fieldIndex] = { ...newFields[fieldIndex], options: opts }
    onChange(newFields)
  }

  const removeOption = (fieldIndex: number, optIndex: number) => {
    const newFields = [...fields]
    const opts = (newFields[fieldIndex].options ?? []).filter((_, i) => i !== optIndex)
    newFields[fieldIndex] = { ...newFields[fieldIndex], options: opts }
    onChange(newFields)
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No fields yet. Add your first field below.</p>
      )}

      {fields.map((field, index) => (
        <div key={index} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Field {index + 1}</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Move field up"
                className="h-6 w-6"
                onClick={() => moveField(index, 'up')}
                disabled={index === 0}
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Move field down"
                className="h-6 w-6"
                onClick={() => moveField(index, 'down')}
                disabled={index === fields.length - 1}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove field"
                className="h-6 w-6 text-red-500 hover:text-red-600"
                onClick={() => removeField(index)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Field Name (key)</Label>
              <Input
                value={field.name}
                onChange={e => updateField(index, { name: e.target.value })}
                className="mt-0.5 text-xs h-8"
                placeholder="e.g. full_name"
              />
            </div>
            <div>
              <Label className="text-xs">Label</Label>
              <Input
                value={field.label}
                onChange={e => updateField(index, { label: e.target.value })}
                className="mt-0.5 text-xs h-8"
                placeholder="e.g. Full Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <select
                value={field.type}
                onChange={e => updateField(index, { type: e.target.value as FormField['type'] })}
                className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
              >
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={e => updateField(index, { required: e.target.checked })}
                  className="rounded border-input"
                />
                Required
              </label>
            </div>
          </div>

          {field.type === 'select' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">Options</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 text-xs px-1"
                  onClick={() => addOption(index)}
                >
                  <Plus className="h-3 w-3 me-0.5" /> Add
                </Button>
              </div>
              <div className="space-y-1">
                {(field.options ?? []).map((opt, optIndex) => (
                  <div key={optIndex} className="flex gap-1">
                    <Input
                      value={opt}
                      onChange={e => updateOption(index, optIndex, e.target.value)}
                      className="text-xs h-7 flex-1"
                      placeholder={`Option ${optIndex + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete option"
                      className="h-7 w-7 text-red-500"
                      onClick={() => removeOption(index, optIndex)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={addField}>
        <Plus className="h-3.5 w-3.5 me-1" /> Add Field
      </Button>
    </div>
  )
}
