import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';

interface TerminalViewProps {
  id: string;
  cwd?: string;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ id, cwd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Consolas, "Fira Code", monospace',
      convertEol: true,
      theme: {
        background: '#141414',
        foreground: '#e0e0e0',
        cursor: '#007acc',
        selectionBackground: 'rgba(255, 255, 255, 0.2)'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Addon to detect links and open in external browser with Ctrl+Click
    const webLinksAddon = new WebLinksAddon((event, uri) => {
      // Require Ctrl or Cmd key to open external link
      if (event.ctrlKey || event.metaKey) {
        if (window.api?.openExternal) {
          window.api.openExternal(uri);
        } else {
          window.open(uri, '_blank');
        }
      }
    });
    term.loadAddon(webLinksAddon);

    term.open(containerRef.current);
    terminalRef.current = term;

    // Handle Copy / Paste and custom keys
    term.attachCustomKeyEventHandler((event) => {
      if (event.type === 'keydown') {
        // Ctrl+C: if text is selected, copy to clipboard instead of sending interrupt
        if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'C')) {
          const selection = term.getSelection();
          if (selection && selection.length > 0) {
            navigator.clipboard.writeText(selection);
            return false;
          }
        }

        // Ctrl+V: paste from clipboard
        if ((event.ctrlKey || event.metaKey) && (event.key === 'v' || event.key === 'V')) {
          navigator.clipboard.readText().then((text) => {
            if (text) {
              window.api?.writeTerminal(id, text);
            }
          }).catch(() => {});
          return false;
        }

        if (event.key === 'Backspace') {
          window.api?.writeTerminal(id, '\x08');
          return false;
        }
        if (event.key === 'Delete') {
          window.api?.writeTerminal(id, '\x1b[3~');
          return false;
        }
      }
      return true;
    });

    // Handle focus on click
    const handleContainerClick = () => {
      term.focus();
    };
    const currentContainer = containerRef.current;
    currentContainer.addEventListener('click', handleContainerClick);
    setTimeout(() => {
      try {
        fitAddon.fit();
        term.focus();
        if (term.cols > 0 && term.rows > 0) {
          window.api?.resizeTerminal?.(id, term.cols, term.rows);
        }
      } catch (e) {}
    }, 60);

    if (window.api) {
      window.api.spawnTerminal(id, cwd, term.cols || 80, term.rows || 24);

      const cleanupData = window.api.onTerminalData(id, (data) => {
        term.write(data);
      });

      const cleanupExit = window.api.onTerminalExit(id, (code) => {
        term.write(`\r\n[Processus terminé avec code ${code}]\r\n`);
      });

      term.onData((data) => {
        window.api?.writeTerminal(id, data);
      });

      const handleResize = () => {
        try {
          fitAddon.fit();
          if (term.cols > 0 && term.rows > 0) {
            window.api?.resizeTerminal?.(id, term.cols, term.rows);
          }
        } catch (e) {}
      };

      window.addEventListener('resize', handleResize);

      // ResizeObserver to detect panel resizing
      let resizeObserver: ResizeObserver | null = null;
      if (containerRef.current && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          handleResize();
        });
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        currentContainer.removeEventListener('click', handleContainerClick);
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) resizeObserver.disconnect();
        cleanupData();
        cleanupExit();
        // Do NOT kill the pty process when unmounting view (e.g. closing and reopening the bottom panel)
        term.dispose();
      };
    } else {
      term.writeln('Environnement Electron non détecté (Mode Démo)');
    }
  }, [id, cwd]);

  return <div ref={containerRef} className="w-full h-full bg-[#141414] overflow-hidden" />;
};
