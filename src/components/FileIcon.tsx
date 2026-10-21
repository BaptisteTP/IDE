import React from 'react';
import {
  FileCode,
  FileText,
  FileJson,
  FileSpreadsheet,
  Image,
  Film,
  Music,
  Archive,
  Database,
  Terminal,
  Settings,
  Lock,
  File,
  Code
} from 'lucide-react';
import {
  SiTypescript,
  SiJavascript,
  SiReact,
  SiPython,
  SiRust,
  SiHtml5,
  SiCss,
  SiTailwindcss,
  SiJson,
  SiMarkdown,
  SiGit,
  SiDocker,
  SiYaml,
  SiVite,
  SiNodedotjs,
  SiCplusplus,
  SiC,
  SiGo,
  SiPhp,
  SiRuby,
  SiDotnet
} from 'react-icons/si';

interface FileIconProps {
  fileName: string;
  className?: string;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({ fileName, className = '', size = 15 }) => {
  const lower = fileName.toLowerCase();

  // Exact file names
  if (lower === 'package.json') return <SiNodedotjs size={size} className={`text-emerald-500 ${className}`} />;
  if (lower === 'vite.config.ts' || lower === 'vite.config.js') return <SiVite size={size} className={`text-amber-400 ${className}`} />;
  if (lower === 'tsconfig.json' || lower.startsWith('tsconfig.')) return <SiTypescript size={size} className={`text-blue-500 ${className}`} />;
  if (lower === 'dockerfile' || lower.startsWith('docker-compose')) return <SiDocker size={size} className={`text-sky-400 ${className}`} />;
  if (lower.startsWith('.git') || lower === '.gitignore') return <SiGit size={size} className={`text-orange-500 ${className}`} />;
  if (lower.startsWith('.env')) return <Lock size={size} className={`text-amber-300 ${className}`} />;

  // Extensions
  const ext = lower.split('.').pop() || '';

  switch (ext) {
    case 'ts':
      return <SiTypescript size={size} className={`text-blue-400 ${className}`} />;
    case 'tsx':
      return <SiReact size={size} className={`text-cyan-400 ${className}`} />;
    case 'js':
    case 'mjs':
    case 'cjs':
      return <SiJavascript size={size} className={`text-yellow-400 ${className}`} />;
    case 'jsx':
      return <SiReact size={size} className={`text-cyan-300 ${className}`} />;
    case 'py':
      return <SiPython size={size} className={`text-blue-400 ${className}`} />;
    case 'rs':
      return <SiRust size={size} className={`text-amber-600 ${className}`} />;
    case 'go':
      return <SiGo size={size} className={`text-cyan-500 ${className}`} />;
    case 'c':
    case 'h':
      return <SiC size={size} className={`text-blue-500 ${className}`} />;
    case 'cpp':
    case 'hpp':
    case 'cc':
      return <SiCplusplus size={size} className={`text-blue-600 ${className}`} />;
    case 'html':
    case 'htm':
      return <SiHtml5 size={size} className={`text-orange-500 ${className}`} />;
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return <SiCss size={size} className={`text-sky-400 ${className}`} />;
    case 'json':
      return <SiJson size={size} className={`text-amber-400 ${className}`} />;
    case 'md':
    case 'markdown':
      return <SiMarkdown size={size} className={`text-sky-300 ${className}`} />;
    case 'yml':
    case 'yaml':
      return <SiYaml size={size} className={`text-rose-400 ${className}`} />;
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'bat':
    case 'cmd':
    case 'ps1':
      return <Terminal size={size} className={`text-emerald-400 ${className}`} />;
    case 'sql':
      return <Database size={size} className={`text-pink-400 ${className}`} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      return <Image size={size} className={`text-purple-400 ${className}`} />;
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return <Film size={size} className={`text-red-400 ${className}`} />;
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <Music size={size} className={`text-indigo-400 ${className}`} />;
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
    case 'rar':
      return <Archive size={size} className={`text-amber-500 ${className}`} />;
    case 'xml':
      return <Code size={size} className={`text-amber-300 ${className}`} />;
    case 'txt':
    case 'log':
      return <FileText size={size} className={`text-neutral-400 ${className}`} />;
    case 'pdf':
      return <FileText size={size} className={`text-rose-500 ${className}`} />;
    case 'php':
      return <SiPhp size={size} className={`text-indigo-400 ${className}`} />;
    case 'rb':
      return <SiRuby size={size} className={`text-rose-600 ${className}`} />;
    case 'cs':
      return <SiDotnet size={size} className={`text-purple-500 ${className}`} />;
    default:
      return <File size={size} className={`text-neutral-400 ${className}`} />;
  }
};
