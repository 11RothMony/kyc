import { IDCardFormat } from '@/types/ocr'

export const idCardFormats: IDCardFormat[] = [
  {
    name: 'US Driver License',
    country: 'US',
    patterns: {
      name: [
        /^([A-Z\s]+),?\s+([A-Z\s]+)$/i,
        /^([A-Z]+)\s+([A-Z\s]+)$/i,
        /LN[:\s]+([A-Z\s]+)/i,
        /FN[:\s]+([A-Z\s]+)/i
      ],
      dateOfBirth: [
        /DOB[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
        /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
        /BIRTH[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i
      ],
      idNumber: [
        /DL[:\s]+([A-Z0-9]+)/i,
        /LIC[:\s]+([A-Z0-9]+)/i,
        /ID[:\s]+([A-Z0-9]+)/i
      ],
      expiryDate: [
        /EXP[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
        /EXPIRES[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i
      ],
      gender: [
        /SEX[:\s]+([MF])/i,
        /GENDER[:\s]+([MF])/i
      ]
    },
    dateFormats: ['MM/DD/YYYY', 'MM-DD-YYYY', 'MM/DD/YY', 'MM-DD-YY'],
    keywords: {
      name: ['NAME', 'LN', 'FN', 'LAST NAME', 'FIRST NAME'],
      dateOfBirth: ['DOB', 'DATE OF BIRTH', 'BIRTH'],
      idNumber: ['DL', 'LIC', 'LICENSE', 'ID'],
      expiryDate: ['EXP', 'EXPIRES', 'EXPIRY'],
      gender: ['SEX', 'GENDER']
    }
  },
  {
    name: 'UK Passport',
    country: 'GB',
    patterns: {
      name: [
        /^([A-Z\s]+)\s+([A-Z\s]+)$/i,
        /SURNAME[:\s]+([A-Z\s]+)/i,
        /GIVEN NAMES[:\s]+([A-Z\s]+)/i
      ],
      dateOfBirth: [
        /DATE OF BIRTH[:\s]+(\d{1,2}\s+[A-Z]{3}\s+\d{4})/i,
        /(\d{1,2}\s+[A-Z]{3}\s+\d{4})/
      ],
      documentNumber: [
        /PASSPORT NO[:\s]+([A-Z0-9]+)/i,
        /([A-Z0-9]{9})/
      ],
      nationality: [
        /NATIONALITY[:\s]+([A-Z]+)/i,
        /BRITISH CITIZEN/i
      ],
      gender: [
        /SEX[:\s]+([MF])/i
      ]
    },
    dateFormats: ['DD MMM YYYY', 'DD/MM/YYYY', 'DD-MM-YYYY'],
    keywords: {
      name: ['SURNAME', 'GIVEN NAMES', 'NAME'],
      dateOfBirth: ['DATE OF BIRTH', 'DOB'],
      documentNumber: ['PASSPORT NO', 'DOCUMENT NO'],
      nationality: ['NATIONALITY'],
      gender: ['SEX']
    }
  },
  {
    name: 'Generic ID Card',
    country: 'GENERIC',
    patterns: {
      name: [
        /NAME[:\s]+([A-Z\s]+)/i,
        /^([A-Z\s]+),?\s+([A-Z\s]+)$/i
      ],
      dateOfBirth: [
        /DOB[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
        /BIRTH[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
        /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/
      ],
      idNumber: [
        /ID[:\s]+([A-Z0-9]+)/i,
        /NUMBER[:\s]+([A-Z0-9]+)/i,
        /([A-Z0-9]{6,})/
      ],
      expiryDate: [
        /EXPIRES[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
        /EXPIRY[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i
      ]
    },
    dateFormats: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'],
    keywords: {
      name: ['NAME', 'FULL NAME'],
      dateOfBirth: ['DOB', 'DATE OF BIRTH', 'BIRTH'],
      idNumber: ['ID', 'NUMBER', 'CARD NUMBER'],
      expiryDate: ['EXPIRES', 'EXPIRY', 'VALID UNTIL']
    }
  }
]

export function getIDCardFormat(text: string): IDCardFormat {
  // Try to detect the format based on keywords and patterns
  for (const format of idCardFormats) {
    let score = 0
    
    // Check for country-specific keywords
    Object.values(format.keywords).flat().forEach(keyword => {
      if (text.toUpperCase().includes(keyword.toUpperCase())) {
        score += 1
      }
    })
    
    // If we have a good match, return this format
    if (score >= 3) {
      return format
    }
  }
  
  // Default to generic format
  const genericFormat = idCardFormats.find(f => f.country === 'GENERIC')
  if (genericFormat) {
    return genericFormat
  }
  
  // Fallback to first format if no generic format is found
  return idCardFormats[0]!
}