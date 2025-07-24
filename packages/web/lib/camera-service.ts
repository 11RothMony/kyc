export interface CameraResult {
  success: boolean
  imageData?: string
  error?: string
}

export interface CameraOptions {
  width?: number
  height?: number
  quality?: number
  allowEditing?: boolean
  source?: 'camera' | 'gallery'
}

export class CameraService {
  static async takePhoto(options: CameraOptions = {}): Promise<CameraResult> {
    try {
      // Use web browser MediaDevices API
      return await this.takeBrowserPhoto({ width: options.width || 640, height: options.height || 480 })
    } catch (error) {
      console.error('Camera error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to access camera'
      }
    }
  }

  private static async takeBrowserPhoto(options: { width: number; height: number }): Promise<CameraResult> {
    return new Promise((resolve) => {
      // For browser, we'll return a message that the component should handle the camera
      // This is because the existing AutoCamera component handles browser camera better
      resolve({
        success: false,
        error: 'Use AutoCamera component for browser camera access'
      })
    })
  }

  static async requestPermissions(): Promise<boolean> {
    // For web browsers, permissions are requested when accessing getUserMedia
    return true
  }

  static async checkPermissions(): Promise<boolean> {
    // For web browsers, we assume permissions are handled by the browser
    return true
  }
}