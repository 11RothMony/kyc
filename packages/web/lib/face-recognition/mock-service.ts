import { 
  FaceDetectionResult, 
  FaceComparisonResult, 
  FaceRecognitionService,
  FaceRecognitionConfig 
} from '@/types/face-recognition'

export class MockFaceRecognitionService implements FaceRecognitionService {
  private config: FaceRecognitionConfig

  constructor(config: FaceRecognitionConfig) {
    this.config = {
      similarityThreshold: 0.8,
      qualityThreshold: 0.7,
      maxRetries: 3,
      timeout: 5000,
      ...config
    }
  }

  async detectFaces(imageData: string | ArrayBuffer): Promise<FaceDetectionResult[]> {
    // Simulate API delay
    await this.delay(500 + Math.random() * 1000)

    // Simulate face detection
    const mockResult: FaceDetectionResult = {
      confidence: 0.85 + Math.random() * 0.14, // Random confidence between 0.85-0.99
      boundingBox: {
        left: 0.2 + Math.random() * 0.1,
        top: 0.15 + Math.random() * 0.1,
        width: 0.4 + Math.random() * 0.2,
        height: 0.5 + Math.random() * 0.2
      },
      landmarks: {
        leftEye: { x: 0.35, y: 0.4 },
        rightEye: { x: 0.65, y: 0.4 },
        nose: { x: 0.5, y: 0.55 },
        leftMouth: { x: 0.42, y: 0.75 },
        rightMouth: { x: 0.58, y: 0.75 }
      },
      quality: {
        brightness: 0.7 + Math.random() * 0.3,
        sharpness: 0.8 + Math.random() * 0.2,
        pose: {
          roll: -5 + Math.random() * 10,
          yaw: -10 + Math.random() * 20,
          pitch: -8 + Math.random() * 16
        }
      }
    }

    // Simulate occasional no-face detection
    if (Math.random() < 0.05) {
      return []
    }

    return [mockResult]
  }

  async compareFaces(
    sourceImage: string | ArrayBuffer,
    targetImage: string | ArrayBuffer
  ): Promise<FaceComparisonResult> {
    // Simulate API delay
    await this.delay(800 + Math.random() * 1200)

    // Simulate face comparison with realistic results
    const baseSimilarity = 0.75 + Math.random() * 0.24 // Random similarity between 0.75-0.99
    const confidence = 0.8 + Math.random() * 0.19 // Random confidence between 0.8-0.99
    const threshold = this.config.similarityThreshold || 0.8

    // Simulate occasional failed matches
    const actualSimilarity = Math.random() < 0.1 ? 0.4 + Math.random() * 0.3 : baseSimilarity

    const result: FaceComparisonResult = {
      similarity: actualSimilarity,
      confidence: confidence,
      isMatch: actualSimilarity >= threshold,
      threshold: threshold,
      details: {
        qualityScore: 0.75 + Math.random() * 0.24,
        faceDetectionConfidence: 0.88 + Math.random() * 0.11,
        processingTime: 600 + Math.random() * 800
      }
    }

    return result
  }

  async validateImage(imageData: string | ArrayBuffer): Promise<boolean> {
    // Simulate API delay
    await this.delay(200 + Math.random() * 300)

    // Basic validation simulation
    if (typeof imageData === 'string') {
      // Check if it's a valid base64 data URL
      return imageData.startsWith('data:image/') && imageData.includes(',')
    } else {
      // Check if ArrayBuffer has reasonable size
      return imageData.byteLength > 1000 && imageData.byteLength < 10 * 1024 * 1024
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}