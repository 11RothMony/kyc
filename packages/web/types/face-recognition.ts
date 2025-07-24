export interface FaceDetectionResult {
  confidence: number
  boundingBox: {
    left: number
    top: number
    width: number
    height: number
  }
  landmarks?: {
    leftEye: { x: number; y: number }
    rightEye: { x: number; y: number }
    nose: { x: number; y: number }
    leftMouth: { x: number; y: number }
    rightMouth: { x: number; y: number }
  }
  quality?: {
    brightness: number
    sharpness: number
    pose: {
      roll: number
      yaw: number
      pitch: number
    }
  }
}

export interface FaceComparisonResult {
  similarity: number
  confidence: number
  isMatch: boolean
  threshold: number
  details?: {
    qualityScore: number
    faceDetectionConfidence: number
    processingTime: number
  }
}

export interface FaceRecognitionError {
  code: string
  message: string
  details?: any
}

export interface FaceRecognitionConfig {
  provider: 'aws' | 'azure' | 'mock'
  apiKey?: string
  region?: string
  endpoint?: string
  similarityThreshold?: number
  qualityThreshold?: number
  maxRetries?: number
  timeout?: number
}

export interface FaceRecognitionService {
  detectFaces(imageData: string | ArrayBuffer): Promise<FaceDetectionResult[]>
  compareFaces(
    sourceImage: string | ArrayBuffer,
    targetImage: string | ArrayBuffer
  ): Promise<FaceComparisonResult>
  validateImage(imageData: string | ArrayBuffer): Promise<boolean>
}