import React, { useState } from 'react';
import { Sparkles, MessageSquareCode, RefreshCw, X, Check } from 'lucide-react';
import { AIAction } from '../types';

interface AIPanelProps {
  onAction: (action: AIAction, prompt?: string) => Promise<void>;
  isProcessing: boolean;
}

const AIPanel: React.FC<AIPanelProps> = ({ onAction, isProcessing }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);

  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;
    await onAction(AIAction.GENERATE, customPrompt);
    setCustomPrompt('');
    setShowPromptInput(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-2 shadow-sm z-10">
      <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mr-4">
        <Sparkles size={16} />
        <span>Gemini Assistant</span>
      </div>

      <button
        onClick={() => onAction(AIAction.FIX_ERRORS)}
        disabled={isProcessing}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors disabled:opacity-50"
      >
        <Check size={14} /> Fix Errors
      </button>

      <button
        onClick={() => onAction(AIAction.OPTIMIZE)}
        disabled={isProcessing}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} /> Optimize
      </button>

      <div className="relative">
        <button
          onClick={() => setShowPromptInput(!showPromptInput)}
          disabled={isProcessing}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border transition-colors disabled:opacity-50 ${
            showPromptInput 
              ? 'bg-indigo-100 text-indigo-700 border-indigo-300' 
              : 'text-white bg-indigo-600 hover:bg-indigo-700 border-transparent'
          }`}
        >
          <MessageSquareCode size={14} /> Generate Code
        </button>

        {showPromptInput && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-600">Describe what to generate</span>
              <button onClick={() => setShowPromptInput(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., A table with 3 columns describing quantum mechanics..."
              className="w-full text-sm p-2 border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-24 mb-2"
            />
            <button
              onClick={handleGenerate}
              disabled={isProcessing || !customPrompt.trim()}
              className="w-full bg-indigo-600 text-white text-xs font-medium py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Generating...' : 'Generate'}
            </button>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="ml-auto flex items-center gap-2 text-xs text-indigo-600">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          Processing...
        </div>
      )}
    </div>
  );
};

export default AIPanel;
