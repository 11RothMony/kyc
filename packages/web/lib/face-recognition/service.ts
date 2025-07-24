import { 
  FaceDetectionResult, 
  FaceComparisonResult, 
  FaceRecognitionService,
  FaceRecognitionConfig,
  FaceRecognitionError 
} from '@/types/face-recognition'
import { MockFaceRecognitionService } from './mock-service'

export class FaceRecognitionManager {
  private service: FaceRecognitionService
  private config: FaceRecognitionConfig

  constructor(config: FaceRecognitionConfig) {
    this.config = config
    this.service = this.createService(config)
  }

  private createService(config: FaceRecognitionConfig): FaceRecognitionService {
    switch (config.provider) {
      case 'aws':
        // In a real implementation, this would use AWS Rekognition SDK
        throw new Error('AWS Rekognition not implemented yet')
      case 'azure':
        // In a real implementation, this would use Azure Face API
        throw new Error('Azure Face API not implemented yet')
      case 'mock':
      default:
        return new MockFaceRecognitionService(config)
    }
  }

  async detectFacesInImage(imageData: string | ArrayBuffer): Promise<FaceDetectionResult[]> {
    try {
      // Validate image first
      const isValid = await this.service.validateImage(imageData)
      if (!isValid) {
        throw new Error('Invalid image format')
      }

      const faces = await this.service.detectFaces(imageData)
      return faces
    } catch (error) {
      throw this.handleError(error, 'Face detection failed')
    }
  }

  async compareFaces(
    idCardImage: string | ArrayBuffer,
    liveImage: string | ArrayBuffer
  ): Promise<FaceComparisonResult> {
    try {
      // Validate both images
      const [idValid, liveValid] = await Promise.all([
        this.service.validateImage(idCardImage),
        this.service.validateImage(liveImage)
      ])

      if (!idValid) {
        throw new Error('Invalid ID card image format')
      }
      if (!liveValid) {
        throw new Error('Invalid live image format')
      }

      // Detect faces in both images first
      const [idFaces, liveFaces] = await Promise.all([
        this.service.detectFaces(idCardImage),
        this.service.detectFaces(liveImage)
      ])

      if (idFaces.length === 0) {
        throw new Error('No face detected in ID card image')
      }
      if (liveFaces.length === 0) {
        throw new Error('No face detected in live image')
      }
      if (idFaces.length > 1) {
        throw new Error('Multiple faces detected in ID card image')
      }
      if (liveFaces.length > 1) {
        throw new Error('Multiple faces detected in live image')
      }

      // Compare the faces
      const comparison = await this.service.compareFaces(idCardImage, liveImage)
      return comparison
    } catch (error) {
      throw this.handleError(error, 'Face comparison failed')
    }
  }

  async processVerification(
    idCardImage: string | ArrayBuffer,
    liveImage: string | ArrayBuffer
  ): Promise<{
    success: boolean
    result: FaceComparisonResult | null
    error?: FaceRecognitionError
    processingSteps: {
      idCardFaceDetection: FaceDetectionResult[]
      liveFaceDetection: FaceDetectionResult[]
      comparison?: FaceComparisonResult
    }
  }> {
    try {
      // Step 1: Detect faces in ID card
      const idFaces = await this.detectFacesInImage(idCardImage)
      
      // Step 2: Detect faces in live image
      const liveFaces = await this.detectFacesInImage(liveImage)

      // Step 3: Compare faces
      const comparison = await this.compareFaces(idCardImage, liveImage)

      return {
        success: true,
        result: comparison,
        processingSteps: {
          idCardFaceDetection: idFaces,
          liveFaceDetection: liveFaces,
          comparison
        }
      }
    } catch (error) {
      const faceError = this.handleError(error, 'Verification process failed')
      return {
        success: false,
        result: null,
        error: faceError,
        processingSteps: {
          idCardFaceDetection: [],
          liveFaceDetection: []
        }
      }
    }
  }

  private handleError(error: any, defaultMessage: string): FaceRecognitionError {
    if (error instanceof Error) {
      return {
        code: 'FACE_RECOGNITION_ERROR',
        message: error.message,
        details: error
      }
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: defaultMessage,
      details: error
    }
  }

  // Utility methods
  async checkImageQuality(imageData: string | ArrayBuffer): Promise<{
    isGoodQuality: boolean
    issues: string[]
    score: number
  }> {
    try {
      const faces = await this.service.detectFaces(imageData)
      
      if (faces.length === 0) {
        return {
          isGoodQuality: false,
          issues: ['No face detected in image'],
          score: 0
        }
      }

      const face = faces[0]
      if (!face) {
        return {
          isGoodQuality: false,
          issues: ['No face detected in image'],
          score: 0
        }
      }
      
      const issues: string[] = []
      let score = 1.0

      // Check confidence
      if (face.confidence < 0.8) {
        issues.push('Low face detection confidence')
        score -= 0.2
      }

      // Check quality metrics if available
      if (face.quality) {
        if (face.quality.brightness < 0.3) {
          issues.push('Image too dark')
          score -= 0.2
        }
        if (face.quality.brightness > 0.9) {
          issues.push('Image too bright')
          score -= 0.2
        }
        if (face.quality.sharpness < 0.6) {
          issues.push('Image too blurry')
          score -= 0.3
        }
        
        // Check pose
        const pose = face.quality.pose
        if (Math.abs(pose.yaw) > 15) {
          issues.push('Face turned too much to the side')
          score -= 0.2
        }
        if (Math.abs(pose.pitch) > 15) {
          issues.push('Face tilted too much up or down')
          score -= 0.2
        }
        if (Math.abs(pose.roll) > 10) {
          issues.push('Face rotated too much')
          score -= 0.1
        }
      }

      return {
        isGoodQuality: score >= 0.6,
        issues,
        score: Math.max(0, score)
      }
    } catch (error) {
      return {
        isGoodQuality: false,
        issues: ['Failed to analyze image quality'],
        score: 0
      }
    }
  }
}

// Default configuration
export const defaultFaceRecognitionConfig: FaceRecognitionConfig = {
  provider: 'mock',
  similarityThreshold: 0.8,
  qualityThreshold: 0.7,
  maxRetries: 3,
  timeout: 10000
}

// Export singleton instance
export const faceRecognitionManager = new FaceRecognitionManager(defaultFaceRecognitionConfig)