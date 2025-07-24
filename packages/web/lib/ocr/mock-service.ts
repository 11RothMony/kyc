import { OCRResult, ExtractedIDData, OCRService, OCRConfig } from '@/types/ocr'
import { getIDCardFormat } from './id-formats'

export class MockOCRService implements OCRService {
  private config: OCRConfig

  constructor(config: OCRConfig) {
    this.config = {
      confidenceThreshold: 0.7,
      timeout: 5000,
      language: 'eng',
      ...config
    }
  }

  async extractText(imageData: string | ArrayBuffer): Promise<OCRResult> {
    // Simulate OCR processing delay
    await this.delay(1000 + Math.random() * 2000)

    // Generate realistic mock OCR result
    const mockTexts = [
      'DRIVER LICENSE\nJOHN SMITH\nDOB: 01/15/1990\nDL: A1234567\nEXP: 01/15/2028\nSEX: M\nCLASS: C',
      'PASSPORT\nSURNAME: JOHNSON\nGIVEN NAMES: SARAH MARIE\nDATE OF BIRTH: 25 JUN 1985\nPASSPORT NO: 123456789\nNATIONALITY: BRITISH CITIZEN\nSEX: F',
      'IDENTITY CARD\nNAME: MICHAEL BROWN\nDOB: 03/22/1988\nID: 987654321\nEXPIRES: 03/22/2030\nADDRESS: 123 MAIN ST\nCITY: ANYTOWN',
      'NATIONAL ID\nFULL NAME: EMMA WILSON\nBIRTH: 12/08/1992\nNUMBER: ID123456789\nEXPIRY: 12/08/2032\nGENDER: F\nNATIONALITY: AMERICAN'
    ]

    const selectedText = mockTexts[Math.floor(Math.random() * mockTexts.length)]!
    const lines = selectedText.split('\n')
    
    const blocks = lines.map((line, index) => ({
      text: line,
      confidence: 0.8 + Math.random() * 0.19,
      boundingBox: {
        left: 0.1 + Math.random() * 0.1,
        top: 0.1 + (index * 0.1),
        width: 0.8 + Math.random() * 0.1,
        height: 0.08
      }
    }))

    return {
      fullText: selectedText,
      blocks,
      confidence: 0.85 + Math.random() * 0.14,
      processingTime: 1200 + Math.random() * 800
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

    // Extract name
    const namePatterns = format.patterns.name || []
    for (const pattern of namePatterns) {
      const match = text.match(pattern)
      if (match) {
        if (match[1] && match[2]) {
          data.firstName = this.cleanText(match[2])
          data.lastName = this.cleanText(match[1])
          data.fullName = `${data.firstName} ${data.lastName}`
        } else if (match[1]) {
          data.fullName = this.cleanText(match[1])
          const parts = data.fullName.split(' ')
          if (parts.length >= 2) {
            data.firstName = parts[0]
            data.lastName = parts.slice(1).join(' ')
          }
        }
        data.confidence.firstName = 0.8 + Math.random() * 0.19
        data.confidence.lastName = 0.8 + Math.random() * 0.19
        break
      }
    }

    // Extract date of birth
    const dobPatterns = format.patterns.dateOfBirth || []
    for (const pattern of dobPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.dateOfBirth = this.cleanText(match[1])
        data.confidence.dateOfBirth = 0.8 + Math.random() * 0.19
        break
      }
    }

    // Extract ID number
    const idPatterns = format.patterns.idNumber || []
    for (const pattern of idPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.idNumber = this.cleanText(match[1])
        data.confidence.idNumber = 0.8 + Math.random() * 0.19
        break
      }
    }

    // Extract document number
    const docPatterns = format.patterns.documentNumber || []
    for (const pattern of docPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.documentNumber = this.cleanText(match[1])
        data.confidence.documentNumber = 0.8 + Math.random() * 0.19
        break
      }
    }

    // Extract expiry date
    const expiryPatterns = format.patterns.expiryDate || []
    for (const pattern of expiryPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.expiryDate = this.cleanText(match[1])
        break
      }
    }

    // Extract gender
    const genderPatterns = format.patterns.gender || []
    for (const pattern of genderPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.gender = match[1].toUpperCase() === 'M' ? 'Male' : 'Female'
        break
      }
    }

    // Extract nationality
    const nationalityPatterns = format.patterns.nationality || []
    for (const pattern of nationalityPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        data.nationality = this.cleanText(match[1])
        break
      }
    }

    // Calculate overall confidence
    const confidenceValues = Object.values(data.confidence).filter(c => typeof c === 'number')
    data.confidence.overall = confidenceValues.length > 0 
      ? confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length
      : 0.5

    return data
  }

  private cleanText(text: string): string {
    return text.trim().replace(/\s+/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  validateExtractedData(data: ExtractedIDData): boolean {
    // Check if we have minimum required fields
    const hasName = data.firstName && data.lastName
    const hasDateOfBirth = data.dateOfBirth
    const hasIdNumber = data.idNumber || data.documentNumber
    const hasGoodConfidence = data.confidence.overall >= (this.config.confidenceThreshold || 0.7)

    return !!(hasName && hasDateOfBirth && hasIdNumber && hasGoodConfidence)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}