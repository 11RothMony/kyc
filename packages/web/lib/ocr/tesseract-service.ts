import { createWorker } from 'tesseract.js'
import { OCRResult, ExtractedIDData, OCRService, OCRConfig } from '@/types/ocr'
import { getIDCardFormat } from './id-formats'

export class TesseractOCRService implements OCRService {
  private config: OCRConfig
  private worker: any = null
  private isInitialized = false

  constructor(config: OCRConfig) {
    this.config = {
      confidenceThreshold: 0.7,
      timeout: 30000,
      language: 'eng',
      ...config
    }
  }

  private async initializeWorker(): Promise<void> {
    if (this.isInitialized && this.worker) {
      return
    }

    try {
      console.log('Initializing Tesseract worker...')
      this.worker = await createWorker()

      await this.worker.loadLanguage(this.config.language || 'eng')
      await this.worker.initialize(this.config.language || 'eng')

      // Configure OCR parameters for better ID card recognition
      await this.worker.setParameters({
        tessedit_pageseg_mode: '6', // Uniform block of text
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:/-., ',
        preserve_interword_spaces: '1'
      })

      this.isInitialized = true
      console.log('Tesseract worker initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Tesseract worker:', error)
      throw new Error('OCR initialization failed')
    }
  }

  async extractText(imageData: string | ArrayBuffer): Promise<OCRResult> {
    await this.initializeWorker()
    
    if (!this.worker) {
      throw new Error('OCR worker not initialized')
    }

    try {
      const startTime = Date.now()
      
      // Convert imageData to format Tesseract can handle
      let processedImage: string | ArrayBuffer
      if (typeof imageData === 'string') {
        // Handle base64 data URLs
        processedImage = imageData
      } else {
        // Handle ArrayBuffer
        processedImage = imageData
      }

      console.log('Starting OCR text extraction...')
      
      // Add progress tracking
      let progressInterval: ReturnType<typeof setInterval> | null = null
      const progressPromise = new Promise<void>((resolve) => {
        let progress = 0
        progressInterval = setInterval(() => {
          progress += 10
          if (progress <= 90) {
            console.log(`OCR Progress: ${progress}%`)
          } else {
            if (progressInterval) {
              clearInterval(progressInterval)
            }
            resolve()
          }
        }, 200)
      })

      const result = await this.worker.recognize(processedImage)
      
      // Clear progress interval
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      
      const processingTime = Date.now() - startTime
      console.log(`OCR completed in ${processingTime}ms with confidence ${result.data.confidence}%`)

      // Process the result into our standard format
      const blocks = result.data.blocks?.map((block: any) => ({
        text: block.text,
        confidence: block.confidence / 100,
        boundingBox: {
          left: block.bbox.x0 / result.data.width,
          top: block.bbox.y0 / result.data.height,
          width: (block.bbox.x1 - block.bbox.x0) / result.data.width,
          height: (block.bbox.y1 - block.bbox.y0) / result.data.height
        }
      })) || []

      return {
        fullText: result.data.text,
        blocks,
        confidence: result.data.confidence / 100,
        processingTime
      }
    } catch (error) {
      console.error('OCR text extraction failed:', error)
      throw new Error('Text extraction failed')
    }
  }

  async extractIDData(imageData: string | ArrayBuffer): Promise<ExtractedIDData> {
    const ocrResult = await this.extractText(imageData)
    const format = getIDCardFormat(ocrResult.fullText)
    
    return this.parseIDData(ocrResult, format)
  }

