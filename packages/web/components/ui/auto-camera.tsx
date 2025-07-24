import React, { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { CameraService } from '@/lib/camera-service'

interface AutoCameraProps {
  onImageCapture: (imageData: string | null) => void
  autoStart?: boolean
  className?: string
  disabled?: boolean
  showPreview?: boolean
  width?: number
  height?: number
}

export function AutoCamera({ 
  onImageCapture, 
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
  const [countdown, setCountdown] = useState(0)
  const [faceDetected, setFaceDetected] = useState(false)
  const [isCapacitor, setIsCapacitor] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionRef = useRef<number | null>(null)
  const countdownRef = useRef<number | null>(null)


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

  // Face detection - checks for presence in circular region
  const detectFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamReady) return false

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return false

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw current video frame
    context.save()
    context.scale(-1, 1) // Mirror the image like the video display
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    context.restore()
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const faceRegionSize = Math.min(canvas.width, canvas.height) * 0.3
    const radius = faceRegionSize / 2
    
    // Check if there's sufficient pixel variation in the circular region
    let totalPixels = 0
    let avgBrightness = 0
    let pixelVariation = 0
    let darkPixels = 0
    
    for (let y = Math.max(0, centerY - radius); y < Math.min(canvas.height, centerY + radius); y++) {
      for (let x = Math.max(0, centerX - radius); x < Math.min(canvas.width, centerX + radius); x++) {
        const dx = x - centerX
        const dy = y - centerY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // Only check pixels within the circle
        if (distance <= radius) {
          const index = Math.floor(y) * canvas.width * 4 + Math.floor(x) * 4
          const r = imageData.data[index] || 0
          const g = imageData.data[index + 1] || 0
          const b = imageData.data[index + 2] || 0
          
          const brightness = (r + g + b) / 3
          avgBrightness += brightness
          totalPixels++
          
          // Count dark pixels (likely shadows/hair/features)
          if (brightness < 100) darkPixels++
          
          // Check for variation compared to neighbors
          if (x > 0) {
            const neighborIndex = Math.floor(y) * canvas.width * 4 + Math.floor(x - 1) * 4
            const neighborR = imageData.data[neighborIndex] || 0
            const neighborG = imageData.data[neighborIndex + 1] || 0
            const neighborB = imageData.data[neighborIndex + 2] || 0
            const neighborBrightness = (neighborR + neighborG + neighborB) / 3
            
            if (Math.abs(brightness - neighborBrightness) > 15) {
              pixelVariation++
            }
          }
        }
      }
    }
    
    if (totalPixels === 0) return false
    
    avgBrightness /= totalPixels
    const variationRatio = pixelVariation / totalPixels
    const darkRatio = darkPixels / totalPixels
    
    // Simple detection criteria:
    // - Not completely dark or completely bright (indicates something is there)
    // - Has some pixel variation (indicates features/details)
    // - Has some darker pixels (shadows, hair, features)
    const hasReasonableBrightness = avgBrightness > 30 && avgBrightness < 220
    const hasVariation = variationRatio > 0.1 // At least 10% pixels have variation
    const hasDarkFeatures = darkRatio > 0.1 && darkRatio < 0.7 // 10-70% dark pixels
    
    return hasReasonableBrightness && hasVariation && hasDarkFeatures
  }, [streamReady])

  // Start face detection loop with improved stability
  useEffect(() => {
    if (streamReady && !detectionRef.current) {
      let consecutiveDetections = 0
      const requiredConsecutiveDetections = 3 // Require 3 consecutive detections
      
      detectionRef.current = window.setInterval(() => {
        const detected = detectFace()
        
        if (detected) {
          consecutiveDetections++
          if (consecutiveDetections >= requiredConsecutiveDetections) {
            setFaceDetected(true)
            
            // Auto capture when face is consistently detected
            if (countdown === 0 && !countdownRef.current) {
              setCountdown(3)
              countdownRef.current = window.setInterval(() => {
                setCountdown(prev => {
                  if (prev <= 1) {
                    if (countdownRef.current) {
                      clearInterval(countdownRef.current)
                      countdownRef.current = null
                    }
                    // Inline capture to avoid dependency issues
                    if (videoRef.current && canvasRef.current && streamReady) {
                      const video = videoRef.current
                      const canvas = canvasRef.current
                      const context = canvas.getContext('2d')
                      
                      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
                        try {
                          canvas.width = video.videoWidth
                          canvas.height = video.videoHeight
                          context.drawImage(video, 0, 0, canvas.width, canvas.height)
                          
                          const imageData = canvas.toDataURL('image/jpeg', 0.9)
                          setCapturedImage(imageData)
                          onImageCapture(imageData)
                          
                          // Stop camera after capture
                          if (streamRef.current) {
                            streamRef.current.getTracks().forEach(track => track.stop())
                            streamRef.current = null
                          }
                          setIsStreaming(false)
                          setStreamReady(false)
                          setFaceDetected(false)
                          setCountdown(0)
                        } catch (err) {
                          console.error('Error capturing image:', err)
                        }
                      }
                    }
                    return 0
                  }
                  return prev - 1
                })
              }, 1000)
            }
          }
        } else {
          consecutiveDetections = 0
          setFaceDetected(false)
          
          // Cancel countdown if face is no longer detected
          if (countdownRef.current && countdown > 0) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
            setCountdown(0)
          }
        }
      }, 300) // Slightly slower for better performance
    }
    
    return () => {
      if (detectionRef.current) {
        clearInterval(detectionRef.current)
        detectionRef.current = null
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [streamReady, detectFace, countdown])

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
          facingMode: 'user',
          frameRate: { ideal: 15, max: 30 } // Optimize for face detection
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
    
    if (detectionRef.current) {
      clearInterval(detectionRef.current)
      detectionRef.current = null
    }
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    
    setIsStreaming(false)
    setStreamReady(false)
    setFaceDetected(false)
    setCountdown(0)
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
                    <p className="text-sm">Starting face detection...</p>
                  </div>
                </div>
              )}
              
              {/* Face detection guide */}
              {streamReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={cn(
                    'w-48 h-48 border-2 rounded-full transition-all duration-200',
                    faceDetected ? 'border-green-400 bg-green-400 bg-opacity-10' : 'border-white opacity-70'
                  )}>
                    <div className={cn(
                      'w-full h-full border-2 rounded-full transition-all duration-200',
                      faceDetected ? 'border-green-400 animate-pulse' : 'border-gray-400'
                    )}></div>
                  </div>
                </div>
              )}
              
              {/* Auto capture countdown */}
              {countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-50 rounded-full w-16 h-16 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{countdown}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Status feedback */}
            {streamReady && (
              <div className="mt-2 text-center">
                <div className={cn(
                  'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
                  faceDetected 
                    ? 'bg-green-100 text-green-800 animate-pulse' 
                    : 'bg-blue-100 text-blue-800'
                )}>
                  <div className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    faceDetected ? 'bg-green-400 animate-pulse' : 'bg-blue-400'
                  )} />
                  {faceDetected 
                    ? (countdown > 0 ? `Capturing in ${countdown}...` : 'Face detected - Auto capturing soon!') 
                    : 'Position your face inside the circle'
                  }
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {faceDetected 
                    ? 'Hold still for automatic capture'
                    : 'Center your face in the circle and look at the camera'
                  }
                </div>
              </div>
            )}
            
            
            {/* Manual capture button */}
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={stopCamera} disabled={disabled} size="sm">
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
              {isCapacitor ? 'Face Verification' : 'Auto Face Detection'}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {isCapacitor 
                ? 'Take a selfie using your device camera'
                : 'Camera will start automatically and capture when face is detected'
              }
            </p>
            {!autoStart && (
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
            )}
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