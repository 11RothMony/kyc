import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AutoCamera } from '@/components/ui/auto-camera'
import { VerificationResults } from '@/components/ui/verification-results'
import { IDDataDisplay } from '@/components/ui/id-data-display'
import { FileUpload } from '@/components/ui/file-upload'
import { Toast, useToast } from '@/components/ui/toast'
import { UploadService, type FileData } from '@/lib/upload-service'
import { UnifiedUploadService, type UnifiedFileData } from '@/lib/unified-upload-service'
import { faceRecognitionManager } from '@/lib/face-recognition/service'
import { OCRManager, defaultOCRConfig } from '@/lib/ocr/service'
import { FaceComparisonResult } from '@/types/face-recognition'
import { ExtractedIDData } from '@/types/ocr'

export default function Verify() {
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const [uploadedFileData, setUploadedFileData] = useState<UnifiedFileData | null>(null)
  const [isCapacitor, setIsCapacitor] = useState(false)
  const [faceImageData, setFaceImageData] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [verificationResult, setVerificationResult] = useState<FaceComparisonResult | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [extractedIdData, setExtractedIdData] = useState<ExtractedIDData | null>(null)
  const [isExtractingData, setIsExtractingData] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [showIdData, setShowIdData] = useState(false)
  const [currentView, setCurrentView] = useState<'upload' | 'camera'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [ocrManager] = useState(new OCRManager(defaultOCRConfig))
  const { toast, showToast, hideToast } = useToast()


  // Load uploaded file from localStorage on page load
  useEffect(() => {
    const storedFileId = UnifiedUploadService.getStoredFileId()
    if (storedFileId) {
      setUploadedFileId(storedFileId)
      UnifiedUploadService.getFile(storedFileId).then((fileData) => {
        if (fileData) {
          setUploadedFileData(fileData)
        } else {
          // File not found, clear the stored ID
          UnifiedUploadService.clearStoredFileId()
        }
      })
    }
  }, [])


  const handleVerificationWithData = async (capturedImageData: string) => {
    if (!uploadedFileData || !capturedImageData) return

    setIsProcessing(true)
    setVerificationError(null)
    setVerificationResult(null)
    setShowResults(true)

    try {
      // Process verification using uploaded file data and captured image
      const result = await faceRecognitionManager.processVerification(
        uploadedFileData.dataUrl,
        capturedImageData
      )

      if (result.success && result.result) {
        setVerificationResult(result.result)
      } else {
        setVerificationError(result.error?.message || 'Verification failed')
      }
    } catch (error) {
      setVerificationError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    setVerificationError(null)
    setVerificationResult(null)
    setShowResults(false)
  }

  const handleDataRetry = () => {
    setExtractionError(null)
    setExtractedIdData(null)
    setShowIdData(false)
  }

  const handleStartOver = () => {
    setUploadedFileData(null)
    setFaceImageData(null)
    setVerificationResult(null)
    setVerificationError(null)
    setShowResults(false)
    setExtractedIdData(null)
    setExtractionError(null)
    setShowIdData(false)
    setCurrentView('camera')
    setSelectedFile(null)
    setUploadError(null)
  }


  const handleCameraView = () => {
    setCurrentView('camera')
    // Clear verification results when switching to camera
    setVerificationResult(null)
    setVerificationError(null)
    setShowResults(false)
  }

  const handleFaceCapture = async (imageData: string | null) => {
    setFaceImageData(imageData)
    if (imageData) {
      //Automatically trigger verification when face is captured and ID is uploaded
      if (uploadedFileData) {
        await handleVerificationWithData(imageData)
      }
    } else {
      // Clear verification results when retaking photo (imageData is null)
      setVerificationResult(null)
      setVerificationError(null)
      setShowResults(false)
    }
  }

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    setUploadError(null)
  }

  const handleUploadConfirm = async () => {
    if (!selectedFile && !isCapacitor) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      let result
      
      if (isCapacitor) {
        // Use Capacitor photo selection
        result = await UnifiedUploadService.selectAndUploadFile()
      } else {
        // Use traditional file upload
        if (!selectedFile) return
        result = await UnifiedUploadService.uploadFile(selectedFile, setUploadProgress)
      }

      if (result.success && result.fileId) {
        UnifiedUploadService.saveFileId(result.fileId)
        const fileData = await UnifiedUploadService.getFile(result.fileId)

        if (fileData) {
          setUploadedFileId(fileData.fileId)
          setUploadedFileData(fileData)
          showToast('ID card uploaded successfully!', 'success')
          setCurrentView('camera')
          setSelectedFile(null)
        }
      } else {
        setUploadError(result.error || 'Upload failed')
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <>
      <Head>
        <title>Verify Identity - KYC Compare ID Card</title>
        <meta name="description" content="Start your identity verification process by uploading your ID card and taking a live photo" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo-seksaa.jpg" />
      </Head>
      <div className="min-h-screen bg-gray-50">

        {/* Main Content */}
        <main className="px-4 py-6" role="main">
          <div className='flex-wrap flex gap-2 justify-center text-center p-3'>
            <a target="_blank" href="https://www.facebook.com/SeksaaTechacAdemy">
              <img className='w-24 h-24 rounded-full' src="/logo-seksaa.jpg" alt="logo" />
            </a>
            <h2 className=' text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent sm:mb-4 leading-tight'>
              <a target="_blank" href="https://www.facebook.com/SeksaaTechacAdemy">
                Seksaa Tech Academy
              </a>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
              <a target="_blank" href="https://www.facebook.com/SeksaaTechacAdemy">Innovative Face Recognition Technology</a>
            </p>
            <div className="inline-flex items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 relative w-fit mx-auto py-3 px-6 text-base font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-300">
              ✨ Demo Version
            </div>
          </div>
          {/* Toggle Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-4 mt-2">
            <div className="flex">
              <button
                onClick={() => setCurrentView('upload')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${currentView === 'upload'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {uploadedFileData ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
                Upload ID
              </button>
              <button
                onClick={handleCameraView}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${currentView === 'camera'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {faceImageData ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Face Scan
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-6">
            {currentView === 'upload' ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Upload ID Card</h2>
                      <p className="text-sm text-gray-500">Take a photo or upload your government ID</p>
                    </div>
                  </div>
                  {!isCapacitor ? (
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      maxSize={10}
                      disabled={isUploading}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                          <path d="M16 10a4 4 0 00-4 4v24a4 4 0 004 4h16a4 4 0 004-4V14a4 4 0 00-4-4h-4l-2-4h-4l-2 4h-4zM24 34a10 10 0 100-20 10 10 0 000 20z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-2">Select ID Card Photo</p>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose a photo from your device gallery
                      </p>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Uploading...</span>
                        <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload Error */}
                  {uploadError && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{uploadError}</p>
                    </div>
                  )}

                  {(selectedFile || isCapacitor) && (
                    <Button
                      onClick={handleUploadConfirm}
                      disabled={isUploading}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 h-12 text-base"
                    >
                      {isUploading 
                        ? 'Processing...' 
                        : isCapacitor 
                          ? 'Select ID Card Photo' 
                          : 'Upload ID Card'
                      }
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Face Verification</h2>
                      <p className="text-sm text-gray-500">Take a live selfie for identity matching</p>
                    </div>
                  </div>

                  {currentView === 'camera' && uploadedFileData ? (
                    <div>
                      <AutoCamera
                        onImageCapture={handleFaceCapture}
                        onCancel={() => setCurrentView('upload')}
                        autoStart={true}
                      />
                    </div>
                  ) : currentView === 'camera' ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-gray-600 text-center mb-4">
                        Please upload your ID card first
                      </p>
                      <Button
                        onClick={() => setCurrentView('upload')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Upload ID Card
                      </Button>
                    </div>
                  ) : null}
                </div>
                {/* Verification Results */}
                {showResults && (
                  <div className="mt-2">
                    <VerificationResults
                      result={verificationResult}
                      extractedIdData={extractedIdData}
                      error={verificationError}
                      isProcessing={isProcessing}
                      onRetry={handleRetry}
                      onStartOver={handleStartOver}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Spacer for fixed button
          {!showResults && uploadedFileData && faceImageData && (
            <div className="h-20"></div>
          )} */}
        </main>

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      </div>
    </>
  )
}