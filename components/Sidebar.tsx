import React, { useState } from 'react';
import { FileNode } from '../types';
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Image as ImageIcon, 
  FilePlus, 
  FolderPlus, 
  Upload, 
  MoreVertical,
  Home,
  Settings
} from 'lucide-react';

interface SidebarProps {
  root: FileNode;
  activeFileId: string;
  projectName: string;
  onSelectFile: (node: FileNode) => void;
  onToggleFolder: (nodeId: string) => void;
  onBackToDashboard: () => void;
}

const FileIcon = ({ name }: { name: string }) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'svg'].includes(ext || '')) return <ImageIcon size={14} className="text-purple-400" />;
  if (['bib'].includes(ext || '')) return <FileText size={14} className="text-yellow-500" />;
  if (['cls', 'sty'].includes(ext || '')) return <FileText size={14} className="text-orange-400" />;
  if (['tex'].includes(ext || '')) return <span className="text-[10px] font-bold text-blue-400 tracking-tighter mr-0.5">TeX</span>;
  return <FileText size={14} className="text-slate-400" />; 
};

const Sidebar: React.FC<SidebarProps> = ({
  root,
  activeFileId,
  projectName,
  onSelectFile,
  onToggleFolder,
  onBackToDashboard
}) => {
  
  const renderTree = (nodes: FileNode[], depth: number = 0) => {
    // Sort: Folders first, then files, alphabetical
    const sortedNodes = [...nodes].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
    });

    return (
      <ul className="flex flex-col gap-0.5">
        {sortedNodes.map((node) => (
          <li key={node.id}>
            <div
              onClick={() => node.type === 'folder' ? onToggleFolder(node.id) : onSelectFile(node)}
              className={`
                group flex items-center gap-2 py-1.5 px-3 cursor-pointer select-none text-sm transition-all relative
                ${activeFileId === node.id 
                    ? 'bg-slate-700/60 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }
              `}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              {activeFileId === node.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>
              )}

              {node.type === 'folder' && (
                <span className="text-slate-500 group-hover:text-slate-300 transition-colors">
                    {node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
              
              <span className="opacity-90 shrink-0">
                {node.type === 'folder' ? (
                    node.isOpen ? <FolderOpen size={15} className="text-blue-400/90" /> : <Folder size={15} className="text-blue-400/70" />
                ) : (
                    <FileIcon name={node.name} />
                )}
              </span>
              
              <span className="truncate font-medium text-[13px]">{node.name}</span>
              
              {node.type === 'file' && (
                 <div className={`ml-auto text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity ${activeFileId === node.id ? 'opacity-100' : ''}`}>
                     <MoreVertical size={12} />
                 </div>
              )}
            </div>
            
            {node.type === 'folder' && node.isOpen && node.children && (
              renderTree(node.children, depth + 1)
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="w-72 bg-[#1e293b] text-slate-300 flex flex-col h-full shrink-0 select-none font-sans border-r border-slate-900/50 dark-scroll">
      {/* Project Header */}
      <div className="h-16 flex items-center px-4 bg-[#0f172a] shadow-sm shrink-0 gap-3">
         <button 
            onClick={onBackToDashboard} 
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" 
            title="Back to Dashboard"
         >
            <Home size={18} />
         </button>
         <div className="overflow-hidden">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project</div>
            <div className="font-bold text-sm text-slate-200 truncate leading-tight">{projectName}</div>
         </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-slate-700/50 bg-[#1e293b]">
        <button className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-blue-400 transition-colors" title="New File">
            <FilePlus size={16} />
        </button>
        <button className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-blue-400 transition-colors" title="New Folder">
            <FolderPlus size={16} />
        </button>
        <button className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-blue-400 transition-colors" title="Upload">
            <Upload size={16} />
        </button>
        <div className="flex-1"></div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-4">
        {root.children && renderTree(root.children)}
      </div>
      
      {/* Footer */}
      <div className="border-t border-slate-700/50 bg-[#0f172a] p-3">
        <button className="flex items-center gap-2 w-full text-slate-400 hover:text-white text-xs font-medium transition-colors py-1">
            <Settings size={14} /> Project Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;