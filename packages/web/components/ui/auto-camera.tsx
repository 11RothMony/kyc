import React, { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { CameraService } from '@/lib/camera-service'

interface AutoCameraProps {
  onImageCapture: (imageData: string | null) => void
  onCancel?: () => void
  autoStart?: boolean
  className?: string
  disabled?: boolean
  showPreview?: boolean
  width?: number
  height?: number
}

export function AutoCamera({ 
  onImageCapture,
  onCancel,
  autoStart = true,
  className,
  disabled = false,
  showPreview = true,
  width = 640,
  height = 480
}: AutoCameraProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [streamReady, setStreamReady] = useState(false)
  const [isCapacitor, setIsCapacitor] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)


  // Capacitor camera capture
  const captureWithCapacitor = useCallback(async () => {
    setError(null)
    setIsInitializing(true)

    try {
      const result = await CameraService.takePhoto({
        width,
        height,
        quality: 90,
        source: 'camera'
      })

      if (result.success && result.imageData) {
        setCapturedImage(result.imageData)
        onImageCapture(result.imageData)
      } else {
        setError(result.error || 'Failed to capture image')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Camera access failed')
    } finally {
      setIsInitializing(false)
    }
  }, [width, height, onImageCapture])



  // Start camera
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access not supported in this browser')
        return
      }

      setError(null)
      setIsInitializing(true)
      setStreamReady(false)
      setIsStreaming(true)
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: width, min: 320, max: 1280 },
          height: { ideal: height, min: 240, max: 720 },
          facingMode: 'user'
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) { 
        videoRef.current.srcObject = stream
        
        const handleLoadedMetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setStreamReady(true)
                setIsInitializing(false)
              })
              .catch(err => {
                console.error('Error playing video:', err)
                setError('Unable to start video playback')
                setIsInitializing(false)
                setIsStreaming(false)
              })
          }
        }

        videoRef.current.onloadedmetadata = handleLoadedMetadata
        
        if (videoRef.current.readyState >= 1) {
          handleLoadedMetadata()
        }
      }

    } catch (err: any) {
      console.error('Error accessing camera:', err)
      setIsInitializing(false)
      setIsStreaming(false)
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.')
      } else if (err.name === 'NotFoundError') {
        setError('Camera not found. Please check your camera.')
      } else {
        setError('Unable to access camera. Please try again.')
      }
    }
  }, [width, height])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
    setStreamReady(false)
  }, [])

  // Capture image
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamReady) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageData)
      onImageCapture(imageData)
      stopCamera()
      
    } catch (err) {
      console.error('Error capturing image:', err)
      setError('Failed to capture image. Please try again.')
    }
  }, [streamReady, onImageCapture, stopCamera])


  // Auto start camera when component mounts
  useEffect(() => {
    if (autoStart && !isStreaming && !capturedImage) {
      if (isCapacitor) {
        // For Capacitor, we don't auto-start but show the button immediately
        return
      } else {
        startCamera()
      }
    }
  }, [autoStart, isStreaming, capturedImage, startCamera, isCapacitor])

  // Detect Capacitor environment
  useEffect(() => {
    const checkCapacitor = () => {
      const isCapacitorEnv = typeof window !== 'undefined' && !!(window as any).Capacitor
      setIsCapacitor(isCapacitorEnv)
    }
    
    checkCapacitor()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    onImageCapture(null)
    if (!isCapacitor) {
      startCamera()
    }
  }, [startCamera, onImageCapture, isCapacitor])

  // If image is captured, show preview
  if (capturedImage && showPreview) {
    return (
      <div className={cn('w-full max-w-md mx-auto', className)}>
        <div className="relative border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-24 h-24 object-cover rounded-lg border-2 border-green-400"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Face captured successfully</p>
                  <p className="text-xs text-gray-500">Comparing photo with ID card...</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Processing verification...
              </div>
              <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={isCapacitor ? () => { setCapturedImage(null); onImageCapture(null); } : retakePhoto} 
                    disabled={disabled}
                  >
                    {isCapacitor ? 'Take New Photo' : 'Retake'}
                  </Button>
                </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div className={cn(
        'relative border-2 border-dashed rounded-lg transition-all duration-200',
        isStreaming && streamReady ? 'border-green-400 bg-green-50' : 'border-gray-300',
        isInitializing && 'border-blue-400 bg-blue-50',
        error && 'border-red-400 bg-red-50'
      )}>
        {isStreaming ? (
          <div className="relative p-4">
            <div className="relative overflow-hidden rounded-lg">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover rounded-lg"
                style={{ 
                  backgroundColor: '#000',
                  transform: 'scaleX(-1)'
                }}
              />
              
              {/* Loading overlay */}
              {!streamReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Starting camera...</p>
                  </div>
                </div>
              )}
              
              {/* Face positioning guide circle */}
              {streamReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Outer circle */}
                    <div className="w-52 h-52 border-4 border-white rounded-full opacity-90 shadow-2xl">
                      {/* Inner animated circle */}
                      <div className="w-full h-full border-2 border-blue-400 rounded-full animate-pulse shadow-lg"></div>
                    </div>
                    {/* Instruction text below circle */}
                    <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 text-center">
                      <p className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full">
                        Position your face in the circle
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
            
            {/* Status feedback */}
            {streamReady && (
              <div className="mt-2 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {/* <div className="w-2 h-2 rounded-full bg-blue-400" /> */}
                  Camera ready - Align your face with the circle
                </div>
              </div>
            )}
            
            
            {/* Manual capture button */}
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => { stopCamera(); onCancel?.(); }} disabled={disabled} size="sm">
                Cancel
              </Button>
              <Button
                onClick={captureImage}
                className="bg-green-600 hover:bg-green-700"
                disabled={disabled || !streamReady}
                size="sm"
              >
                Capture Now
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path d="M16 10a4 4 0 00-4 4v24a4 4 0 004 4h16a4 4 0 004-4V14a4 4 0 00-4-4h-4l-2-4h-4l-2 4h-4zM24 34a10 10 0 100-20 10 10 0 000 20z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isCapacitor ? 'Face Verification' : 'Take Photo'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {isCapacitor 
                ? 'Take a selfie using your device camera'
                : 'Use your camera to take a photo'
              }
            </p>
            <Button
              onClick={isCapacitor ? captureWithCapacitor : startCamera}
              className="bg-green-600 hover:bg-green-700"
              disabled={disabled || isInitializing}
            >
              {isInitializing 
                ? 'Starting...' 
                : isCapacitor 
                  ? 'Take Selfie' 
                  : 'Start Camera'
              }
            </Button>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setError(null)} className="mt-2">
            Dismiss
          </Button>
        </div>
      )}
    </div>
  )
}