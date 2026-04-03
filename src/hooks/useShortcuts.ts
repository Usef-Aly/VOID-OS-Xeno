import { useEffect } from 'react';
import { XenoMode } from '../types';

interface ShortcutHandlers {
  setMode: (mode: XenoMode) => void;
  undo: () => void;
  redo: () => void;
  duplicate: () => void;
  remove: () => void;
  deselect: () => void;
  group: () => void;
  toggleTerminal: () => void;
  toggleGuides: () => void;
  toggleSnapping: () => void;
  setBrushMode: (mode: 'brush' | 'eraser' | 'inpaint') => void;
  generate: () => void;
  addText: () => void;
  addRect: () => void;
  addCircle: () => void;
  align: (type: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle') => void;
}

export const useShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const key = e.key.toLowerCase();

      // Mode Switching
      if (!ctrl && !alt) {
        if (key === 'v') handlers.setMode('EDITOR');
        if (key === 'q') handlers.setMode('QUICK');
        if (key === 'n') handlers.setMode('NEURAL');
        if (key === 'b') {
          handlers.setMode('DRAW');
          handlers.setBrushMode('brush');
        }
        if (key === 's') handlers.setMode('SOCIAL');
        if (key === 'e') {
          handlers.setMode('DRAW');
          handlers.setBrushMode('eraser');
        }
        if (key === 'i') {
          handlers.setMode('DRAW');
          handlers.setBrushMode('inpaint');
        }
        if (key === 't') handlers.addText();
        if (key === 'm') handlers.addRect();
        if (key === 'l') handlers.addCircle();
      }

      // Alignment Actions
      if (ctrl && alt) {
        if (key === 'arrowleft') {
          e.preventDefault();
          handlers.align('left');
        }
        if (key === 'arrowright') {
          e.preventDefault();
          handlers.align('right');
        }
        if (key === 'arrowup') {
          e.preventDefault();
          handlers.align('center');
        }
      }

      // Edit Actions
      if (ctrl) {
        if (key === 'z') {
          e.preventDefault();
          if (shift) handlers.redo();
          else handlers.undo();
        }
        if (key === 'j') {
          e.preventDefault();
          handlers.duplicate();
        }
        if (key === 'd') {
          e.preventDefault();
          handlers.deselect();
        }
        if (key === 'g') {
          e.preventDefault();
          handlers.group();
        }
        if (key === ';') {
          e.preventDefault();
          handlers.toggleGuides();
        }
        if (key === 's') {
          e.preventDefault();
          handlers.toggleSnapping();
        }
        if (key === 'enter') {
          e.preventDefault();
          handlers.generate();
        }
      }

      // Delete Actions
      if (key === 'delete' || key === 'backspace') {
        handlers.remove();
      }

      // View Actions
      if (key === '`') {
        e.preventDefault();
        handlers.toggleTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};
