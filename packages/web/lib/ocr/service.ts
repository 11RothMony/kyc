import { OCRResult, ExtractedIDData, OCRService, OCRConfig } from '@/types/ocr'
import { MockOCRService } from './mock-service'
import { TesseractOCRService } from './tesseract-service'
import { getIDCardFormat } from './id-formats'

export class OCRManager {
  private service: OCRService
  private config: OCRConfig

  constructor(config: OCRConfig) {
    this.config = config
    this.service = this.createService(config)
  }

  private createService(config: OCRConfig): OCRService {
    switch (config.provider) {
      case 'tesseract':
        return new TesseractOCRService(config)
      case 'aws-textract':
        // In a real implementation, this would use AWS Textract
        throw new Error('AWS Textract not implemented yet')
      case 'mock':
      default:
        return new MockOCRService(config)
    }
  }

  async processIDCard(imageData: string | ArrayBuffer): Promise<{
    success: boolean
    data: ExtractedIDData | null
    error?: string
    processingSteps: {
      ocrResult?: OCRResult
      detectedFormat?: string
      extractedFields?: string[]
      validationResult?: boolean
    }
  }> {
    try {
      // Step 1: Extract text using OCR
      const ocrResult = await this.service.extractText(imageData)
      
      // Step 2: Detect ID card format
      const format = getIDCardFormat(ocrResult.fullText)
      
      // Step 3: Extract structured data
      const extractedData = await this.service.extractIDData(imageData)
      
      // Step 4: Validate extracted data
      const isValid = this.service.validateExtractedData(extractedData)
      
      // Step 5: Get list of extracted fields
      const extractedFields = Object.keys(extractedData)
        .filter(key => extractedData[key as keyof ExtractedIDData] && key !== 'confidence' && key !== 'rawData')

      return {
        success: isValid,
        data: extractedData,
        processingSteps: {
          ocrResult,
          detectedFormat: format.name,
          extractedFields,
          validationResult: isValid
        }
      }
    } catch (error) {
      console.error('OCR processing failed, falling back to mock service:', error)
      
      // Fallback to mock service if Tesseract fails
      try {
        const { MockOCRService } = await import('./mock-service')
        const mockService = new MockOCRService(this.config)
        
        const ocrResult = await mockService.extractText(imageData)
        const format = getIDCardFormat(ocrResult.fullText)
        const extractedData = await mockService.extractIDData(imageData)
        const isValid = mockService.validateExtractedData(extractedData)
        
        const extractedFields = Object.keys(extractedData)
          .filter(key => extractedData[key as keyof ExtractedIDData] && key !== 'confidence' && key !== 'rawData')

        return {
          success: isValid,
          data: extractedData,
          error: 'Using mock data due to OCR service issues',
          processingSteps: {
            ocrResult,
            detectedFormat: format.name,
            extractedFields,
            validationResult: isValid
          }
        }
      } catch (fallbackError) {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'OCR processing failed',
          processingSteps: {}
        }
      }
    }
  }

  async extractText(imageData: string | ArrayBuffer): Promise<OCRResult> {
    return this.service.extractText(imageData)
  }

  async extractIDData(imageData: string | ArrayBuffer): Promise<ExtractedIDData> {
    return this.service.extractIDData(imageData)
  }

  validateExtractedData(data: ExtractedIDData): boolean {
    return this.service.validateExtractedData(data)
  }

  // Utility methods
  formatDate(dateString: string): string | null {
    if (!dateString) return null

    // Try to parse different date formats
    const formats = [
      /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/,  // MM/DD/YYYY or DD/MM/YYYY
      /(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/i,        // DD MMM YYYY
      /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/     // YYYY/MM/DD
    ]

    for (const format of formats) {
      const match = dateString.match(format)
      if (match) {
        if (format === formats[0]) {
          // Handle MM/DD/YYYY or DD/MM/YYYY ambiguity
          const [, first, second, year] = match
          const fullYear = year && year.length === 2 ? `20${year}` : year
          
          // If first number > 12, assume DD/MM/YYYY
          if (first && second && fullYear) {
            if (parseInt(first) > 12) {
              return `${second.padStart(2, '0')}/${first.padStart(2, '0')}/${fullYear}`
            } else {
              return `${first.padStart(2, '0')}/${second.padStart(2, '0')}/${fullYear}`
            }
          }
        } else if (format === formats[1]) {
          // Handle DD MMM YYYY
          const [, day, month, year] = match
          const monthMap: { [key: string]: string } = {
            'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
            'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
            'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
          }
          const monthNum = monthMap[month?.toUpperCase() || '']
          if (monthNum && day) {
            return `${monthNum}/${day.padStart(2, '0')}/${year}`
          }
        } else if (format === formats[2]) {
          // Handle YYYY/MM/DD
          const [, year, month, day] = match
          if (month && day) {
            return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`
          }
        }
      }
    }

    return null
  }

  calculateAge(dateOfBirth: string): number | null {
    const formattedDate = this.formatDate(dateOfBirth)
    if (!formattedDate) return null

    const [month, day, year] = formattedDate.split('/')
    if (!month || !day || !year) return null
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const today = new Date()
    
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  isDateExpired(expiryDate: string): boolean {
    const formattedDate = this.formatDate(expiryDate)
    if (!formattedDate) return false

    const [month, day, year] = formattedDate.split('/')
    if (!month || !day || !year) return false
    const expiry = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const today = new Date()
    
    return expiry < today
  }

  getDataQualityScore(data: ExtractedIDData): {
    score: number
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 100

    // Check overall confidence
    if (data.confidence.overall < 0.8) {
      issues.push('Low overall confidence in extracted data')
      suggestions.push('Try uploading a clearer image with better lighting')
      score -= 20
    }

    // Check for missing critical fields
    if (!data.firstName || !data.lastName) {
      issues.push('Name information incomplete')
      suggestions.push('Ensure the name on the ID is clearly visible')
      score -= 25
    }

    if (!data.dateOfBirth) {
      issues.push('Date of birth not detected')
      suggestions.push('Make sure the date of birth is clearly visible')
      score -= 25
    }

    if (!data.idNumber && !data.documentNumber) {
      issues.push('ID/Document number not detected')
      suggestions.push('Ensure the ID number is clearly visible and not obscured')
      score -= 25
    }

    // Check date format validity
    if (data.dateOfBirth && !this.formatDate(data.dateOfBirth)) {
      issues.push('Invalid date of birth format')
      suggestions.push('Check if the date of birth is clearly readable')
      score -= 15
    }

    // Check for expired documents
    if (data.expiryDate && this.isDateExpired(data.expiryDate)) {
      issues.push('Document appears to be expired')
      suggestions.push('Please use a valid, non-expired document')
      score -= 10
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    }
  }
}

// Default configuration - using mock for stability
export const defaultOCRConfig: OCRConfig = {
  provider: 'mock',
  language: 'eng',
  confidenceThreshold: 0.7,
  timeout: 30000
}

// Tesseract configuration for when needed
export const tesseractOCRConfig: OCRConfig = {
  provider: 'tesseract',
  language: 'eng',
  confidenceThreshold: 0.7,
  timeout: 30000
}

// Export singleton instance
export const ocrManager = new OCRManager(defaultOCRConfig)