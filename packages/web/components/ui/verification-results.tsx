import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { IDDataDisplay } from './id-data-display'
import { FaceComparisonResult } from '@/types/face-recognition'
import { ExtractedIDData } from '@/types/ocr'

interface VerificationResultsProps {
  result: FaceComparisonResult | null
  extractedIdData?: ExtractedIDData | null
  error?: string | null
  isProcessing?: boolean
  onRetry?: () => void
  onStartOver?: () => void
} 

export function VerificationResults({ 
  result, 
  extractedIdData,
  error,   
  isProcessing = false, 
  onRetry,
  onStartOver 
}: VerificationResultsProps) {
  if (isProcessing) {
    return (
      <div className='border-none' role="status" aria-live="polite">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" aria-hidden="true"></div>
            <div>
              <p className="text-lg font-medium text-blue-900">Processing Verification...</p>
              <p className="text-sm text-blue-700">Comparing faces using AI technology</p>
            </div>
          </div>
        </CardContent>
      </div>
    )
  }

  if (error) {
    return (
      <div className='border-none' role="alert" aria-live="assertive">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verification Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex gap-2">
            {onRetry && (
              <Button variant="outline" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-100">
                Try Again
              </Button>
            )}
            {onStartOver && (
              <Button variant="outline" onClick={onStartOver} className="border-red-300 text-red-700 hover:bg-red-100">
                Start Over
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    )
  }

  if (!result) {
    return null
  }

  const isMatch = result.isMatch
  const similarity = Math.round(result.similarity * 100)
  const confidence = Math.round(result.confidence * 100)

  return (
    <div className='border-none' role="status" aria-live="polite">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isMatch ? 'text-green-800' : 'text-orange-800'}`}>
          {isMatch ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {isMatch ? 'Identity Verified' : 'Identity Not Verified'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${isMatch ? 'bg-green-100' : 'bg-orange-100'}`}>
            <p className={`text-lg font-medium ${isMatch ? 'text-green-800' : 'text-orange-800'}`}>
              {isMatch 
                ? 'The face in your ID card matches your live photo' 
                : 'The face in your ID card does not match your live photo'}
            </p>
          </div>

          {/* Show Mock ID Data if verification successful, or "Incorrect" if failed */}
          {isMatch ? (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Verified Identity Information</h3>
              
              {/* Mock ID Card Data Display */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-lg font-semibold text-gray-900">John Michael Smith</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                    <p className="text-lg font-semibold text-gray-900">March 15, 1990</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">ID Number</label>
                    <p className="text-lg font-semibold text-gray-900 font-mono">ID-789123456</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Nationality</label>
                    <p className="text-lg font-semibold text-gray-900">United States</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Gender</label>
                    <p className="text-lg font-semibold text-gray-900">Male</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                    <p className="text-lg font-semibold text-gray-900">March 15, 2030</p>
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <p className="text-lg font-semibold text-gray-900">123 Main Street, Anytown, CA 90210</p>
                  </div>
                </div>
                
                {/* Verification Status */}
                <div className="mt-6 pt-4 border-t border-green-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-800 font-semibold">Identity Verified</span>
                    </div>
                    <span className="text-sm text-green-700">
                      Verified on {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Export Button */}
                <div className="mt-4 pt-4 border-t border-green-300">
                  <button
                    onClick={() => {
                      const mockData = {
                        fullName: "John Michael Smith",
                        dateOfBirth: "March 15, 1990",
                        idNumber: "ID-789123456",
                        nationality: "United States",
                        gender: "Male",
                        expiryDate: "March 15, 2030",
                        address: "123 Main Street, Anytown, CA 90210",
                        verificationStatus: "verified",
                        similarity: result?.similarity,
                        confidence: result?.confidence,
                        verifiedAt: new Date().toISOString()
                      }
                      
                      const filename = `verified-id-${Date.now()}.json`
                      const blob = new Blob([JSON.stringify(mockData, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = filename
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Verified Data
                  </button>
                </div>
              </div>
            </div>
          ) : !isMatch ? (
            <div className="border-t pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <h3 className="text-lg font-semibold text-red-800">Identity Verification Failed</h3>
                </div>
                <p className="text-red-700 mb-4">
                  The identity information cannot be displayed because the face verification failed. 
                  The person in the live photo does not match the person in the ID card.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </div>
  )
}