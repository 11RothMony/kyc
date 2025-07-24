import { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { fileId } = req.query

  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid file ID' })
  }

  try {
    // Read metadata to get file path
    const metadataPath = path.join(UPLOAD_DIR, `${fileId}.json`)
    const metadataContent = await fs.readFile(metadataPath, 'utf-8')
    const metadata = JSON.parse(metadataContent)

    // Delete the actual file
    try {
      await fs.unlink(metadata.filePath)
    } catch (error) {
      console.log('File already deleted or not found:', error)
    }

    // Delete the metadata file
    try {
      await fs.unlink(metadataPath)
    } catch (error) {
      console.log('Metadata file already deleted or not found:', error)
    }

    res.status(200).json({ success: true })

  } catch (error) {
    console.error('File deletion error:', error)
    res.status(404).json({ 
      success: false,
      error: 'File not found' 
    })
  }
}