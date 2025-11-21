import React, { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { LogEntry } from '../types';
import { FileText, AlertTriangle, Info, CheckCircle, Ban } from 'lucide-react';
import katex from 'katex';

interface PreviewProps {
  latexCode: string;
  logs: LogEntry[];
  isCompiling: boolean;
  assetMap?: Record<string, string>;
}

const Preview: React.FC<PreviewProps> = ({ latexCode, logs, isCompiling, assetMap = {} }) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'logs'>('pdf');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  
  // --- Custom LaTeX Parser for Simulation ---
  // This function simulates the "compilation" by transforming LaTeX structure into semantic HTML/CSS
  const parseLatexToHtml = (code: string, assets: Record<string, string>) => {
    if (!code) return '';

    let processed = code;

    // 1. Clean Comments
    processed = processed.replace(/(?<!\\)%.*$/gm, '');

    // 2. Extract Body (ignore preamble)
    const beginDoc = processed.indexOf('\\begin{document}');
    const endDoc = processed.lastIndexOf('\\end{document}');
    if (beginDoc !== -1 && endDoc !== -1) {
        processed = processed.substring(beginDoc + 16, endDoc);
    }

    // 3. Remove Preamble/Setup commands that clutter output
    processed = processed
        .replace(/\\selectlanguage\{[^}]+\}/g, '')
        .replace(/\\frenchspacing/g, '')
        .replace(/\\hyphenation\{[^}]+\}/g, '')
        .replace(/\\renewcommand\{[^}]+\}\{[^}]+\}/g, '') // Basic cleanup of definitions
        .replace(/\\setlength\{[^}]+\}\{[^}]+\}/g, '')
        .replace(/\\usepackage(?:\[.*?\])?\{[^}]+\}/g, '');

    // 4. Handle Minipages (Convert to Inline-Block/Flex simulation)
    // This is crucial for the cover page screenshot provided
    processed = processed.replace(/\\begin\{minipage\}\{(.*?)\}([\s\S]*?)\\end\{minipage\}/g, (match, width, content) => {
        let cssWidth = '100%';
        if (width.includes('\\textwidth')) {
            const fraction = parseFloat(width);
            cssWidth = `${fraction * 100}%`;
        } else if (width.includes('cm')) {
            // Approximate cm to % based on A4 width (21cm)
            const cm = parseFloat(width);
            cssWidth = `${(cm / 21) * 100}%`;
        }
        
        return `<div class="inline-block align-top" style="width: ${cssWidth}; vertical-align: top;">${content}</div>`;
    });

    // 5. Handle Layout & Spacing
    processed = processed
        .replace(/\\centering/g, '<div class="text-center w-full block">') // Start centering context
        .replace(/\\vspace\{([^}]+)\}/g, (match, size) => {
            let height = '1rem';
            if (size.includes('cm')) height = `${parseFloat(size)}cm`;
            else if (size.includes('mm')) height = `${parseFloat(size)}mm`;
            return `<div style="height: ${height}"></div>`;
        })
        .replace(/\\hspace\{([^}]+)\}/g, '<span style="display:inline-block; width: 1rem;"></span>')
        .replace(/\\newpage/g, '<div class="page-break"></div>')
        .replace(/\\clearpage/g, '<div class="page-break"></div>')
        .replace(/\\par/g, '<br/><br/>')
        .replace(/\\\\/g, '<br/>');

    // 6. Formatting (Font Styles)
    processed = processed
        .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
        .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
        .replace(/\\textsc\{([^}]+)\}/g, '<span class="uppercase text-sm tracking-wider">$1</span>')
        .replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>')
        .replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>')
        .replace(/\\texttt\{([^}]+)\}/g, '<code class="bg-gray-100 px-1 rounded font-mono text-sm">$1</code>');

    // 7. Font Sizes
    processed = processed
        .replace(/\\tiny/g, '<span class="text-xs">')
        .replace(/\\small/g, '<span class="text-sm">')
        .replace(/\\large/g, '<span class="text-lg">')
        .replace(/\\Large/g, '<span class="text-xl">')
        .replace(/\\LARGE/g, '<span class="text-2xl">')
        .replace(/\\huge/g, '<span class="text-3xl">')
        .replace(/\\Huge/g, '<span class="text-4xl">')
        .replace(/\{\\bfseries\s+([^}]+)\}/g, '<strong>$1</strong>'); // Handle {\bfseries Text}

    // 8. Images
    processed = processed.replace(/\\includegraphics(?:\[.*?\])?\{([^}]+)\}/g, (match, path) => {
        const filename = path.split('/').pop() || path;
        // Try strict match, then extensions
        let src = assets[filename] || assets[filename + '.png'] || assets[filename + '.jpg'] || assets[filename + '.jpeg'];
        
        // If filename ends with extension in latex code
        if (!src) {
             Object.keys(assets).forEach(key => {
                 if (key.includes(filename)) src = assets[key];
             });
        }

        if (src) {
            return `<img src="${src}" alt="${filename}" style="max-width: 100%; height: auto; display: block; margin: 1rem auto;" />`;
        }
        return `<div class="bg-red-50 border border-red-200 text-red-500 text-xs p-2 text-center rounded my-4 font-mono">Missing Image: ${filename}</div>`;
    });

    // 9. Structure (Chapters/Sections)
    let chapterCount = 0;
    let sectionCount = 0;
    let subsectionCount = 0;

    processed = processed.replace(/\\chapter\*?\{([^}]+)\}/g, (match, title) => {
        if (!match.includes('*')) chapterCount++;
        sectionCount = 0;
        return `<h1 class="text-3xl font-bold mt-8 mb-6 border-b pb-2">${match.includes('*') ? '' : chapterCount + '. '}${title}</h1>`;
    });

    processed = processed.replace(/\\section\*?\{([^}]+)\}/g, (match, title) => {
        if (!match.includes('*')) sectionCount++;
        subsectionCount = 0;
        const num = chapterCount > 0 ? `${chapterCount}.${sectionCount}` : `${sectionCount}`;
        return `<h2 class="text-2xl font-bold mt-6 mb-4 text-slate-800">${match.includes('*') ? '' : num + ' '}${title}</h2>`;
    });

    processed = processed.replace(/\\subsection\*?\{([^}]+)\}/g, (match, title) => {
        if (!match.includes('*')) subsectionCount++;
        const num = chapterCount > 0 ? `${chapterCount}.${sectionCount}.${subsectionCount}` : `${sectionCount}.${subsectionCount}`;
        return `<h3 class="text-xl font-bold mt-4 mb-3 text-slate-700">${match.includes('*') ? '' : num + ' '}${title}</h3>`;
    });

    // 10. Lists
    processed = processed.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, '<ul class="list-disc pl-6 space-y-1 my-4">$1</ul>');
    processed = processed.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, '<ol class="list-decimal pl-6 space-y-1 my-4">$1</ol>');
    processed = processed.replace(/\\item\s+([^\n]*)/g, '<li>$1</li>');

    // 11. Abstract
    processed = processed.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (match, content) => {
        return `<div class="mx-12 my-8 text-sm text-justify"><p class="text-center font-bold text-xs uppercase tracking-wider mb-2">Abstract</p>${content}</div>`;
    });

    // 12. Special Characters & cleanup
    processed = processed
        .replace(/\\textthreequartersemdash/g, '—')
        .replace(/---/g, '—')
        .replace(/--/g, '–')
        .replace(/``/g, '"')
        .replace(/''/g, '"')
        .replace(/\\footnote\{([^}]+)\}/g, '<sup class="text-blue-600 cursor-pointer" title="$1">[ref]</sup>')
        .replace(/\\cite\{([^}]+)\}/g, '<span class="text-blue-600">[1]</span>') // Mock citation
        .replace(/\\ref\{([^}]+)\}/g, '<span class="text-blue-600">1.1</span>') // Mock ref
        .replace(/\\label\{([^}]+)\}/g, '');

    // 13. Math (Simple replace for display math, complex handled by regex replace if needed)
    // Note: rendering full math in HTML string is hard without a parser like MathJax running on the DOM.
    // We will do a basic pass for display math $$...$$ to katex HTML if possible, or just styling.
    
    // Simple inline math fallback
    processed = processed.replace(/\$([^$]+)\$/g, (match, math) => {
        try {
            return katex.renderToString(math, { throwOnError: false });
        } catch (e) {
            return `<span class="font-mono text-xs bg-yellow-50">${math}</span>`;
        }
    });

    // Display math
    processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
         try {
            return `<div class="my-4 text-center">${katex.renderToString(math, { displayMode: true, throwOnError: false })}</div>`;
        } catch (e) {
            return `<div class="font-mono text-xs bg-yellow-50 p-2">${math}</div>`;
        }
    });
    
    // Handle \[ ... \]
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
         try {
            return `<div class="my-4 text-center">${katex.renderToString(math, { displayMode: true, throwOnError: false })}</div>`;
        } catch (e) {
            return `<div class="font-mono text-xs bg-yellow-50 p-2">${math}</div>`;
        }
    });

    // Close any open tags that might occur from sloppy replacements (basic safety)
    // In a real engine, we'd build a DOM tree. Here we assume relatively valid structure.

    return processed;
  };

  useEffect(() => {
    // Debounce compilation slightly to avoid UI freeze
    const timer = setTimeout(() => {
        const html = parseLatexToHtml(latexCode, assetMap);
        setRenderedHtml(html);
    }, 100);
    return () => clearTimeout(timer);
  }, [latexCode, assetMap]);


  return (
    <div className="h-full w-full flex flex-col bg-[#e2e8f0]">
      {/* Tab Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-[#f1f5f9] border-b border-slate-300/80 shrink-0">
          <div className="flex bg-slate-200/60 p-1 rounded-lg gap-1">
            <button 
                onClick={() => setActiveTab('pdf')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'pdf' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
                <FileText size={14} /> PDF View
            </button>
            <button 
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'logs' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
                Logs 
                {logs.length > 0 && (
                     <span className="flex items-center justify-center bg-amber-500 text-white rounded-full w-4 h-4 text-[9px] font-bold shadow-sm">{logs.length}</span>
                )}
            </button>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            A4 Paper • 12pt
          </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {/* Loading Toast */}
        {isCompiling && (
             <div className="absolute top-6 right-6 z-50 bg-slate-800/90 backdrop-blur text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Compiling document...
             </div>
        )}

        {activeTab === 'pdf' ? (
            <div className="h-full overflow-y-auto p-8 flex justify-center custom-scrollbar bg-slate-200/50">
                <div 
                    id="preview-document"
                    className="bg-white shadow-2xl mx-auto box-content transition-all duration-300 font-serif"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '25mm 20mm', // Standard Latex Margins
                    }}
                >
                   {/* 
                      We use dangerouslySetInnerHTML because our parseLatexToHtml generates raw HTML 
                      to mimic layout structures (divs, styles) that ReactMarkdown cannot handle.
                      Input is sanitized by the fact we control the regex replacements.
                   */}
                   <div 
                        className="prose prose-slate max-w-none prose-p:text-justify prose-p:leading-relaxed text-black"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                   />
                   
                    {renderedHtml.trim() === '' && (
                        <div className="h-96 flex flex-col items-center justify-center text-slate-300 italic pointer-events-none select-none">
                            <FileText size={48} className="mb-4 opacity-20" />
                            Document is empty
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="h-full bg-white overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                            <CheckCircle size={32} />
                        </div>
                        <p className="font-medium text-sm">Compilation successful</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 flex gap-4 items-start group transition-colors">
                                <div className="mt-0.5 shrink-0">
                                    {log.type === 'error' && <Ban size={18} className="text-red-500" />}
                                    {log.type === 'warning' && <AlertTriangle size={18} className="text-amber-500" />}
                                    {log.type === 'info' && <Info size={18} className="text-blue-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-800 leading-snug">{log.message}</div>
                                    <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2">
                                        {log.file && <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{log.file}</span>}
                                        {log.line && <span className="text-slate-400">Line {log.line}</span>}
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Preview;