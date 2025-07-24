import { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm, File as FormidableFile } from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Disable default body parser to handle multipart data
export const config = {
  api: {
    bodyParser: false,
  },
}

interface UploadResponse {
  success: boolean
  fileId?: string
  filename?: string
  size?: number
  error?: string
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

function validateFile(file: FormidableFile): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
  }

  // Check file type
  if (!file.mimetype || !ALLOWED_TYPES.includes(file.mimetype)) {
    return 'Invalid file type. Please upload JPG, PNG, or PDF files only.'
  }

  return null
}

async function cleanupOldFiles() {
  try {
    const files = await fs.readdir(UPLOAD_DIR)
    const now = Date.now()
    const ONE_HOUR = 60 * 60 * 1000

    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file)
      const stats = await fs.stat(filePath)
      
      // Delete files older than 1 hour
      if (now - stats.mtime.getTime() > ONE_HOUR) {
        await fs.unlink(filePath)
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    await ensureUploadDir()
    
    // Clean up old files in background
    cleanupOldFiles().catch(console.error)

    const form = new IncomingForm({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
    })

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      // Clean up the uploaded file
      try {
        await fs.unlink(file.filepath)
      } catch (error) {
        // Ignore cleanup errors
        console.warn('Failed to clean up uploaded file:', error)
      }
      return res.status(400).json({ success: false, error: validationError })
    }

    // Generate unique file ID and rename file
    const fileId = uuidv4()
    const extension = path.extname(file.originalFilename || '')
    const newFilename = `${fileId}${extension}`
    const newFilePath = path.join(UPLOAD_DIR, newFilename)

    // Move file to new location with unique name
    await fs.rename(file.filepath, newFilePath)

    // Store file metadata (in a real app, this would go to a database)
    const metadata = {
      fileId,
      originalName: file.originalFilename,
      size: file.size,
      mimetype: file.mimetype,
      uploadTime: new Date().toISOString(),
      filePath: newFilePath
    }

    // Save metadata to a JSON file (in production, use a database)
    const metadataPath = path.join(UPLOAD_DIR, `${fileId}.json`)
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    res.status(200).json({
      success: true,
      fileId,
      filename: file.originalFilename || 'unknown',
      size: file.size
    })

  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during file upload' 
    })
  }
}