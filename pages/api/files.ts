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
  
  return [
    {
      name: 'ata',
      type: 'folder',
      path: '/ata',
      children: [
        { name: 'tool_creator.ts', type: 'file', path: '/ata/tool_creator.ts' },
        { name: 'self_modifier.ts', type: 'file', path: '/ata/self_modifier.ts' },
        { name: 'evolution_engine.ts', type: 'file', path: '/ata/evolution_engine.ts' },
        {
          name: 'generated',
          type: 'folder',
          path: '/ata/generated',
          children: [
            { name: 'DataAnalyzer.ts', type: 'file', path: '/ata/generated/DataAnalyzer.ts', created: new Date() },
            { name: 'CodeOptimizer.ts', type: 'file', path: '/ata/generated/CodeOptimizer.ts', created: new Date() }
          ]
        },
        {
          name: 'upgrades',
          type: 'folder',
          path: '/ata/upgrades',
          children: []
        }
      ]
    },
    {
      name: 'core',
      type: 'folder',
      path: '/core',
      children: [
        { name: 'neural_network.mojo', type: 'file', path: '/core/neural_network.mojo' },
        { name: 'reasoning_engine.ts', type: 'file', path: '/core/reasoning_engine.ts' },
        { name: 'langchain_integration.ts', type: 'file', path: '/core/langchain_integration.ts' },
        { name: 'llm_integration.ts', type: 'file', path: '/core/llm_integration.ts' }
      ]
    },
    {
      name: 'agent',
      type: 'folder',
      path: '/agent',
      children: [
        { name: 'self_referencing_agent.ts', type: 'file', path: '/agent/self_referencing_agent.ts' }
      ]
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