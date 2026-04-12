'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from '@uploadthing/react'
import { useUploadThing } from '@/lib/uploadthing-client'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react'

interface FileUploadProps {
  endpoint: 'documentUploader' | 'avatarUploader' | 'expenseReceipt'
  onUploadComplete?: (files: { url: string; name: string; size: number }[]) => void
  onUploadError?: (error: Error) => void
  className?: string
  maxFiles?: number
  label?: string
}

export function FileUpload({
  endpoint,
  onUploadComplete,
  onUploadError,
  className,
  maxFiles = 5,
  label = 'Upload files',
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      setFiles([])
      onUploadComplete?.(
        res.map((r) => ({
          url: (r.serverData as Record<string, unknown>).url as string,
          name: ((r.serverData as Record<string, unknown>).name as string | undefined) ?? r.name,
          size: ((r.serverData as Record<string, unknown>).size as number | undefined) ?? r.size,
        })),
      )
    },
    onUploadError: (error: Error) => {
      onUploadError?.(error)
    },
  })

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles(acceptedFiles)
    },
    [],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? 'Drop files here...' : label}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Drag & drop or click to browse
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(file)}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => removeFile(i)}
                aria-label="Remove file"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => startUpload(files)}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 me-2" /> Upload {files.length} file{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
