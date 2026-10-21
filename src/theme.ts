import { IDETheme } from './types';

export interface ThemeConfig {
  id: IDETheme;
  name: string;
  description: string;
  monacoTheme: string;
  isDark: boolean;
  styles: {
    bgApp: string;
    bgHeader: string;
    bgSidebar: string;
    bgPanel: string;
    bgCard: string;
    bgInput: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentBg: string;
    badgeMethod: {
      get: string;
      post: string;
      put: string;
      delete: string;
      patch: string;
    };
  };
}

export const THEMES: Record<IDETheme, ThemeConfig> = {
  'dark-modern': {
    id: 'dark-modern',
    name: 'Dark Modern',
    description: 'Thème sombre contemporain avec touches bleutées',
    monacoTheme: 'vs-dark',
    isDark: true,
    styles: {
      bgApp: 'bg-[#0f0f11]',
      bgHeader: 'bg-[#161618]',
      bgSidebar: 'bg-[#161618]',
      bgPanel: 'bg-[#141416]',
      bgCard: 'bg-[#1b1b1e]',
      bgInput: 'bg-[#202024]',
      border: 'border-neutral-800/80',
      textPrimary: 'text-neutral-100',
      textSecondary: 'text-neutral-300',
      textMuted: 'text-neutral-500',
      accent: 'text-blue-400',
      accentHover: 'hover:bg-blue-600/30',
      accentBg: 'bg-blue-600',
      badgeMethod: {
        get: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        post: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        put: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        delete: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        patch: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      }
    }
  },
  'midnight': {
    id: 'midnight',
    name: 'Midnight Deep Blue',
    description: 'Nuit profonde avec nuances cobalt et néon cyan',
    monacoTheme: 'vs-dark',
    isDark: true,
    styles: {
      bgApp: 'bg-[#090d16]',
      bgHeader: 'bg-[#0d1527]',
      bgSidebar: 'bg-[#0b1220]',
      bgPanel: 'bg-[#0b1222]',
      bgCard: 'bg-[#111c33]',
      bgInput: 'bg-[#152340]',
      border: 'border-blue-950/80',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-500',
      accent: 'text-cyan-400',
      accentHover: 'hover:bg-cyan-600/30',
      accentBg: 'bg-cyan-600',
      badgeMethod: {
        get: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        post: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        put: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        delete: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        patch: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      }
    }
  },
  'cyberpunk': {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Ambiance néon jaune & rose futuriste intense',
    monacoTheme: 'vs-dark',
    isDark: true,
    styles: {
      bgApp: 'bg-[#0f051d]',
      bgHeader: 'bg-[#180b2e]',
      bgSidebar: 'bg-[#180b2e]',
      bgPanel: 'bg-[#150928]',
      bgCard: 'bg-[#220f40]',
      bgInput: 'bg-[#2a1350]',
      border: 'border-pink-900/60',
      textPrimary: 'text-yellow-200',
      textSecondary: 'text-pink-200',
      textMuted: 'text-pink-400/60',
      accent: 'text-pink-400',
      accentHover: 'hover:bg-pink-600/30',
      accentBg: 'bg-gradient-to-r from-pink-600 to-yellow-500',
      badgeMethod: {
        get: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        post: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
        put: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        delete: 'bg-red-500/20 text-red-400 border-red-500/30',
        patch: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      }
    }
  },
  'monokai': {
    id: 'monokai',
    name: 'Monokai Pro',
    description: 'Classique sombre chaleureux aux tons vert lime & orange',
    monacoTheme: 'vs-dark',
    isDark: true,
    styles: {
      bgApp: 'bg-[#191919]',
      bgHeader: 'bg-[#222222]',
      bgSidebar: 'bg-[#202020]',
      bgPanel: 'bg-[#1e1e1e]',
      bgCard: 'bg-[#272822]',
      bgInput: 'bg-[#2d2e27]',
      border: 'border-neutral-700/60',
      textPrimary: 'text-amber-100',
      textSecondary: 'text-neutral-300',
      textMuted: 'text-neutral-500',
      accent: 'text-lime-400',
      accentHover: 'hover:bg-lime-600/30',
      accentBg: 'bg-lime-600',
      badgeMethod: {
        get: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
        post: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        put: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        delete: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        patch: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
      }
    }
  },
  'dracula': {
    id: 'dracula',
    name: 'Dracula Dark',
    description: 'Thème emblématique violet gothique & menthe',
    monacoTheme: 'vs-dark',
    isDark: true,
    styles: {
      bgApp: 'bg-[#1e1f29]',
      bgHeader: 'bg-[#282a36]',
      bgSidebar: 'bg-[#252733]',
      bgPanel: 'bg-[#21222c]',
      bgCard: 'bg-[#282a36]',
      bgInput: 'bg-[#343746]',
      border: 'border-purple-900/40',
      textPrimary: 'text-[#f8f8f2]',
      textSecondary: 'text-[#e2e2dc]',
      textMuted: 'text-[#6272a4]',
      accent: 'text-[#bd93f9]',
      accentHover: 'hover:bg-[#bd93f9]/20',
      accentBg: 'bg-[#bd93f9]',
      badgeMethod: {
        get: 'bg-[#50fa7b]/20 text-[#50fa7b] border-[#50fa7b]/30',
        post: 'bg-[#bd93f9]/20 text-[#bd93f9] border-[#bd93f9]/30',
        put: 'bg-[#ffb86c]/20 text-[#ffb86c] border-[#ffb86c]/30',
        delete: 'bg-[#ff5555]/20 text-[#ff5555] border-[#ff5555]/30',
        patch: 'bg-[#ff79c6]/20 text-[#ff79c6] border-[#ff79c6]/30',
      }
    }
  },
  'nord': {
    id: 'nord',
    name: 'Nordic Frost',
    description: 'Palette arctique apaisante aux tons bleu glacial et ardoise',
    monacoTheme: 'vs-dark',
    isDark: true,
    styles: {
      bgApp: 'bg-[#242933]',
      bgHeader: 'bg-[#2e3440]',
      bgSidebar: 'bg-[#2b303c]',
      bgPanel: 'bg-[#272c37]',
      bgCard: 'bg-[#3b4252]',
      bgInput: 'bg-[#434c5e]',
      border: 'border-slate-700/60',
      textPrimary: 'text-[#eceff4]',
      textSecondary: 'text-[#d8dee9]',
      textMuted: 'text-[#7e889b]',
      accent: 'text-[#88c0d0]',
      accentHover: 'hover:bg-[#88c0d0]/20',
      accentBg: 'bg-[#88c0d0]',
      badgeMethod: {
        get: 'bg-[#a3be8c]/20 text-[#a3be8c] border-[#a3be8c]/30',
        post: 'bg-[#81a1c1]/20 text-[#81a1c1] border-[#81a1c1]/30',
        put: 'bg-[#ebcb8b]/20 text-[#ebcb8b] border-[#ebcb8b]/30',
        delete: 'bg-[#bf616a]/20 text-[#bf616a] border-[#bf616a]/30',
        patch: 'bg-[#b48ead]/20 text-[#b48ead] border-[#b48ead]/30',
      }
    }
  },
  'light': {
    id: 'light',
    name: 'Clean Light',
    description: 'Thème clair haute lisibilité et contraste doux',
    monacoTheme: 'light',
    isDark: false,
    styles: {
      bgApp: 'bg-[#f4f5f7]',
      bgHeader: 'bg-[#ffffff]',
      bgSidebar: 'bg-[#fafbfc]',
      bgPanel: 'bg-[#ffffff]',
      bgCard: 'bg-[#f0f2f5]',
      bgInput: 'bg-[#e5e8ec]',
      border: 'border-neutral-300',
      textPrimary: 'text-neutral-900',
      textSecondary: 'text-neutral-700',
      textMuted: 'text-neutral-500',
      accent: 'text-blue-600',
      accentHover: 'hover:bg-blue-100',
      accentBg: 'bg-blue-600',
      badgeMethod: {
        get: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        post: 'bg-blue-100 text-blue-800 border-blue-300',
        put: 'bg-amber-100 text-amber-800 border-amber-300',
        delete: 'bg-rose-100 text-rose-800 border-rose-300',
        patch: 'bg-purple-100 text-purple-800 border-purple-300',
      }
    }
  }
};
