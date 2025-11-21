import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { LogEntry } from '../types';
import { FileText, AlertTriangle, Info, CheckCircle, Ban, List, File } from 'lucide-react';

interface PreviewProps {
  latexCode: string;
  logs: LogEntry[];
  isCompiling: boolean;
  assetMap?: Record<string, string>;
}

const Preview: React.FC<PreviewProps> = ({ latexCode, logs, isCompiling, assetMap = {} }) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'logs'>('pdf');
  
  const { markdownContent, metadata } = useMemo(() => {
    let content = latexCode;
    const metadata = { title: '', author: '', date: '', hasMaketitle: false };

    const titleMatch = content.match(/\\title\{([^}]+)\}/);
    if (titleMatch) metadata.title = titleMatch[1];

    const authorMatch = content.match(/\\author\{([^}]+)\}/);
    if (authorMatch) metadata.author = authorMatch[1];

    const dateMatch = content.match(/\\date\{([^}]+)\}/);
    if (dateMatch) {
        metadata.date = dateMatch[1] === '\\today' ? new Date().toLocaleDateString() : dateMatch[1];
    }

    if (content.includes('\\maketitle')) {
        metadata.hasMaketitle = true;
    }

    const beginDocIndex = content.indexOf('\\begin{document}');
    const endDocIndex = content.lastIndexOf('\\end{document}');
    
    if (beginDocIndex !== -1 && endDocIndex !== -1) {
        content = content.substring(beginDocIndex + 16, endDocIndex);
    }

    content = content.replace(/\\maketitle/g, '');

    // --- Advanced Regex Parser ---
    let processed = content;

    // 1. Image handling
    processed = processed.replace(/\\includegraphics(?:\[.*?\])?\{([^}]+)\}/g, (match, path) => {
        const filename = path.split('/').pop() || path;
        let src = assetMap[filename] || assetMap[filename + '.png'] || assetMap[filename + '.jpg'];
        
        if (src) {
            return `\n\n<div class="flex justify-center my-6"><img src="${src}" alt="${filename}" class="max-h-[400px] object-contain" /></div>\n\n`;
        }
        return `\n\n<div class="bg-red-50 border border-red-200 text-red-500 text-xs p-2 text-center rounded my-4 font-mono">Missing Image: ${filename}</div>\n\n`;
    });

    // 2. Formatting
    processed = processed
        .replace(/\\section\*?\{([^}]+)\}/g, '# $1')
        .replace(/\\subsection\*?\{([^}]+)\}/g, '## $1')
        .replace(/\\subsubsection\*?\{([^}]+)\}/g, '### $1')
        .replace(/\\textbf\{([^}]+)\}/g, '**$1**')
        .replace(/\\textit\{([^}]+)\}/g, '*$1*')
        .replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>')
        .replace(/\\emph\{([^}]+)\}/g, '*$1*')
        .replace(/\\texttt\{([^}]+)\}/g, '`$1`')
        .replace(/\\item\s/g, '* ')
        .replace(/\\begin\{itemize\}/g, '')
        .replace(/\\end\{itemize\}/g, '')
        .replace(/\\begin\{enumerate\}/g, '')
        .replace(/\\end\{enumerate\}/g, '');

    // 3. Abstract
    processed = processed.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (match, abstractContent) => {
        return `<div class="mx-16 my-8 text-sm text-justify leading-relaxed text-slate-700"><p class="text-center font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider">Abstract</p>${abstractContent}</div>`;
    });

    // 4. Cleanup
    processed = processed
        .replace(/\\\\/g, '  \n') 
        .replace(/\\newpage/g, '<div class="page-break"></div>')
        .replace(/\\clearpage/g, '<div class="page-break"></div>')
        .replace(/\$\$/g, '\n$$\n')
        .replace(/\\\[/g, '\n$$\n')
        .replace(/\\\]/g, '\n$$\n')
        .replace(/%.*$/gm, ''); 

    return { markdownContent: processed, metadata };
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
                <File size={14} /> PDF View
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
                    className="bg-white shadow-2xl mx-auto box-content relative transition-all duration-300"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        padding: '25mm',
                    }}
                >
                    {metadata.hasMaketitle && (
                        <div className="text-center mb-12 pb-6 border-b border-slate-100">
                            {metadata.title && <h1 className="text-3xl font-serif font-bold mb-6 text-slate-900 leading-tight">{metadata.title}</h1>}
                            <div className="text-lg font-serif text-slate-700">
                                {metadata.author && <div className="mb-2 font-medium">{metadata.author}</div>}
                                {metadata.date && <div className="text-slate-500 text-base italic">{metadata.date}</div>}
                            </div>
                        </div>
                    )}

                    <article className="prose prose-slate max-w-none prose-headings:font-serif prose-p:font-serif prose-li:font-serif text-justify leading-relaxed text-slate-800 prose-sm prose-headings:text-slate-900">
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                div: ({node, ...props}) => <div {...props} />,
                                img: ({node, ...props}) => <img {...props} className="mx-auto rounded-sm shadow-sm" />
                            }}
                        >
                            {markdownContent}
                        </ReactMarkdown>
                    </article>

                    {markdownContent.trim() === '' && !metadata.hasMaketitle && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 italic pointer-events-none select-none">
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