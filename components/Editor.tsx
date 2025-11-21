import React from 'react';

interface EditorProps {
  content: string;
  onChange: (newContent: string) => void;
}

const Editor: React.FC<EditorProps> = ({ content, onChange }) => {
  return (
    <div className="h-full w-full flex flex-col bg-white relative group">
        <div className="flex-1 relative">
            <textarea
                value={content}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full p-6 font-mono text-[13.5px] bg-white text-slate-800 resize-none focus:outline-none leading-relaxed selection:bg-blue-100 selection:text-blue-900"
                spellCheck={false}
                placeholder="\documentclass{article}..."
                style={{ tabSize: 2 }}
            />
        </div>
        <div className="absolute bottom-4 right-6 text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity font-mono bg-white/80 px-2 py-1 rounded pointer-events-none">
            LaTeX Mode
        </div>
    </div>
  );
};

export default Editor;