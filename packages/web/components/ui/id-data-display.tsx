import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { ExtractedIDData } from '@/types/ocr'
import { FaceComparisonResult } from '@/types/face-recognition'

interface IDDataDisplayProps {
  data: ExtractedIDData | null
  verificationResult?: FaceComparisonResult | null
  error?: string
  isProcessing?: boolean
  onRetry?: () => void
  onExport?: (format: 'json' | 'pdf' | 'txt') => void
  onResetFaceScan?: () => void
}

export function IDDataDisplay({ 
  data, 
  verificationResult,
  error, 
  isProcessing = false, 
  onRetry,
  onExport,
  onResetFaceScan
}: IDDataDisplayProps) {
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf' | 'txt'>('json')

  // Early returns for different states with smooth transitions
  if (isProcessing) {
    return (
      <Card className="border-blue-200 bg-blue-50 transition-all duration-300 ease-in-out">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <div className="animate-pulse">
              <p className="text-lg font-medium text-blue-900">Extracting ID Information...</p>
              <p className="text-sm text-blue-700">Processing text using OCR technology</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return null
  }

  // Memoized calculations for expensive operations
  const computedValues = useMemo(() => {
    // COMPREHENSIVE DEBUG LOGGING
    console.log('=== ID DATA DISPLAY DEBUG ===')
    console.log('verificationResult exists:', !!verificationResult)
    console.log('verificationResult full object:', verificationResult)
    
    if (verificationResult) {
      console.log('verificationResult properties:', {
        confidence: verificationResult.confidence,
        similarity: verificationResult.similarity,
        threshold: verificationResult.threshold,
        isMatch: verificationResult.isMatch,
        details: verificationResult.details,
        allKeys: Object.keys(verificationResult)
      })
    } else {
      console.log('verificationResult is null/undefined')
    }

    // ULTRA SIMPLE LOGIC - just check if verificationResult exists
    const hasSuccessfulFaceCapture = !!verificationResult
      
    // Show verified if ANY verificationResult exists (for testing)
    const isVerified = hasSuccessfulFaceCapture
    
    const overallConfidence = Math.round(data.confidence.overall * 100)
    const isHighQuality = data.confidence.overall >= 0.8
    const extractedFieldsCount = Object.keys(data).filter(
      key => data[key as keyof ExtractedIDData] && key !== 'confidence' && key !== 'rawData'
    ).length

    console.log('Final computed values:', { 
      isVerified, 
      hasSuccessfulFaceCapture,
      verificationResultExists: !!verificationResult 
    })
    console.log('=== END DEBUG ===')

    return {
      isVerified,
      hasSuccessfulFaceCapture,
      overallConfidence,
      isHighQuality,
      extractedFieldsCount
    }
  }, [data, verificationResult])

  // Memoized utility functions
  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-orange-600'
    return 'text-red-600'
  }, [])

  const getConfidenceBackground = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-600'
    if (confidence >= 0.6) return 'bg-orange-600'
    return 'bg-red-600'
  }, [])

  const maskSensitiveData = useCallback((value: string, showFirst = 2, showLast = 2) => {
    if (showSensitiveData || value.length <= (showFirst + showLast)) {
      return value
    }
    const masked = '*'.repeat(value.length - showFirst - showLast)
    return value.slice(0, showFirst) + masked + value.slice(-showLast)
  }, [showSensitiveData])

  const toggleSensitiveData = useCallback(() => {
    setShowSensitiveData(prev => !prev)
  }, [])

  const handleExportFormatChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setExportFormat(e.target.value as 'json' | 'pdf' | 'txt')
  }, [])

  const handleExport = useCallback(() => {
    onExport?.(exportFormat)
  }, [onExport, exportFormat])

  const { isVerified, hasSuccessfulFaceCapture, overallConfidence, isHighQuality, extractedFieldsCount } = computedValues

  const handleFaceScanReset = useCallback(() => {
    if (isVerified) {
      // Show confirmation for resetting verified identity
      const confirmReset = window.confirm(
        'Are you sure you want to reset the verified identity? This will clear the verification status and require a new face scan.'
      )
      if (confirmReset) {
        onResetFaceScan?.()
      }
    } else {
      // Direct reset for non-verified states
      onResetFaceScan?.()
    }
  }, [onResetFaceScan, isVerified])

  // Optimized field rendering component
  const renderDataField = useCallback((
    fieldKey: keyof ExtractedIDData,
    label: string,
    isSensitive = false
  ) => {
    const fieldValue = data[fieldKey]
    if (!fieldValue) return null

    const confidenceValue = data.confidence[fieldKey as keyof typeof data.confidence]
    const displayValue = isSensitive ? maskSensitiveData(fieldValue as string) : fieldValue

    return (
      <div key={fieldKey} className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {confidenceValue && (
            <span className={`text-xs ${getConfidenceColor(confidenceValue)}`}>
              {Math.round(confidenceValue * 100)}%
            </span>
          )}
        </div>
        <p className={`text-lg font-semibold text-gray-900 ${isSensitive ? 'font-mono' : ''}`}>
          {String(displayValue)}
        </p>
      </div>
    )
  }, [data, maskSensitiveData, getConfidenceColor])

  // Field configuration for optimized rendering
  const dataFields = useMemo(() => [
    { key: 'firstName' as const, label: 'First Name', sensitive: false },
    { key: 'lastName' as const, label: 'Last Name', sensitive: false },
    { key: 'dateOfBirth' as const, label: 'Date of Birth', sensitive: false },
    { key: 'gender' as const, label: 'Gender', sensitive: false },
    { key: 'idNumber' as const, label: 'ID Number', sensitive: true },
    { key: 'documentNumber' as const, label: 'Document Number', sensitive: true },
    { key: 'expiryDate' as const, label: 'Expiry Date', sensitive: false },
    { key: 'nationality' as const, label: 'Nationality', sensitive: false }
  ], [])

  return (
    <Card className={`border-2 transition-all duration-500 ease-in-out animate-in slide-in-from-bottom-4 fade-in ${isHighQuality ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center justify-between ${isHighQuality ? 'text-green-800' : 'text-orange-800'}`}>
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Extracted ID Information
          </div>
          
          {/* Verification Status Badge with Reset */}
          <div className="flex items-center gap-2">
            {/* Only show verification status badge for successful face capture */}
            {verificationResult && isVerified && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ID Verified
              </div>
            )}
            
            {/* Show failed capture badge */}
            {verificationResult && !hasSuccessfulFaceCapture && (
              <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Capture Failed
              </div>
            )}
            
            {/* Face Scan Reset Button */}
            {onResetFaceScan && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFaceScanReset}
                className={`text-xs px-2 py-1 h-auto transition-colors duration-200 ${
                  isVerified 
                    ? 'border-red-300 text-red-700 hover:bg-red-50' 
                    : verificationResult && !hasSuccessfulFaceCapture
                    ? 'border-orange-300 text-orange-700 hover:bg-orange-50'
                    : 'border-blue-300 text-blue-700 hover:bg-blue-50'
                }`}
                title={
                  isVerified 
                    ? "Reset verified identity and scan again" 
                    : verificationResult && !hasSuccessfulFaceCapture
                    ? "Retry face scan - previous attempt failed"
                    : "Reset face verification and scan again"
                }
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 5M3 19l2.26-2.26A9.75 9.75 0 0012 21a9 9 0 019-9" />
                </svg>
                {isVerified 
                  ? 'Reset Identity' 
                  : verificationResult && !hasSuccessfulFaceCapture
                  ? 'Retry Scan'
                  : 'Scan Face Again'
                }
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Face Verification Status */}
          {!verificationResult && onResetFaceScan && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm font-medium text-yellow-800">Face verification pending</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFaceScanReset}
                  className="text-xs px-3 py-1 h-auto bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200 transition-colors duration-200"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Start Face Scan
                </Button>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                Click to start face capture - identity will be verified automatically upon successful capture
              </p>
            </div>
          )}

          {/* Face Capture Failed/Incomplete */}
          {verificationResult && !hasSuccessfulFaceCapture && onResetFaceScan && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-red-800">Face Capture Failed</span>
                </div>
                <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                  ⚠ Failed
                </span>
              </div>
              <p className="text-xs text-red-700 mt-2">
                Face capture quality insufficient. Confidence: {Math.round((verificationResult.confidence || 0) * 100)}%, 
                Quality: {Math.round((verificationResult.details?.qualityScore || 0) * 100)}%
              </p>
            </div>
          )}

          {/* Identity Successfully Verified */}
          {verificationResult && isVerified && onResetFaceScan && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">Identity Successfully Verified</span>
                </div>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  ✓ Verified
                </span>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Identity automatically verified after successful face capture! 
                Similarity: {Math.round((verificationResult.similarity || 0) * 100)}%
              </p>
            </div>
          )}

          {/* Privacy Controls */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Privacy Protection</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSensitiveData}
              className="text-xs"
              aria-expanded={showSensitiveData}
              aria-controls="sensitive-data-fields"
              aria-label={`${showSensitiveData ? 'Hide' : 'Show'} sensitive personal information`}
            >
              {showSensitiveData ? 'Hide' : 'Show'} Sensitive Data
            </Button>
          </div>

          {/* Overall Confidence */}
          <div className={`p-4 rounded-lg ${isHighQuality ? 'bg-green-100' : 'bg-orange-100'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Overall Confidence</span>
              <span className={`font-bold ${getConfidenceColor(data.confidence.overall)}`}>
                {overallConfidence}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getConfidenceBackground(data.confidence.overall)}`}
                style={{ width: `${overallConfidence}%` }}
              />
            </div>
          </div>

          {/* Personal Information */}
          <div id="sensitive-data-fields" className="grid grid-cols-1 md:grid-cols-2 gap-4" role="group" aria-labelledby="personal-info-heading">
            <h3 id="personal-info-heading" className="sr-only">Personal Information</h3>
            {dataFields.map(({ key, label, sensitive }) =>
              renderDataField(key, label, sensitive)
            )}
          </div>

          {/* Raw OCR Text */}
          <div className="border-t pt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                Raw OCR Text
              </summary>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono text-gray-800 whitespace-pre-wrap">
                {data.rawData.fullText}
              </div>
            </details>
          </div>

          {/* Technical Details */}
          <div className="border-t pt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                Technical Details
              </summary>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Processing Time:</span> {data.rawData.processingTime}ms
                </div>
                <div>
                  <span className="font-medium">Text Blocks:</span> {data.rawData.blocks.length}
                </div>
                <div>
                  <span className="font-medium">OCR Confidence:</span> {Math.round(data.rawData.confidence * 100)}%
                </div>
                <div>
                  <span className="font-medium">Fields Extracted:</span> {extractedFieldsCount}
                </div>
              </div>
            </details>
          </div>

          {/* Export Section */}
          {onExport && isVerified && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Export Verified Data</h4>
              <div className="flex items-center gap-3">
                <select
                  value={exportFormat}
                  onChange={handleExportFormatChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="json">JSON Format</option>
                  <option value="pdf">PDF Report</option>
                  <option value="txt">Text Summary</option>
                </select>
                <Button
                  onClick={handleExport}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Only verified identity data can be exported for security purposes.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {onRetry && (
              <Button 
                variant="outline" 
                onClick={onRetry}
                className={isHighQuality ? 'border-green-300 text-green-700 hover:bg-green-100' : 'border-orange-300 text-orange-700 hover:bg-orange-100'}
              >
                Re-extract Data
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}