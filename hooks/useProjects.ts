
import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, SyncStatus } from '../types';
import { fetchProjectsFromBin, saveProjectsToBin } from '../services/jsonBinService';

// Mock initial data as fallback
const SAMPLE_LATEX = `\\documentclass[12pt, a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{amsmath}

\\title{Thesis Template}
\\author{Student Name}
\\date{\\today}

\\begin{document}

\\begin{center}
    \\textsc{\\LARGE University Name} \\\\
    \\vspace{0.5cm}
    \\textsc{\\Large Department of Science}
\\end{center}

\\vspace{2cm}

\\begin{center}
    \\textbf{\\Huge Thesis Title Goes Here}
\\end{center}

\\vspace{2cm}

\\begin{center}
    \\textbf{\\Large Author Name}
\\end{center}

\\vfill

\\begin{center}
    City, Country \\\\
    2025
\\end{center}

\\newpage

\\tableofcontents

\\newpage

\\begin{abstract}
This is a simple abstract for the thesis template simulating a real project structure. The layout should look like a real PDF document.
\\end{abstract}

\\chapter{Introduction}
This project demonstrates the new **Tree View** file structure in GeminiLeaf.
You can organize your files into folders like 'Chapters' and 'Figures'.

\\section{Background}
\\input{Chapters/intro}

\\section{Math Example}
Here is some math to test the preview:
$$ \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2} $$

\\end{document}
`;

const INITIAL_PROJECT: Project = {
  id: 'proj_1',
  name: 'My First LaTeX Project',
  owner: 'user@example.com',
  lastModified: Date.now(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  root: {
    id: 'root_1',
    name: 'root',
    type: 'folder',
    isOpen: true,
    children: [
      { id: 'main.tex', name: 'main.tex', type: 'file', content: SAMPLE_LATEX },
      { id: 'bib.bib', name: 'references.bib', type: 'file', content: '@article{key, ...}' },
      { 
        id: 'chapters', 
        name: 'Chapters', 
        type: 'folder', 
        isOpen: true, 
        children: [
            { id: 'intro.tex', name: 'intro.tex', type: 'file', content: 'This text comes from an external file imported via \\texttt{\\textbackslash input}. It should flow seamlessly into the document.' },
        ] 
      },
      {
        id: 'figures',
        name: 'Figures',
        type: 'folder',
        isOpen: false,
        children: []
      }
    ]
  }
};

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  
  // Ref to hold latest projects for debounced save
  const projectsRef = useRef<Project[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Load
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjectsFromBin();
        if (data.length === 0) {
          setProjects([INITIAL_PROJECT]);
          projectsRef.current = [INITIAL_PROJECT];
        } else {
          setProjects(data);
          projectsRef.current = data;
        }
        setStatus('saved');
      } catch (err) {
        console.warn("Using local fallback due to API error:", err);
        
        // Fallback to localStorage
        const local = localStorage.getItem('latex_projects');
        let loadedFromLocal = false;
        if (local) {
           try {
             const parsed = JSON.parse(local);
             if (Array.isArray(parsed) && parsed.length > 0) {
                 setProjects(parsed);
                 projectsRef.current = parsed;
                 loadedFromLocal = true;
             }
           } catch (e) {
             console.error("Failed to parse local storage", e);
           }
        }

        if (!loadedFromLocal) {
             setProjects([INITIAL_PROJECT]);
             projectsRef.current = [INITIAL_PROJECT];
        }
        
        // We set status to 'saved' (locally) to avoid initial red error state
        setStatus('saved');
        setError("Offline Mode");
      }
    };

    loadProjects();
  }, []);

  const triggerSave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setStatus('saving');
    timeoutRef.current = setTimeout(async () => {
      // Always save to localStorage as backup
      localStorage.setItem('latex_projects', JSON.stringify(projectsRef.current));

      try {
        await saveProjectsToBin(projectsRef.current);
        setStatus('saved');
      } catch (err) {
        console.error("Save failed", err);
        // If cloud save fails, we still have local storage, but we show error 
        // to indicate cloud sync failed
        setStatus('error');
      }
    }, 2000); // 2 second debounce
  }, []);

  const updateProjects = useCallback((newProjects: Project[], immediateSave = false) => {
    setProjects(newProjects);
    projectsRef.current = newProjects;

    if (immediateSave) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setStatus('saving');
        // Immediate save
        localStorage.setItem('latex_projects', JSON.stringify(newProjects));
        saveProjectsToBin(newProjects)
          .then(() => setStatus('saved'))
          .catch(() => setStatus('error'));
    } else {
        triggerSave();
    }
  }, [triggerSave]);

  const addProject = (project: Project) => {
    const updated = [project, ...projects];
    updateProjects(updated, true);
  };

  const updateProject = (updatedProject: Project) => {
    const updated = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    updateProjects(updated, false);
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    updateProjects(updated, true);
  };

  return {
    projects,
    status,
    error,
    addProject,
    updateProject,
    deleteProject,
    isLoading: status === 'loading'
  };
};
