export interface OCRBoundingBox {
  left: number
  top: number
  width: number
  height: number
}

export interface OCRTextBlock {
  text: string
  confidence: number
  boundingBox: OCRBoundingBox
}

export interface OCRResult {
  fullText: string
  blocks: OCRTextBlock[]
  confidence: number
  processingTime: number
}

export interface ExtractedIDData {
  firstName?: string
  lastName?: string
  fullName?: string
  dateOfBirth?: string
  idNumber?: string
  documentNumber?: string
  expiryDate?: string
  issueDate?: string
  nationality?: string
  gender?: string
  address?: string
  placeOfBirth?: string
  confidence: {
    overall: number
    firstName?: number
    lastName?: number
    dateOfBirth?: number
    idNumber?: number
    documentNumber?: number
    expiryDate?: number
    nationality?: number
    gender?: number
    address?: number
  }
  rawData: OCRResult
}

export interface IDCardFormat {
  name: string
  country: string
  patterns: {
    name?: RegExp[]
    dateOfBirth?: RegExp[]
    idNumber?: RegExp[]
    documentNumber?: RegExp[]
    expiryDate?: RegExp[]
    issueDate?: RegExp[]
    nationality?: RegExp[]
    gender?: RegExp[]
  }
  dateFormats: string[]
  keywords: {
    name?: string[]
    dateOfBirth?: string[]
    idNumber?: string[]
    documentNumber?: string[]
    expiryDate?: string[]
    issueDate?: string[]
    nationality?: string[]
    gender?: string[]
  }
}

export interface OCRConfig {
  provider: 'tesseract' | 'aws-textract' | 'mock'
  language?: string
  tesseractOptions?: {
    logger?: (info: any) => void
    errorHandler?: (error: any) => void
  }
  awsConfig?: {
    region?: string
    accessKeyId?: string
    secretAccessKey?: string
  }
  confidenceThreshold?: number
  timeout?: number
}

export interface OCRService {
  extractText(imageData: string | ArrayBuffer): Promise<OCRResult>
  extractIDData(imageData: string | ArrayBuffer): Promise<ExtractedIDData>
  validateExtractedData(data: ExtractedIDData): boolean
}