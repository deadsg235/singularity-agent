import { useState, useEffect } from 'react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  created?: Date;
}

const FileExplorer: React.FC = () => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['ata', 'ata/generated']));

  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFileTree(data.files || getDefaultTree());
    } catch {
      setFileTree(getDefaultTree());
    }
  };

  const getDefaultTree = (): FileNode[] => [
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
        { name: 'langchain_integration.ts', type: 'file', path: '/core/langchain_integration.ts' }
      ]
    }
  ];

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderNode = (node: FileNode, depth: number = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(node.path);
    const indent = '  '.repeat(depth);

    return (
      <div key={node.path}>
        <div 
          className={`file-item ${node.type}`}
          onClick={() => node.type === 'folder' && toggleFolder(node.path)}
        >
          <span className="indent">{indent}</span>
          <span className="icon">
            {node.type === 'folder' ? (isExpanded ? '📂' : '📁') : '📄'}
          </span>
          <span className="name">{node.name}</span>
          {node.created && <span className="created">• NEW</span>}
        </div>
        {node.type === 'folder' && isExpanded && node.children && (
          <div className="children">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <span>📁 ULTIMA FILE SYSTEM</span>
        <button onClick={loadFileTree} className="refresh-btn">🔄</button>
      </div>
      <div className="file-tree">
        {fileTree.map(node => renderNode(node))}
      </div>
      
      <style jsx>{`
        .file-explorer {
          background: rgba(17, 0, 0, 0.4);
          border: 1px solid #440000;
          border-radius: 6px;
          margin: 10px 0;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .explorer-header {
          background: #220000;
          padding: 8px 12px;
          border-bottom: 1px solid #440000;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: bold;
        }
        
        .refresh-btn {
          background: none;
          border: none;
          color: #ff6666;
          cursor: pointer;
          font-size: 14px;
        }
        
        .file-tree {
          padding: 8px;
          font-family: 'Fira Code', monospace;
          font-size: 12px;
        }
        
        .file-item {
          display: flex;
          align-items: center;
          padding: 2px 0;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .file-item:hover {
          background: rgba(255, 68, 68, 0.1);
        }
        
        .file-item.folder {
          color: #ff6666;
        }
        
        .file-item.file {
          color: #cc4444;
        }
        
        .icon {
          margin-right: 6px;
          font-size: 10px;
        }
        
        .name {
          flex: 1;
        }
        
        .created {
          color: #ff8888;
          font-size: 10px;
          margin-left: 8px;
        }
        
        .indent {
          color: #440000;
        }
      `}</style>
    </div>
  );
};

export default FileExplorer;