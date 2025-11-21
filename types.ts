export type NodeType = 'file' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  type: NodeType;
  content?: string; // Only for files
  children?: FileNode[]; // Only for folders
  isOpen?: boolean; // For folder expansion state
}

export interface Project {
  id: string;
  name: string;
  root: FileNode; // Root folder
  lastModified: number;
  owner: string;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  SPLIT = 'SPLIT',
  PREVIEW = 'PREVIEW'
}

export enum AIAction {
  FIX_ERRORS = 'FIX_ERRORS',
  EXPLAIN = 'EXPLAIN',
  GENERATE = 'GENERATE',
  OPTIMIZE = 'OPTIMIZE'
}

export interface LogEntry {
  id: string;
  type: 'info' | 'error' | 'warning';
  message: string;
  file?: string;
  line?: number;
  timestamp: number;
}