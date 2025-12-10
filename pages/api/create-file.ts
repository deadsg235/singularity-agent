import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path: filePath, content, name } = req.body;
    
    // Ensure the directory exists
    const fullPath = path.join(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(fullPath, content, 'utf8');
    
    res.status(200).json({ 
      success: true, 
      message: `File ${name} created successfully`,
      path: filePath
    });
  } catch (error) {
    console.error('File creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}