
import React, { useRef, useState } from 'react';
import { Project } from '../types';
import { FileText, Upload, Plus, Search, Trash2, MoreHorizontal, FolderUp, Clock, User, Loader2 } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  isLoading: boolean;
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
  onImportProject: (files: FileList) => void;
  onDeleteProject: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  projects,
  isLoading,
  onOpenProject,
  onCreateProject,
  onImportProject,
  onDeleteProject
}) => {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportProject(e.target.files);
      setShowUploadModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-700">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
             <span className="font-bold text-lg tracking-tighter px-1">Tx</span>
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">TexPage</span>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Beta</span>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-blue-600 transition-colors">Templates</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Docs</a>
          <div className="flex items-center gap-2 pl-6 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                AB
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 py-8 px-4 hidden md:flex flex-col gap-8">
          <div className="relative">
            <button 
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus size={20} /> New Project
            </button>
            
            {showNewMenu && (
              <div className="absolute top-14 left-0 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <button onClick={onCreateProject} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                    <FileText size={16} /> Blank Project
                </button>
                <button onClick={() => setShowUploadModal(true)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                    <Upload size={16} /> Upload Project
                </button>
              </div>
            )}
          </div>

          <nav className="space-y-1">
            <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Library</h3>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
                <FileText size={18} /> All Projects
                <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{isLoading ? '-' : projects.length}</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
                <User size={18} /> Shared with me
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors">
                <Trash2 size={18} /> Trash
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 py-8 px-8">
          <div className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Recent Projects</h2>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search projects..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                <p className="font-medium">Loading your projects...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
                {projects.map((project) => (
                <div key={project.id} className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-5 relative overflow-hidden">
                    <div 
                    className="flex-1 cursor-pointer flex items-center gap-5" 
                    onClick={() => onOpenProject(project.id)}
                    >
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                        <FileText size={24} />
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-slate-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                        <div className="text-xs text-slate-500 flex items-center gap-4">
                            <span className="flex items-center gap-1"><User size={12} /> {project.owner}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(project.updatedAt || project.lastModified).toLocaleDateString()}</span>
                        </div>
                    </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-x-4 group-hover:translate-x-0">
                    <button 
                        onClick={() => onDeleteProject(project.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Project"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreHorizontal size={18} />
                    </button>
                    </div>
                </div>
                ))}
                
                {projects.length === 0 && (
                <div className="p-16 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <FolderUp size={32} />
                    </div>
                    <h3 className="text-slate-900 font-medium mb-1">No projects found</h3>
                    <p className="text-slate-500 text-sm mb-6">Get started by creating a new project or importing one.</p>
                    <button onClick={onCreateProject} className="text-blue-600 font-medium text-sm hover:underline">Create blank project</button>
                </div>
                )}
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-8 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowUploadModal(false)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              &times;
            </button>
            
            <h3 className="text-xl font-bold mb-2 text-slate-800">Upload Project</h3>
            <p className="text-slate-500 text-sm mb-8">Import your existing LaTeX projects or Zip archives.</p>
            
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition-all group">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload size={28} className="text-slate-400 group-hover:text-blue-500" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                Drag & drop files here
              </p>
              <p className="text-xs text-slate-400 mb-6">
                or select from your computer
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                >
                    Select Files
                </button>
                <button 
                    onClick={() => folderInputRef.current?.click()}
                    className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                    <FolderUp size={16} /> Select Folder
                </button>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept=".tex,.bib,.sty,.cls,.txt,.md,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
              <input 
                type="file" 
                ref={folderInputRef} 
                className="hidden" 
                {...{ webkitdirectory: "", directory: "" } as any}
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
