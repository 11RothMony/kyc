import { UploadService, UploadResult, FileData } from './upload-service'

export interface UnifiedUploadResult {
  success: boolean
  fileId?: string
  filename?: string
  size?: number
  error?: string
}

export interface UnifiedFileData {
  fileId: string
  filename: string
  size: number
  mimetype: string
  dataUrl: string
  uploadTime: string
}

export class UnifiedUploadService {
  static async uploadFile(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<UnifiedUploadResult> {
    const result = await UploadService.uploadFile(file, onProgress)
    return {
      success: result.success,
      fileId: result.fileId,
      filename: result.filename,
      size: result.size,
      error: result.error
    }
  }

  static async selectAndUploadFile(): Promise<UnifiedUploadResult> {
    return {
      success: false,
      error: 'File selection not available on web. Use file upload instead.'
    }
  }

  static async getFile(fileId: string): Promise<UnifiedFileData | null> {
    const result = await UploadService.getFile(fileId)
    if (result) {
      return {
        fileId: result.fileId,
        filename: result.filename,
        size: result.size,
        mimetype: result.mimetype,
        dataUrl: result.dataUrl,
        uploadTime: result.uploadTime
      }
    }
    return null
  }

  static async deleteFile(fileId: string): Promise<boolean> {
    return await UploadService.deleteFile(fileId)
  }

  static saveFileId(fileId: string): void {
    UploadService.saveFileId(fileId)
  }

  static getStoredFileId(): string | null {
    return UploadService.getStoredFileId()
  }

  static clearStoredFileId(): void {
    UploadService.clearStoredFileId()
  }
}