  private parseIDData(ocrResult: OCRResult, format: any): ExtractedIDData {
    const text = ocrResult.fullText.toUpperCase()
    const data: ExtractedIDData = {
      confidence: { overall: 0 },
      rawData: ocrResult
    }

    // Extract name with improved patterns
    const namePatterns = [
      ...format.patterns.name || [],
      // Additional generic patterns
      /NAME[:\s]*([A-Z\s]+)/,
      /FULL\s*NAME[:\s]*([A-Z\s]+)/,
      /SURNAME[:\s]*([A-Z]+).*GIVEN\s*NAMES?[:\s]*([A-Z\s]+)/,
      /GIVEN\s*NAMES?[:\s]*([A-Z\s]+).*SURNAME[:\s]*([A-Z]+)/,
      /LAST[:\s]*([A-Z]+).*FIRST[:\s]*([A-Z\s]+)/,
      /FIRST[:\s]*([A-Z\s]+).*LAST[:\s]*([A-Z]+)/
    ]

    for (const pattern of namePatterns) {
      const match = text.match(pattern)
      if (match) {
        if (match[1] && match[2]) {
          // Two-part name (first, last)
          data.firstName = this.cleanText(match[1])
          data.lastName = this.cleanText(match[2])
          data.fullName = `${data.firstName} ${data.lastName}`
        } else if (match[1]) {
          // Single name string
          data.fullName = this.cleanText(match[1])
          const parts = data.fullName.split(' ').filter(part => part.length > 0)
          if (parts.length >= 2) {
            data.firstName = parts[0]
            data.lastName = parts.slice(1).join(' ')
          } else if (parts.length === 1) {
            data.firstName = parts[0]
          }
        }
        
        if (data.firstName || data.lastName) {
          data.confidence.firstName = this.calculateFieldConfidence(ocrResult, match[0])
          data.confidence.lastName = data.confidence.firstName
          break
        }
      }
    }

    // Extract date of birth with improved patterns
    const dobPatterns = [
      ...format.patterns.dateOfBirth || [],
      // Additional date patterns
      /DOB[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      /DATE\s*OF\s*BIRTH[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      /BIRTH[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      /BORN[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      /(\d{1,2})\s*(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/,
      /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/
    ]

    for (const pattern of dobPatterns) {
      const match = text.match(pattern)
      if (match) {
        if (match[1]) {
          data.dateOfBirth = this.cleanText(match[1])
        } else if (match[2] && match[3]) {
          // Handle DD MMM YYYY format
          data.dateOfBirth = `${match[1]}/${this.getMonthNumber(match[2])}/${match[3]}`
        }
        
        if (data.dateOfBirth) {
          data.confidence.dateOfBirth = this.calculateFieldConfidence(ocrResult, match[0])
          break
        }
      }
    }

    // Extract ID number with improved patterns
    const idPatterns = [
      ...format.patterns.idNumber || [],
      // Additional ID patterns
      /ID[:\s]*([A-Z0-9]+)/,
      /ID\s*NUMBER[:\s]*([A-Z0-9]+)/,
      /IDENTIFICATION[:\s]*([A-Z0-9]+)/,
      /LICENSE[:\s]*([A-Z0-9]+)/,
      /DL[:\s]*([A-Z0-9]+)/,
      /DRIVER\s*LICENSE[:\s]*([A-Z0-9]+)/,
      /CARD\s*NUMBER[:\s]*([A-Z0-9]+)/
    ]

    for (const pattern of idPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.idNumber = this.cleanText(match[1])
        data.confidence.idNumber = this.calculateFieldConfidence(ocrResult, match[0])
        break
      }
    }

    // Extract document number (for passports, etc.)
    const docPatterns = [
      ...format.patterns.documentNumber || [],
      /PASSPORT[:\s]*([A-Z0-9]+)/,
      /DOCUMENT[:\s]*([A-Z0-9]+)/,
      /NUMBER[:\s]*([A-Z0-9]+)/
    ]

    for (const pattern of docPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.documentNumber = this.cleanText(match[1])
        data.confidence.documentNumber = this.calculateFieldConfidence(ocrResult, match[0])
        break
      }
    }

    // Extract expiry date
    const expiryPatterns = [
      ...format.patterns.expiryDate || [],
      /EXP[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      /EXPIRES[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      /EXPIRY[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      /VALID\s*UNTIL[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/
    ]

    for (const pattern of expiryPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.expiryDate = this.cleanText(match[1])
        data.confidence.expiryDate = this.calculateFieldConfidence(ocrResult, match[0])
        break
      }
    }

    // Extract gender
    const genderPatterns = [
      ...format.patterns.gender || [],
      /SEX[:\s]*([MF])/,
      /GENDER[:\s]*([MF])/,
      /GENDER[:\s]*(MALE|FEMALE)/
    ]

    for (const pattern of genderPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const genderCode = match[1].toUpperCase()
        data.gender = genderCode === 'M' || genderCode === 'MALE' ? 'Male' : 'Female'
        data.confidence.gender = this.calculateFieldConfidence(ocrResult, match[0])
        break
      }
    }

    // Extract nationality
    const nationalityPatterns = [
      ...format.patterns.nationality || [],
      /NATIONALITY[:\s]*([A-Z\s]+)/,
      /CITIZEN[:\s]*([A-Z\s]+)/,
      /COUNTRY[:\s]*([A-Z\s]+)/
    ]

    for (const pattern of nationalityPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.nationality = this.cleanText(match[1])
        data.confidence.nationality = this.calculateFieldConfidence(ocrResult, match[0])
        break
      }
    }

    // Extract address if present
    const addressPatterns = [
      /ADDRESS[:\s]*([A-Z0-9\s,]+)/,
      /ADDR[:\s]*([A-Z0-9\s,]+)/,
      /RESIDENCE[:\s]*([A-Z0-9\s,]+)/
    ]

    for (const pattern of addressPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.address = this.cleanText(match[1])
        data.confidence.address = this.calculateFieldConfidence(ocrResult, match[0])
        break
      }
    }

    // Calculate overall confidence
    const confidenceValues = Object.values(data.confidence)
      .filter(c => typeof c === 'number' && c > 0)
    
    data.confidence.overall = confidenceValues.length > 0 
      ? confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length
      : Math.max(0.3, ocrResult.confidence - 0.2) // Base on OCR confidence but lower it

    return data
  }

  private calculateFieldConfidence(ocrResult: OCRResult, matchedText: string): number {
    // Find the block(s) that contain this text
    const relevantBlocks = ocrResult.blocks.filter(block => 
      block.text.toUpperCase().includes(matchedText.toUpperCase())
    )
    
    if (relevantBlocks.length === 0) {
      return ocrResult.confidence * 0.8 // Default to 80% of overall confidence
    }
    
    // Average confidence of relevant blocks
    const avgBlockConfidence = relevantBlocks.reduce((sum, block) => 
      sum + block.confidence, 0) / relevantBlocks.length
    
    return Math.min(avgBlockConfidence, ocrResult.confidence)
  }

  private getMonthNumber(monthName: string): string {
    const months: { [key: string]: string } = {
      'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    }
    return months[monthName.toUpperCase()] || '01'
  }

  private cleanText(text: string): string {
    return text.trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-/]/g, '')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  validateExtractedData(data: ExtractedIDData): boolean {
    // Check if we have minimum required fields
    const hasName = (data.firstName && data.lastName) || data.fullName
    const hasDateOfBirth = data.dateOfBirth
    const hasIdNumber = data.idNumber || data.documentNumber
    const hasGoodConfidence = data.confidence.overall >= (this.config.confidenceThreshold || 0.7)

    return !!(hasName && hasDateOfBirth && hasIdNumber && hasGoodConfidence)
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.isInitialized = false
      console.log('Tesseract worker terminated')
    }
  }
}