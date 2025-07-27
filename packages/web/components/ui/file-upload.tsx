import React, { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
}

export function FileUpload({
  onFileSelect,
  accept = 'image/*,.pdf',
  maxSize = 10,
  className,
  disabled = false
}: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return 'Please select a valid file type (JPG, PNG, or PDF)'
    }

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${maxSize}MB`
    }

    return null
  }

  const createPreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleFile = useCallback((file: File) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    createPreview(file)

    // Simulate upload progress
    setIsUploading(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          onFileSelect(file)
          return 100
        }
        return prev + 10
      })
    }, 100)
  }, [onFileSelect, maxSize])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragActive(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0]) {
      handleFile(files[0])
    }
  }, [handleFile, disabled])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && files[0]) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setUploadProgress(0)
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all duration-200',
          isDragActive && !disabled
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-400 bg-red-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {selectedFile && previewUrl ? (
          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="w-full space-y-1">
                  <p className="text-sm  font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    size={'sm'}
                    variant={'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    title="Remove"
                  >
                    Remove
                  </Button>
                </div>


                {isUploading && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : selectedFile && !previewUrl ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path d="M9 12h6l3-3h12l3 3h6a3 3 0 013 3v21a3 3 0 01-3 3H9a3 3 0 01-3-3V15a3 3 0 013-3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 19a4 4 0 100 8 4 4 0 000-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>

            {isUploading && (
              <div className="max-w-xs mx-auto">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
              className="mt-4"
            >
              Remove
            </Button>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {isDragActive
                ? 'Drop your ID card here'
                : 'Drag and drop your ID card here, or click to browse'}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Supported formats: JPG, PNG, PDF (max {maxSize}MB)
            </p>
            <Button variant="outline" disabled={disabled}>
              Choose File
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  )
}