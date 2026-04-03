export interface ShortcutInfo {
  id: string;
  name: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description?: string;
  category: 'Tools' | 'Edit' | 'View' | 'Neural';
}

export const XENO_SHORTCUTS: ShortcutInfo[] = [
  // Tools
  { id: 'mode-quick', name: 'Quick Mode', key: 'Q', category: 'Tools' },
  { id: 'mode-editor', name: 'Editor Mode', key: 'V', category: 'Tools' },
  { id: 'mode-neural', name: 'Neural Mode', key: 'N', category: 'Tools' },
  { id: 'mode-draw', name: 'Draw Mode', key: 'B', category: 'Tools' },
  { id: 'mode-social', name: 'Social Mode', key: 'S', category: 'Tools' },
  
  // Draw Tools
  { id: 'brush-mode-brush', name: 'Brush Tool', key: 'B', category: 'Tools' },
  { id: 'brush-mode-eraser', name: 'Eraser Tool', key: 'E', category: 'Tools' },
  { id: 'brush-mode-inpaint', name: 'Inpaint Tool', key: 'I', category: 'Tools' },

  // Edit Actions
  { id: 'undo', name: 'Undo', key: 'Z', ctrl: true, category: 'Edit' },
  { id: 'redo', name: 'Redo', key: 'Z', ctrl: true, shift: true, category: 'Edit' },
  { id: 'duplicate', name: 'Duplicate Layer', key: 'J', ctrl: true, category: 'Edit' },
  { id: 'delete', name: 'Delete Layer', key: 'Delete', category: 'Edit' },
  { id: 'delete-alt', name: 'Delete Layer', key: 'Backspace', category: 'Edit' },
  { id: 'deselect', name: 'Deselect', key: 'D', ctrl: true, category: 'Edit' },
  { id: 'group', name: 'Group Layers', key: 'G', ctrl: true, category: 'Edit' },
  
  // View Actions
  { id: 'toggle-terminal', name: 'Toggle Terminal', key: '`', category: 'View' },
  { id: 'toggle-guides', name: 'Toggle Guides', key: ';', ctrl: true, category: 'View' },
  { id: 'toggle-snapping', name: 'Toggle Snapping', key: 'S', ctrl: true, category: 'View' },

  // Neural Actions
  { id: 'neural-generate', name: 'Generate Asset', key: 'Enter', ctrl: true, category: 'Neural' },

  // Layer Actions
  { id: 'add-text', name: 'Add Text', key: 'T', category: 'Tools' },
  { id: 'add-rect', name: 'Add Rectangle', key: 'M', category: 'Tools' },
  { id: 'add-circle', name: 'Add Circle', key: 'L', category: 'Tools' },

  // Alignment (Custom)
  { id: 'align-left', name: 'Align Left', key: 'ArrowLeft', ctrl: true, alt: true, category: 'Edit' },
  { id: 'align-right', name: 'Align Right', key: 'ArrowRight', ctrl: true, alt: true, category: 'Edit' },
  { id: 'align-center', name: 'Align Center', key: 'ArrowUp', ctrl: true, alt: true, category: 'Edit' },
];

export const getShortcutString = (shortcut: ShortcutInfo) => {
  const parts = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
};

export const findShortcutById = (id: string) => XENO_SHORTCUTS.find(s => s.id === id);
