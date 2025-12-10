import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const files = buildFileTree();
    res.status(200).json({ 
      files, 
      timestamp: new Date().toISOString(),
      totalFiles: countFiles(files)
    });
  } catch (error) {
    // Fallback to static structure if filesystem read fails
    const files = getStaticFiles();
    res.status(200).json({ files, timestamp: new Date().toISOString() });
  }
}

function buildFileTree() {
  const basePath = process.cwd();
  const ataDirPath = path.join(basePath, 'ata');
  const coreDirPath = path.join(basePath, 'core');
  const agentDirPath = path.join(basePath, 'agent');
  
  return [
    {
      name: 'ata',
      type: 'folder',
      path: '/ata',
      children: readDirectory(ataDirPath, 'ata')
    },
    {
      name: 'core',
      type: 'folder', 
      path: '/core',
      children: readDirectory(coreDirPath, 'core')
    },
    {
      name: 'agent',
      type: 'folder',
      path: '/agent', 
      children: readDirectory(agentDirPath, 'agent')
    }
  ];
}

function getStaticFiles() {
  return [

  ];
}

function readDirectory(dirPath: string, relativePath: string = ''): any[] {
  const items: any[] = [];
  
  try {
    if (fs.existsSync(dirPath)) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name).replace(/\\/g, '/');
        
        if (entry.isDirectory()) {
          items.push({
            name: entry.name,
            type: 'folder',
            path: `/${relPath}`,
            children: readDirectory(fullPath, relPath)
          });
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          items.push({
            name: entry.name,
            type: 'file',
            path: `/${relPath}`,
            created: stats.birthtime
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return items;
}

function countFiles(nodes: any[]): number {
  return nodes.reduce((count, node) => {
    if (node.type === 'file') return count + 1;
    if (node.children) return count + countFiles(node.children);
    return count;
  }, 0);
}