import { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { fileId } = req.query

  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ error: 'Invalid file ID' })
  }

  try {
    // Read metadata
    const metadataPath = path.join(UPLOAD_DIR, `${fileId}.json`)
    const metadataContent = await fs.readFile(metadataPath, 'utf-8')
    const metadata = JSON.parse(metadataContent)

    // Check if file exists
    const filePath = metadata.filePath
    await fs.access(filePath)

    // Read file and convert to base64
    const fileBuffer = await fs.readFile(filePath)
    const base64Data = fileBuffer.toString('base64')
    const dataUrl = `data:${metadata.mimetype};base64,${base64Data}`

    res.status(200).json({
      success: true,
      fileId: metadata.fileId,
      filename: metadata.originalName,
      size: metadata.size,
      mimetype: metadata.mimetype,
      dataUrl,
      uploadTime: metadata.uploadTime
    })

  } catch (error) {
    console.error('File retrieval error:', error)
    res.status(404).json({ 
      success: false,
      error: 'File not found or expired' 
    })
  }
}