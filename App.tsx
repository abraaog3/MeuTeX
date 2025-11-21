
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import AIPanel from './components/AIPanel';
import Dashboard from './components/Dashboard';
import { processLatexWithAI } from './services/geminiService';
import { Project, FileNode, ViewMode, AIAction, LogEntry } from './types';
import { useProjects } from './hooks/useProjects';
import { Play, Columns, Eye, Code, Share2, Download, RotateCw, MessageCircle, Settings, ArrowLeft, FileText, Menu, Cloud, AlertTriangle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // Data Persistence Hook
  const { projects, status, isLoading, addProject, updateProject, deleteProject } = useProjects();

  // Global State
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  
  // Editor Session State
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const [isCompiling, setIsCompiling] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [compiledContent, setCompiledContent] = useState<string>('');
  const [previewAssets, setPreviewAssets] = useState<Record<string, string>>({});

  // --- Helpers to manage Tree State ---
  const activeProject = projects.find(p => p.id === activeProjectId);

  // Recursively find a node
  const findNode = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
        }
    }
    return null;
  };

  // Helper to flatten tree for easy lookup by name (for imports)
  const flattenProjectFiles = (node: FileNode, acc: Record<string, FileNode> = {}) => {
      if (node.type === 'file') {
          acc[node.name] = node;
      } else if (node.children) {
          node.children.forEach(c => flattenProjectFiles(c, acc));
      }
      return acc;
  };

  const updateNodeInTree = (nodes: FileNode[], nodeId: string, changes: Partial<FileNode>): FileNode[] => {
    return nodes.map(node => {
        if (node.id === nodeId) return { ...node, ...changes };
        if (node.children) return { ...node, children: updateNodeInTree(node.children, nodeId, changes) };
        return node;
    });
  };

  // --- Actions ---

  const handleOpenProject = (projectId: string) => {
    setActiveProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    if (project) {
        const main = project.root.children?.find(c => c.name === 'main.tex') || project.root.children?.find(c => c.type === 'file');
        if (main) setActiveFileId(main.id);
        
        // Initial compile attempt
        if (main && main.content) {
             setCompiledContent(main.content);
        }
    }
    setView('editor');
  };

  const handleCreateProject = () => {
     const newProj: Project = {
         id: Date.now().toString(),
         name: 'New Blank Project',
         owner: 'user@example.com',
         lastModified: Date.now(),
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
         root: {
             id: 'root_' + Date.now(),
             name: 'root',
             type: 'folder',
             children: [
                 { id: 'main_' + Date.now(), name: 'main.tex', type: 'file', content: '\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}' }
             ]
         }
     };
     addProject(newProj);
     handleOpenProject(newProj.id);
  };

  const handleImportProject = (fileList: FileList) => {
    const newProjId = Date.now().toString();
    const rootChildren: FileNode[] = [];
    
    const getOrCreateFolder = (currentLevel: FileNode[], folderName: string): FileNode => {
        let folder = currentLevel.find(n => n.type === 'folder' && n.name === folderName);
        if (!folder) {
            folder = { 
                id: 'folder_' + Math.random().toString(36).substr(2, 9), 
                name: folderName, 
                type: 'folder', 
                children: [], 
                isOpen: false 
            };
            currentLevel.push(folder);
        }
        return folder;
    };

    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];

    Array.from(fileList).forEach(file => {
        const path = file.webkitRelativePath || file.name;
        const parts = path.split('/');
        const fileName = parts.pop() || file.name;
        
        let currentLevel = rootChildren;
        parts.forEach(part => {
             const folder = getOrCreateFolder(currentLevel, part);
             if (!folder.children) folder.children = [];
             currentLevel = folder.children;
        });

        const reader = new FileReader();
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        
        reader.onload = (e) => {
            const content = e.target?.result as string;
            currentLevel.push({
                id: 'file_' + Math.random().toString(36).substr(2, 9),
                name: fileName,
                type: 'file',
                content: content // Stores Base64 for images, text for others
            });
        };

        if (imageExtensions.includes(ext)) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    });

    setTimeout(() => {
        let finalChildren = rootChildren;
        let projName = 'Imported Project';
        
        if (rootChildren.length === 1 && rootChildren[0].type === 'folder') {
            projName = rootChildren[0].name;
            finalChildren = rootChildren[0].children || [];
        }

        const newProj: Project = {
            id: newProjId,
            name: projName,
            owner: 'user@example.com',
            lastModified: Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            root: {
                id: 'root_' + newProjId,
                name: 'root',
                type: 'folder',
                children: finalChildren
            }
        };
        addProject(newProj);
        setLogs([{ id: '1', type: 'info', message: 'Project imported successfully.', timestamp: Date.now() }]);
        handleOpenProject(newProjId);
    }, 1000);
  };

  const handleDeleteProject = (id: string) => {
      deleteProject(id);
  };

  const handleFileChange = (newContent: string) => {
      if (!activeProject) return;
      
      const updatedRoot = { 
          ...activeProject.root, 
          children: updateNodeInTree(activeProject.root.children || [], activeFileId, { content: newContent }) 
      };
      
      updateProject({
          ...activeProject,
          root: updatedRoot,
          lastModified: Date.now(),
          updatedAt: new Date().toISOString()
      });
  };

  const handleToggleFolder = (nodeId: string) => {
      if (!activeProject) return;
      const node = findNode(activeProject.root.children || [], nodeId);
      if (node) {
          const updatedRoot = { 
            ...activeProject.root, 
            children: updateNodeInTree(activeProject.root.children || [], nodeId, { isOpen: !node.isOpen }) 
          };
          updateProject({ ...activeProject, root: updatedRoot });
      }
  };

  // --- Compilation Logic ---

  const resolveLatexImports = (content: string, fileMap: Record<string, FileNode>, processed: Set<string> = new Set()): string => {
      return content.replace(/\\(?:input|include)\{([^}]+)\}/g, (match, importPath) => {
          let filename = importPath.split('/').pop() || importPath;
          if (!filename.endsWith('.tex')) filename += '.tex';

          // Handle relative paths in a basic way if needed, for now flat map search
          const fileNode = Object.values(fileMap).find(f => f.name === filename);

          if (processed.has(filename)) return `\n% Recursive loop detected: ${filename}\n`;
          
          if (fileNode && fileNode.content) {
              const newProcessed = new Set(processed);
              newProcessed.add(filename);
              return `\n% Begin ${filename}\n${resolveLatexImports(fileNode.content, fileMap, newProcessed)}\n% End ${filename}\n`;
          }

          return `\n% Missing file: ${filename}\n`;
      });
  };

  const handleRecompile = () => {
    if (!activeProject) return;
    setIsCompiling(true);

    // Flatten project to find files easily
    const fileMap = flattenProjectFiles(activeProject.root);
    const allFiles = Object.values(fileMap);
    
    // Find Main File
    let mainFile = fileMap['main.tex'];
    if (!mainFile) {
        // Fallback: try to find active file or any tex file
        const activeNode = findNode(activeProject.root.children || [], activeFileId);
        if (activeNode && activeNode.name.endsWith('.tex')) {
             mainFile = activeNode;
        } else {
             mainFile = allFiles.find(f => f.name.endsWith('.tex'));
        }
    }

    setTimeout(() => {
        if (mainFile && mainFile.content) {
            // 1. Resolve Imports (recursively)
            const resolvedContent = resolveLatexImports(mainFile.content, fileMap);
            
            // 2. Extract Assets (Images)
            const assets: Record<string, string> = {};
            allFiles.forEach(f => {
                if (f.content && /\.(png|jpe?g|gif|svg)$/i.test(f.name)) {
                    assets[f.name] = f.content; 
                }
            });
            
            // Update State for Preview
            setPreviewAssets(assets);
            setCompiledContent(resolvedContent);

            // 3. Logs
            const newLogs: LogEntry[] = [];
            if (!resolvedContent.includes('\\documentclass')) {
                 newLogs.push({
                    id: Date.now().toString(),
                    type: 'warning',
                    message: 'Missing \\documentclass declaration. Preview may not render correctly.',
                    file: mainFile.name,
                    timestamp: Date.now()
                });
            } else {
                 newLogs.push({
                    id: Date.now().toString(),
                    type: 'info',
                    message: `Compilation finished. Output: project.pdf`,
                    timestamp: Date.now()
                });
            }
            setLogs(newLogs);
        } else {
            setLogs([{ id: 'err', type: 'error', message: 'No main LaTeX file found to compile.', timestamp: Date.now() }]);
        }
        setIsCompiling(false);
    }, 600);
  };

  const handleAIAction = async (action: AIAction, prompt?: string) => {
    if (!activeProject) return;
    const currentFile = activeProject?.root.children ? findNode(activeProject.root.children, activeFileId) : null;
    if (!currentFile || !currentFile.content) return;

    setAiProcessing(true);
    try {
        let result = "";
        if (action === AIAction.GENERATE && prompt) {
            result = await processLatexWithAI("", action, prompt);
            handleFileChange(currentFile.content + "\n\n" + result);
        } else {
            result = await processLatexWithAI(currentFile.content, action);
            if (action === AIAction.EXPLAIN) {
                alert(result); 
            } else {
                handleFileChange(result);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        setAiProcessing(false);
    }
  };

  const downloadPDF = () => {
      // @ts-ignore
      if (typeof window.html2pdf !== 'undefined') {
          const element = document.getElementById('preview-document');
          if (element) {
              const opt = {
                margin: 10,
                filename: `${activeProject?.name || 'document'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };
              // @ts-ignore
              window.html2pdf().set(opt).from(element).save();
          }
      } else {
          alert('PDF generation library not loaded.');
      }
  };

  // Render Status Indicator
  const renderStatus = () => {
      if (status === 'saving') {
          return <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium"><Loader2 size={12} className="animate-spin" /> Saving...</div>;
      }
      if (status === 'saved') {
          return <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium"><Cloud size={12} /> Saved</div>;
      }
      if (status === 'error') {
          return <div className="flex items-center gap-1.5 text-red-500 text-xs font-medium"><AlertTriangle size={12} /> Save Error</div>;
      }
      return null;
  };

  if (view === 'dashboard') {
      return (
          <Dashboard 
            projects={projects}
            isLoading={isLoading}
            onOpenProject={handleOpenProject}
            onCreateProject={handleCreateProject}
            onImportProject={handleImportProject}
            onDeleteProject={handleDeleteProject}
          />
      );
  }

  const currentFileNode = activeProject && activeProject.root.children ? findNode(activeProject.root.children, activeFileId) : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      <Sidebar 
        root={activeProject?.root || { id: 'root', name: 'root', type: 'folder', children: [] }} 
        activeFileId={activeFileId}
        projectName={activeProject?.name || 'Untitled'}
        onSelectFile={(node) => setActiveFileId(node.id)}
        onToggleFolder={handleToggleFolder}
        onBackToDashboard={() => setView('dashboard')}
      />

      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Top Toolbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
           <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleRecompile}
                        disabled={isCompiling}
                        className="bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                    >
                        <Play size={14} fill="currentColor" /> Recompile
                    </button>
                    
                    <div className="ml-4 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                         {renderStatus()}
                    </div>
                </div>
           </div>
            
           <div className="flex items-center gap-4 text-slate-500">
               <div className="flex items-center gap-1.5 text-sm font-medium border border-slate-200 rounded-lg px-3 py-2 bg-white cursor-pointer hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <Share2 size={16} /> Share
               </div>

               <div className="h-8 w-px bg-slate-200 mx-2"></div>

               <div className="flex items-center gap-1">
                   <button className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors" title="History"><RotateCw size={18} /></button>
                   <button className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors" title="Chat"><MessageCircle size={18} /></button>
               </div>
               
               <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                    <button 
                        onClick={() => setViewMode(ViewMode.EDITOR)} 
                        className={`p-1.5 rounded transition-all ${viewMode === ViewMode.EDITOR ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-700'}`}
                        title="Editor Only"
                    >
                        <Code size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode(ViewMode.SPLIT)} 
                        className={`p-1.5 rounded transition-all ${viewMode === ViewMode.SPLIT ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-700'}`}
                        title="Split View"
                    >
                        <Columns size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode(ViewMode.PREVIEW)} 
                        className={`p-1.5 rounded transition-all ${viewMode === ViewMode.PREVIEW ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-700'}`}
                        title="Preview Only"
                    >
                        <Eye size={16} />
                    </button>
               </div>

               <button 
                onClick={downloadPDF} 
                className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                title="Download PDF"
               >
                   <Download size={20} />
               </button>
           </div>
        </header>

        <AIPanel onAction={handleAIAction} isProcessing={aiProcessing} />

        <main className="flex-1 flex overflow-hidden">
             <div className={`${viewMode === ViewMode.PREVIEW ? 'hidden' : (viewMode === ViewMode.SPLIT ? 'w-1/2' : 'w-full')} h-full border-r border-slate-200`}>
                {currentFileNode && currentFileNode.type === 'file' ? (
                    <Editor content={currentFileNode.content || ''} onChange={handleFileChange} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 gap-4">
                        <FileText size={48} className="opacity-20" />
                        <p className="font-medium">Select a file to edit</p>
                    </div>
                )}
             </div>

             <div className={`${viewMode === ViewMode.EDITOR ? 'hidden' : (viewMode === ViewMode.SPLIT ? 'w-1/2' : 'w-full')} h-full`}>
                 <Preview 
                    latexCode={compiledContent} 
                    logs={logs} 
                    isCompiling={isCompiling} 
                    assetMap={previewAssets}
                 />
             </div>
        </main>
      </div>
    </div>
  );
};

export default App;
