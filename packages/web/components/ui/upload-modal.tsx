// import React, { useState, useEffect } from 'react'
// import { Card, CardContent, CardHeader, CardTitle } from './card'
// import { Button } from './button'
// import { FileUpload } from './file-upload'
// import { UploadService, type FileData } from '@/lib/upload-service'

// interface UploadModalProps {
//   isOpen: boolean
//   onClose: () => void
//   onFileUpload: (fileData: FileData | null) => void
//   currentFileId?: string | null
// }

// export function UploadModal({ isOpen, onClose, onFileUpload, currentFileId }: UploadModalProps) {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null)
//   const [isUploading, setIsUploading] = useState(false)
//   const [uploadProgress, setUploadProgress] = useState(0)
//   const [uploadError, setUploadError] = useState<string | null>(null)
//   const [currentFileData, setCurrentFileData] = useState<FileData | null>(null)

//   useEffect(() => {
//     if (currentFileId) {
//       UploadService.getFile(currentFileId).then(setCurrentFileData)
//     } else {
//       setCurrentFileData(null)
//     }
//   }, [currentFileId])

//   const handleFileSelect = (file: File | null) => {
//     setSelectedFile(file)
//     setUploadError(null)
//   }

//   const handleConfirm = async () => {
//     if (!selectedFile) return

//     setIsUploading(true)
//     setUploadProgress(0)
//     setUploadError(null)

//     try {
//       const result = await UploadService.uploadFile(selectedFile, setUploadProgress)
      
//       if (result.success && result.fileId) {
//         // Save file ID to localStorage for persistence
//         UploadService.saveFileId(result.fileId)
        
//         // Get the uploaded file data
//         const fileData = await UploadService.getFile(result.fileId)
//         onFileUpload(fileData)
//         onClose()
//       } else {
//         setUploadError(result.error || 'Upload failed')
//       }
//     } catch (error) {
//       setUploadError(error instanceof Error ? error.message : 'Upload failed')
//     } finally {
//       setIsUploading(false)
//       setUploadProgress(0)
//     }
//   }

//   const handleCancel = () => {
//     setSelectedFile(null)
//     setUploadError(null)
//     setUploadProgress(0)
//     onClose()
//   }

//   useEffect(() => {
//     const handleEscape = (event: KeyboardEvent) => {
//       if (event.key === 'Escape') {
//         handleCancel()
//       }
//     }

//     if (isOpen) {
//       document.addEventListener('keydown', handleEscape)
//       document.body.style.overflow = 'hidden'
//     }

//     return () => {
//       document.removeEventListener('keydown', handleEscape)
//       document.body.style.overflow = 'unset'
//     }
//   }, [isOpen])

//   if (!isOpen) return null

//   return (
//     <div 
//       className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
//       onClick={handleCancel}
//       role="dialog"
//       aria-modal="true"
//       aria-labelledby="upload-modal-title"
//     >
//       <div 
//         className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <Card className="border-0 shadow-2xl">
//           <CardHeader className="flex flex-row items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                 <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                 </svg>
//               </div>
//               <CardTitle id="upload-modal-title" className="text-xl">Upload ID Card</CardTitle>
//             </div>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={handleCancel}
//               className="h-8 w-8 p-0"
//               aria-label="Close upload dialog"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </Button>
//           </CardHeader>
          
//           <CardContent className="space-y-6">
//             {/* Current File Info */}
//             {currentFileData && !selectedFile && (
//               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                 <div className="flex items-center gap-2 mb-2">
//                   <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <span className="font-medium text-green-800">Current ID Card</span>
//                 </div>
//                 <p className="text-sm text-green-700">
//                   {currentFileData.filename} ({Math.round(currentFileData.size / 1024)} KB)
//                 </p>
//                 <p className="text-xs text-green-600 mt-1">
//                   Uploaded: {new Date(currentFileData.uploadTime).toLocaleString()}
//                 </p>
//               </div>
//             )}

//             <div>
//               <p className="text-gray-600 mb-4">
//                 {currentFileData ? 'Replace your current ID card with a new one:' : 'Upload a clear photo of your government-issued ID card or passport for identity verification.'}
//               </p>
              
//               <FileUpload
//                 onFileSelect={handleFileSelect}
//                 accept="image/jpeg,image/jpg,image/png,application/pdf"
//                 maxSize={10}
//                 disabled={isUploading}
//               />
//             </div>

//             {/* Upload Progress */}
//             {isUploading && (
//               <div className="space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span className="text-gray-600">Uploading...</span>
//                   <span className="text-blue-600 font-medium">{uploadProgress}%</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div 
//                     className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//                     style={{ width: `${uploadProgress}%` }}
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Upload Error */}
//             {uploadError && (
//               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//                 <div className="flex items-center gap-2">
//                   <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <span className="text-red-800 text-sm font-medium">Upload Failed</span>
//                 </div>
//                 <p className="text-red-700 text-sm mt-1">{uploadError}</p>
//               </div>
//             )}

//             <div className="space-y-2">
//               <h4 className="font-semibold text-gray-900">Tips for best results:</h4>
//               <ul className="text-sm text-gray-600 space-y-1">
//                 <li>• Ensure good lighting and avoid shadows</li>
//                 <li>• Keep the ID card flat and fully visible</li>
//                 <li>• Make sure all text is clearly readable</li>
//                 <li>• Avoid glare or reflections</li>
//               </ul>
//             </div>

//             <div className="flex gap-3 pt-4">
//               <Button
//                 variant="outline"
//                 onClick={handleCancel}
//                 className="flex-1"
//                 disabled={isUploading}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handleConfirm}
//                 disabled={!selectedFile || isUploading}
//                 className="flex-1 bg-blue-600 hover:bg-blue-700"
//               >
//                 {isUploading ? 'Uploading...' : currentFileData ? 'Replace ID Card' : 'Upload ID Card'}
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   )
// }