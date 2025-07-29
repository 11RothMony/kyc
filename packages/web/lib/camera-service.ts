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
      // Check if running in Capacitor environment
      if (this.isCapacitor()) {
        return await this.takeCapacitorPhoto(options)
      } else {
        // Use web browser MediaDevices API
        return await this.takeBrowserPhoto({ width: options.width || 640, height: options.height || 480 })
      }
    } catch (error) {
      console.error('Camera error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to access camera'
      }
    }
  }

  private static isCapacitor(): boolean {
    return typeof window !== 'undefined' && !!(window as any).Capacitor
  }

  private static async takeCapacitorPhoto(options: CameraOptions): Promise<CameraResult> {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
      
      const image = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: options.allowEditing || false,
        resultType: CameraResultType.DataUrl,
        source: options.source === 'gallery' ? CameraSource.Photos : CameraSource.Camera,
        width: options.width,
        height: options.height
      })

      return {
        success: true,
        imageData: image.dataUrl
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to take photo'
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
    try {
      if (this.isCapacitor()) {
        const { Camera } = await import('@capacitor/camera')
        const permissions = await Camera.requestPermissions()
        return permissions.camera === 'granted'
      } else {
        // For web browsers, permissions are requested when accessing getUserMedia
        return true
      }
    } catch (error) {
      console.error('Permission request failed:', error)
      return false
    }
  }

  static async checkPermissions(): Promise<boolean> {
    try {
      if (this.isCapacitor()) {
        const { Camera } = await import('@capacitor/camera')
        const permissions = await Camera.checkPermissions()
        return permissions.camera === 'granted'
      } else {
        // For web browsers, we assume permissions are handled by the browser
        return true
      }
    } catch (error) {
      console.error('Permission check failed:', error)
      return false
    }
  }
}