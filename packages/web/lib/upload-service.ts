export interface UploadResult {
  success: boolean
  fileId?: string
  filename?: string
  size?: number
  error?: string
}

export interface FileData {
  fileId: string
  filename: string
  size: number
  mimetype: string
  dataUrl: string
  uploadTime: string
}

export class UploadService {
  static async uploadFile(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            onProgress(progress)
          }
        })
      }

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          reject(new Error('Invalid response from server'))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'))
      })

      xhr.open('POST', '/api/upload-id')
      xhr.timeout = 30000 // 30 second timeout
      xhr.send(formData)
    })
  }

  static async getFile(fileId: string): Promise<FileData | null> {
    try {
      const response = await fetch(`/api/get-file/${fileId}`)
      const data = await response.json()
      
      if (data.success) {
        return data
      } else {
        console.error('Failed to retrieve file:', data.error)
        return null
      }
    } catch (error) {
      console.error('Error retrieving file:', error)
      return null
    }
  }

  static async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/delete-file/${fileId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  // Store file ID in localStorage for persistence
  static saveFileId(fileId: string) {
    try {
      localStorage.setItem('kyc_uploaded_file_id', fileId)
    } catch (error) {
      console.error('Failed to save file ID to localStorage:', error)
    }
  }

  // Retrieve file ID from localStorage
  static getStoredFileId(): string | null {
    try {
      return localStorage.getItem('kyc_uploaded_file_id')
    } catch (error) {
      console.error('Failed to retrieve file ID from localStorage:', error)
      return null
    }
  }

  // Clear stored file ID
  static clearStoredFileId() {
    try {
      localStorage.removeItem('kyc_uploaded_file_id')
    } catch (error) {
      console.error('Failed to clear file ID from localStorage:', error)
    }
  }
}