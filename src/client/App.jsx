import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, File, Layers, RefreshCw, Smartphone, Monitor, CheckCircle, HelpCircle, Save, Sliders, MousePointer, Type, Move, Image, Lock, AlertTriangle, PanelLeftClose, PanelLeftOpen, RotateCcw, RotateCw,
  ChevronDown, ChevronRight, X, AlertCircle, PlusSquare, Trash2
} from 'lucide-react';


// Helper to parse Tailwind classes
const parseTailwindClasses = (classString) => {
  const classes = (classString || '').split(/\s+/).filter(Boolean);
  const parsed = {
    padding: '',
    paddingX: '',
    paddingY: '',
    paddingTop: '',
    paddingBottom: '',
    paddingLeft: '',
    paddingRight: '',
    margin: '',
    marginX: '',
    marginY: '',
    marginTop: '',
    marginBottom: '',
    marginLeft: '',
    marginRight: '',
    bg: '',
    textColor: '',
    textSize: '',
    fontWeight: '',
    textAlign: '',
    display: '',
    flexDir: '',
    justify: '',
    alignItems: '',
    gap: '',
    rounded: '',
    borderWidth: '',
    borderColor: '',
    others: []
  };

  classes.forEach(cls => {
    // Spacing
    if (cls.match(/^p-\w+/)) parsed.padding = cls;
    else if (cls.match(/^px-\w+/)) parsed.paddingX = cls;
    else if (cls.match(/^py-\w+/)) parsed.paddingY = cls;
    else if (cls.match(/^pt-\w+/)) parsed.paddingTop = cls;
    else if (cls.match(/^pb-\w+/)) parsed.paddingBottom = cls;
    else if (cls.match(/^pl-\w+/)) parsed.paddingLeft = cls;
    else if (cls.match(/^pr-\w+/)) parsed.paddingRight = cls;
    
    else if (cls.match(/^m-\w+/)) parsed.margin = cls;
    else if (cls.match(/^mx-\w+/)) parsed.marginX = cls;
    else if (cls.match(/^my-\w+/)) parsed.marginY = cls;
    else if (cls.match(/^mt-\w+/)) parsed.marginTop = cls;
    else if (cls.match(/^mb-\w+/)) parsed.marginBottom = cls;
    else if (cls.match(/^ml-\w+/)) parsed.marginLeft = cls;
    else if (cls.match(/^mr-\w+/)) parsed.marginRight = cls;
    
    // Background
    else if (cls.startsWith('bg-')) parsed.bg = cls;
    
    // Text Size
    else if (cls.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/)) parsed.textSize = cls;
    // Font Weight
    else if (cls.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/)) parsed.fontWeight = cls;
    // Text Color
    else if (cls.startsWith('text-') && !cls.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|left|center|right|justify)$/)) parsed.textColor = cls;
    // Text Align
    else if (cls.match(/^text-(left|center|right|justify)$/)) parsed.textAlign = cls;
    
    // Display
    else if (['flex', 'grid', 'block', 'inline-block', 'hidden', 'inline'].includes(cls)) parsed.display = cls;
    else if (cls.startsWith('flex-')) parsed.flexDir = cls;
    else if (cls.startsWith('justify-')) parsed.justify = cls;
    else if (cls.startsWith('items-')) parsed.alignItems = cls;
    else if (cls.startsWith('gap-')) parsed.gap = cls;
    
    // Borders
    else if (cls.startsWith('rounded')) parsed.rounded = cls;
    else if (cls.match(/^border-\d+/) || cls === 'border') parsed.borderWidth = cls;
    else if (cls.startsWith('border-') && !cls.match(/^border-\d+/)) parsed.borderColor = cls;
    
    else parsed.others.push(cls);
  });

  return parsed;
};

// Helper to rebuild Tailwind class string
const buildClassString = (parsed) => {
  const parts = [];
  const fields = [
    'padding', 'paddingX', 'paddingY', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
    'margin', 'marginX', 'marginY', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
    'bg', 'textColor', 'textSize', 'fontWeight', 'textAlign',
    'display', 'flexDir', 'justify', 'alignItems', 'gap',
    'rounded', 'borderWidth', 'borderColor'
  ];

  fields.forEach(field => {
    if (parsed[field]) parts.push(parsed[field]);
  });
  
  if (parsed.others && parsed.others.length > 0) {
    parts.push(...parsed.others);
  }

  return parts.join(' ');
};

// Helper to build a tree structure from relative paths
const buildFileTree = (files) => {
  const root = { name: 'root', isFolder: true, path: '', children: {} };

  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join('/');

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: currentPath,
          isFolder: !isLast,
          children: isLast ? null : {}
        };
      }
      current = current.children[part];
    });
  });

  return root;
};

// Tree node component
function FileTreeNode({ node, level, expandedFolders, toggleFolder, activeFile, onFileClick }) {
  if (!node.isFolder) {
    const isActive = activeFile === node.path;
    return (
      <div 
        className={`file-item ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${level * 14 + 10}px` }}
        onClick={() => onFileClick(node.path)}
      >
        <File size={14} style={{ opacity: 0.7 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
      </div>
    );
  }

  const isExpanded = expandedFolders[node.path] || false;
  const childKeys = Object.keys(node.children || {}).sort((a, b) => {
    const aIsDir = node.children[a].isFolder;
    const bIsDir = node.children[b].isFolder;
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  return (
    <div>
      <div 
        className="file-item folder"
        style={{ paddingLeft: `${level * 14 + 10}px` }}
        onClick={() => toggleFolder(node.path)}
      >
        <Folder size={14} className="folder-icon" />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{node.name}</span>
      </div>
      {isExpanded && childKeys.map(key => (
        <FileTreeNode 
          key={node.children[key].path}
          node={node.children[key]}
          level={level + 1}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          activeFile={activeFile}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  );
}

// Canva-style Element Palette Descriptor
const COMPONENT_PALETTE = [
  {
    category: 'Básicos',
    items: [
      {
        id: 'button-primary',
        label: 'Botón Primario',
        description: 'Botón azul interactivo',
        icon: 'MousePointer',
        template: {
          tagName: 'button',
          className: 'px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm',
          text: 'Nuevo Botón'
        }
      },
      {
        id: 'heading-h1',
        label: 'Título Principal (H1)',
        description: 'Encabezado grande',
        icon: 'Type',
        template: {
          tagName: 'h1',
          className: 'text-3xl font-extrabold text-gray-900 tracking-tight mb-2',
          text: 'Título Principal'
        }
      },
      {
        id: 'heading-h2',
        label: 'Subtítulo (H2)',
        description: 'Encabezado secundario',
        icon: 'Type',
        template: {
          tagName: 'h2',
          className: 'text-2xl font-bold text-gray-800 mb-2',
          text: 'Subtítulo de Sección'
        }
      },
      {
        id: 'paragraph',
        label: 'Párrafo',
        description: 'Bloque de texto estándar',
        icon: 'Type',
        template: {
          tagName: 'p',
          className: 'text-gray-600 text-base leading-relaxed mb-4',
          text: 'Escribe tu descripción o contenido aquí...'
        }
      },
      {
        id: 'badge',
        label: 'Insignia (Badge)',
        description: 'Etiqueta destacada',
        icon: 'CheckCircle',
        template: {
          tagName: 'span',
          className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800',
          text: 'Nuevo Tag'
        }
      }
    ]
  },
  {
    category: 'Estructura & Layout',
    items: [
      {
        id: 'card',
        label: 'Tarjeta (Card)',
        description: 'Contenedor blanco con borde y sombra',
        icon: 'Folder',
        template: {
          tagName: 'div',
          className: 'p-6 bg-white rounded-xl border border-gray-200 shadow-sm mb-4',
          children: [
            {
              tagName: 'h3',
              className: 'text-lg font-bold text-gray-900 mb-2',
              text: 'Título de Tarjeta'
            },
            {
              tagName: 'p',
              className: 'text-gray-600 text-sm mb-4',
              text: 'Contenido explicativo dentro de la tarjeta.'
            }
          ]
        }
      },
      {
        id: 'flex-col',
        label: 'Contenedor Flex',
        description: 'Columna con espaciado vertical',
        icon: 'Layers',
        template: {
          tagName: 'div',
          className: 'flex flex-col gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-4',
          text: 'Contenedor Flex'
        }
      },
      {
        id: 'grid-2col',
        label: 'Grid 2 Columnas',
        description: 'Disposición en 2 columnas',
        icon: 'Monitor',
        template: {
          tagName: 'div',
          className: 'grid grid-cols-1 md:grid-cols-2 gap-4 p-4 mb-4',
          children: [
            {
              tagName: 'div',
              className: 'p-4 bg-white rounded-lg border border-gray-200',
              text: 'Columna 1'
            },
            {
              tagName: 'div',
              className: 'p-4 bg-white rounded-lg border border-gray-200',
              text: 'Columna 2'
            }
          ]
        }
      }
    ]
  },
  {
    category: 'Formularios y Medios',
    items: [
      {
        id: 'image-sample',
        label: 'Imagen de Muestra',
        description: 'Imagen con esquinas redondeadas',
        icon: 'Image',
        template: {
          tagName: 'img',
          className: 'w-full h-48 object-cover rounded-lg shadow-sm mb-4',
          attributes: {
            src: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
            alt: 'Imagen de muestra'
          }
        }
      },
      {
        id: 'input-text',
        label: 'Campo Texto (Input)',
        description: 'Input de formulario',
        icon: 'Sliders',
        template: {
          tagName: 'input',
          className: 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4',
          attributes: {
            type: 'text',
            placeholder: 'Escribe aquí...'
          }
        }
      }
    ]
  }
];

export default function App() {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState('');
  const [targetUrl, setTargetUrl] = useState('http://localhost:3000');
  const [iframeUrl, setIframeUrl] = useState('http://localhost:3000');
  const [selectedElement, setSelectedElement] = useState(null);
  const [parsedClasses, setParsedClasses] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [toasts, setToasts] = useState([]);
  const [inspectorSections, setInspectorSections] = useState({
    content: true,
    layout: true,
    style: true,
    typography: true,
    raw: false
  });
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('desktop');
  const [editorMode, setEditorMode] = useState('edit'); // 'edit' | 'navigate'
  const [draggedTemplate, setDraggedTemplate] = useState(null);
  const [activeColorPicker, setActiveColorPicker] = useState(null); // 'bg' | 'text' | null

  const TAILWIND_COLORS = {
    'transparent': 'transparent', 'white': '#ffffff', 'black': '#000000',
    'slate-100': '#f1f5f9', 'slate-300': '#cbd5e1', 'slate-500': '#64748b', 'slate-700': '#334155', 'slate-900': '#0f172a',
    'gray-100': '#f3f4f6', 'gray-300': '#d1d5db', 'gray-500': '#6b7280', 'gray-700': '#374151', 'gray-900': '#111827',
    'red-100': '#fee2e2', 'red-300': '#fca5a5', 'red-500': '#ef4444', 'red-700': '#b91c1c', 'red-900': '#7f1d1d',
    'orange-100': '#ffedd5', 'orange-300': '#fdba74', 'orange-500': '#f97316', 'orange-700': '#c2410c', 'orange-900': '#7c2d12',
    'yellow-100': '#fef9c3', 'yellow-300': '#fde047', 'yellow-500': '#eab308', 'yellow-700': '#a16207', 'yellow-900': '#713f12',
    'green-100': '#dcfce7', 'green-300': '#86efac', 'green-500': '#22c55e', 'green-700': '#15803d', 'green-900': '#14532d',
    'teal-100': '#ccfbf1', 'teal-300': '#5eead4', 'teal-500': '#14b8a6', 'teal-700': '#0f766e', 'teal-900': '#134e4a',
    'cyan-100': '#cffafe', 'cyan-300': '#67e8f9', 'cyan-500': '#06b6d4', 'cyan-700': '#0e7490', 'cyan-900': '#164e63',
    'blue-100': '#dbeafe', 'blue-300': '#93c5fd', 'blue-500': '#3b82f6', 'blue-700': '#1d4ed8', 'blue-900': '#1e3a8a',
    'indigo-100': '#e0e7ff', 'indigo-300': '#a5b4fc', 'indigo-500': '#6366f1', 'indigo-700': '#4338ca', 'indigo-900': '#312e81',
    'purple-100': '#f3e8ff', 'purple-300': '#d8b4fe', 'purple-500': '#a855f7', 'purple-700': '#7e22ce', 'purple-900': '#581c87',
    'pink-100': '#fce7f3', 'pink-300': '#f9a8d4', 'pink-500': '#ec4899', 'pink-700': '#be185d', 'pink-900': '#831843'
  };
  const addToast = (message, type = 'error') => {
    const id = Date.now().toString() + Math.random().toString().substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toggleSection = (sectionKey) => {
    setInspectorSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // History state stack (max 50)
  const [history, setHistory] = useState({ past: [], present: null, future: [] });

  // Custom Tailwind theme config
  const [customTheme, setCustomTheme] = useState({ colors: {}, spacing: {}, fontFamily: {} });

  // Send mode updates to iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'VISUALDEV_SET_MODE',
        mode: editorMode
      }, '*');
    }
  }, [editorMode]);

  // Fetch custom tailwind config on mount
  useEffect(() => {
    fetch('/api/tailwind-config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.theme) {
          setCustomTheme(data.theme);
        }
      })
      .catch(err => console.error('Error fetching tailwind config:', err));
  }, []);

  // Helper to push history state
  const pushHistoryState = (transaction) => {
    setHistory(prev => {
      const newPast = [...prev.past, transaction];
      if (newPast.length > 50) {
        newPast.shift();
      }
      return {
        past: newPast,
        present: transaction,
        future: []
      };
    });
  };

  // Helper to sync element with preview iframe, react state, and server AST
  const applyTransactionState = async (transaction, isClassNameChange, isTextChange) => {
    const { sourceLoc, instanceIndex, file, line, column, className, text, parsed } = transaction;

    setSelectedElement(prev => prev ? {
      ...prev,
      className: className !== undefined ? className : prev.className,
      text: text !== undefined ? text : prev.text,
      instanceIndex: instanceIndex !== undefined ? instanceIndex : prev.instanceIndex
    } : null);

    if (parsed) {
      setParsedClasses(parsed);
    }

    // Update preview iframe DOM
    if (iframeRef.current) {
      if (isClassNameChange && className !== undefined) {
        iframeRef.current.contentWindow.postMessage({
          type: 'VISUALDEV_UPDATE_CLASSNAME',
          sourceLoc,
          instanceIndex: instanceIndex !== undefined ? instanceIndex : (selectedElement?.instanceIndex),
          className
        }, '*');
      }
      if (isTextChange && text !== undefined) {
        iframeRef.current.contentWindow.postMessage({
          type: 'VISUALDEV_UPDATE_TEXT',
          sourceLoc,
          text
        }, '*');
      }
    }

    // Call AST edit endpoint
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/edit-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file,
          line,
          column,
          newClasses: className,
          newText: text
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        addToast(data?.error || 'Failed to persist AST changes', 'error');
      }
    } catch (e) {
      console.error('Error applying transaction state:', e);
      setSaveStatus('error');
      addToast('Network error while saving AST changes', 'error');
    }
  };

  const handleUndo = async () => {
    if (history.past.length === 0) return;

    const currentTx = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    const prevTx = newPast.length > 0 ? newPast[newPast.length - 1] : null;

    setHistory({
      past: newPast,
      present: prevTx,
      future: [currentTx, ...history.future]
    });

    if (currentTx.type === 'structural') {
      try {
        await fetch('/api/write-file-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: currentTx.file, code: currentTx.prevCode })
        });
      } catch (err) {
        console.error('Error undoing structural change:', err);
      }
    } else {
      const isText = currentTx.prevText !== undefined;
      const undoTransaction = {
        sourceLoc: currentTx.sourceLoc,
        file: currentTx.file,
        line: currentTx.line,
        column: currentTx.column,
        className: currentTx.prevClassName,
        text: currentTx.prevText,
        parsed: currentTx.prevParsed
      };
      await applyTransactionState(undoTransaction, true, isText);
    }
  };

  const handleRedo = async () => {
    if (history.future.length === 0) return;

    const nextTx = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory({
      past: [...history.past, nextTx],
      present: nextTx,
      future: newFuture
    });

    if (nextTx.type === 'structural') {
      try {
        await fetch('/api/write-file-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: nextTx.file, code: nextTx.newCode })
        });
      } catch (err) {
        console.error('Error redoing structural change:', err);
      }
    } else {
      const isText = nextTx.newText !== undefined;
      const redoTransaction = {
        sourceLoc: nextTx.sourceLoc,
        file: nextTx.file,
        line: nextTx.line,
        column: nextTx.column,
        className: nextTx.newClassName,
        text: nextTx.newText,
        parsed: nextTx.newParsed
      };
      await applyTransactionState(redoTransaction, true, isText);
    }
  };

  // Helper to clear selection across parent app and preview iframe
  const clearSelection = () => {
    setSelectedElement(null);
    setParsedClasses(null);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'VISUALDEV_CLEAR_SELECTION' }, '*');
    }
  };

  // Keyboard shortcut listener with focus guarding & Escape key support
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;

      if (e.key === 'Escape') {
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'SELECT' ||
            activeEl.isContentEditable)
        ) {
          activeEl.blur();
        }
        clearSelection();
        return;
      }

      if (activeEl) {
        const tagName = activeEl.tagName.toUpperCase();
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          activeEl.isContentEditable
        ) {
          return;
        }
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (
        (cmdOrCtrl && e.key.toLowerCase() === 'y') ||
        (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history]);

  // Interactive Tree & Code Viewer States
  const [expandedFolders, setExpandedFolders] = useState({ 'src': true, 'src/app': true });
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'code'
  const [fileCode, setFileCode] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [leftSidebarTab, setLeftSidebarTab] = useState('files'); // 'files' | 'layers'
  const [isClassNameLocked, setIsClassNameLocked] = useState(false);
  const [isTextLocked, setIsTextLocked] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('isSidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isSidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  const iframeRef = useRef(null);


  // Fetch workspace files
  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (e) {
      console.error('Error fetching files:', e);
    }
  };

  useEffect(() => {
    fetchFiles();

    // Listen for selection events from iframe
    const handleIframeMessage = (e) => {
      if (e.data && e.data.type === 'VISUALDEV_SELECT_ELEMENT') {
        const { sourceLoc, instanceIndex, className, tagName, text, rect, ancestors } = e.data;
        const fileParts = sourceLoc.split(':');
        const relativeFilePath = fileParts[0];
        const line = parseInt(fileParts[1], 10);
        const col = parseInt(fileParts[2], 10);

        const parsed = parseTailwindClasses(className);

        setSelectedElement({
          sourceLoc,
          instanceIndex: instanceIndex !== undefined ? instanceIndex : 0,
          file: relativeFilePath,
          line,
          column: col,
          tagName,
          className,
          text: text || '',
          rect,
          ancestors
        });

        setParsedClasses(parsed);
        setActiveFile(relativeFilePath);

        // Reset and fetch dynamic analysis status
        setIsClassNameLocked(false);
        setIsTextLocked(false);

        fetch('/api/analyze-element', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: relativeFilePath,
            line,
            column: col
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setIsClassNameLocked(data.isClassNameDynamic);
              setIsTextLocked(data.isTextDynamic);
            }
          })
          .catch(err => {
            console.error('Error analyzing element:', err);
          });
      } else if (e.data && e.data.type === 'VISUALDEV_DROP_ELEMENT') {
        const { sourceLoc, element, position } = e.data;
        if (sourceLoc && element) {
          const parts = sourceLoc.split(':');
          const file = parts[0];
          const line = parseInt(parts[1]);
          const column = parseInt(parts[2]);
          handleInsertElement(element, { file, line, column }, position || 'inside');
        }
      } else if (e.data && e.data.type === 'VISUALDEV_KEY_DOWN') {
        const { key, ctrlKey, metaKey, shiftKey } = e.data;
        if (key === 'Escape') {
          clearSelection();
        } else {
          const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
          const cmdOrCtrl = isMac ? metaKey : ctrlKey;
          if (cmdOrCtrl && !shiftKey && key.toLowerCase() === 'z') {
            handleUndo();
          } else if ((cmdOrCtrl && key.toLowerCase() === 'y') || (cmdOrCtrl && shiftKey && key.toLowerCase() === 'z')) {
            handleRedo();
          } else if (key === 'Delete' || key === 'Backspace') {
            handleDeleteElement();
          }
        }
      } else if (e.data && e.data.type === 'VISUALDEV_URL_CHANGED') {
        if (e.data.url) {
          setTargetUrl(e.data.url);
        }
      } else if (e.data && e.data.type === 'VISUALDEV_UPDATE_RECT') {
        if (e.data.rect) {
          setSelectedElement(prev => prev ? { ...prev, rect: e.data.rect } : null);
        }
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [history, selectedElement]);

  // Sync className change with code in background and update local iframe DOM
  const updateStyleClass = async (updatedParsed) => {
    if (!selectedElement) return;

    const newClassString = buildClassString(updatedParsed);
    const prevClassString = selectedElement.className;

    pushHistoryState({
      file: selectedElement.file,
      line: selectedElement.line,
      column: selectedElement.column,
      sourceLoc: selectedElement.sourceLoc,
      prevClassName: prevClassString,
      newClassName: newClassString,
      prevParsed: parsedClasses,
      newParsed: updatedParsed
    });

    // Update local preview immediately for fluid editing
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({
        type: 'VISUALDEV_UPDATE_CLASSNAME',
        sourceLoc: selectedElement.sourceLoc,
        instanceIndex: selectedElement.instanceIndex,
        className: newClassString
      }, '*');
    }

    // Keep active selected element state in sync
    setSelectedElement(prev => ({
      ...prev,
      className: newClassString
    }));
    setParsedClasses(updatedParsed);

    // Call API to write to code
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/edit-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: selectedElement.file,
          line: selectedElement.line,
          column: selectedElement.column,
          newClasses: newClassString
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        addToast(data?.error || 'Failed to update element style', 'error');
      }
    } catch (error) {
      console.error('Network error writing style:', error);
      setSaveStatus('error');
      addToast('Network error while saving style changes', 'error');
    }
  };

  // Helper to insert a new element from Canva palette via AST
  const handleInsertElement = async (elementTemplate, targetElementOverride = null, insertPosition = 'inside') => {
    let target = targetElementOverride || selectedElement;

    // Automatic fallback if no element is selected on canvas
    if (!target) {
      const fileToUse = activeFile || (files.length > 0 ? files[0].path : 'demo-app/src/app/page.jsx');
      target = { file: fileToUse, line: 5, column: 1 };
    }

    const { file, line, column } = target;
    setSaveStatus('saving');

    try {
      const res = await fetch('/api/insert-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file,
          line,
          column,
          position: insertPosition,
          element: elementTemplate
        })
      });

      const data = await res.json();
      if (data && data.success) {
        pushHistoryState({
          type: 'structural',
          file,
          prevCode: data.prevCode,
          newCode: data.newCode
        });
        setSaveStatus('saved');
        addToast('¡Elemento insertado con éxito!', 'success');
        setTimeout(() => setSaveStatus('idle'), 2000);
        // Permitir que Next.js HMR / Fast Refresh actualice el DOM en vivo
        // sin forzar una recarga completa del iframe que puede cortar la conexión WebSocket.
      } else {
        setSaveStatus('error');
        addToast(data?.error || 'No se pudo insertar el elemento AST', 'error');
      }
    } catch (err) {
      console.error('Error inserting element:', err);
      setSaveStatus('error');
      addToast('Error de red al insertar el elemento', 'error');
    }
  };

  const handleDeleteElement = async () => {
    if (!selectedElement) return;

    const { file, line, column } = selectedElement;
    setSaveStatus('saving');

    try {
      const res = await fetch('/api/delete-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, line, column })
      });

      const data = await res.json();
      if (data && data.success) {
        pushHistoryState({
          type: 'structural',
          file,
          prevCode: data.prevCode,
          newCode: data.newCode
        });
        setSaveStatus('saved');
        addToast('Elemento eliminado', 'success');
        clearSelection();
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        addToast(data?.error || 'No se pudo eliminar el elemento', 'error');
      }
    } catch (err) {
      console.error('Error deleting element:', err);
      setSaveStatus('error');
      addToast('Error de red al eliminar el elemento', 'error');
    }
  };

  // Change individual select/text fields in UI
  const handleStyleChange = (field, value) => {
    if (!parsedClasses) return;
    const updated = { ...parsedClasses, [field]: value };
    updateStyleClass(updated);
  };

  // Manual raw class typing
  const handleRawClassChange = async (e) => {
    const rawVal = e.target.value;
    const prevClassString = selectedElement ? selectedElement.className : '';
    const parsed = parseTailwindClasses(rawVal);

    if (selectedElement) {
      pushHistoryState({
        file: selectedElement.file,
        line: selectedElement.line,
        column: selectedElement.column,
        sourceLoc: selectedElement.sourceLoc,
        prevClassName: prevClassString,
        newClassName: rawVal,
        prevParsed: parsedClasses,
        newParsed: parsed
      });
    }

    setSelectedElement(prev => ({ ...prev, className: rawVal }));
    setParsedClasses(parsed);

    // Write change
    if (iframeRef.current && selectedElement) {
      iframeRef.current.contentWindow.postMessage({
        type: 'VISUALDEV_UPDATE_CLASSNAME',
        sourceLoc: selectedElement.sourceLoc,
        instanceIndex: selectedElement.instanceIndex,
        className: rawVal
      }, '*');
    }

    // Call api to write to file
    if (selectedElement) {
      setSaveStatus('saving');
      try {
        const res = await fetch('/api/edit-style', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: selectedElement.file,
            line: selectedElement.line,
            column: selectedElement.column,
            newClasses: rawVal
          })
        });
        const data = await res.json();
        if (data && data.success) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          addToast(data?.error || 'Failed to write raw classes', 'error');
        }
      } catch (err) {
        console.error('Error in handleRawClassChange:', err);
        setSaveStatus('error');
        addToast('Network error while saving raw classes', 'error');
      }
    }
  };

  const handleTextChange = async (newText) => {
    if (!selectedElement) return;

    const prevTextVal = selectedElement.text || '';

    pushHistoryState({
      file: selectedElement.file,
      line: selectedElement.line,
      column: selectedElement.column,
      sourceLoc: selectedElement.sourceLoc,
      prevClassName: selectedElement.className,
      newClassName: selectedElement.className,
      prevText: prevTextVal,
      newText: newText,
      prevParsed: parsedClasses,
      newParsed: parsedClasses
    });

    setSelectedElement(prev => ({ ...prev, text: newText }));

    // Send visual preview text update instantly
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({
        type: 'VISUALDEV_UPDATE_TEXT',
        sourceLoc: selectedElement.sourceLoc,
        text: newText
      }, '*');
    }

    setSaveStatus('saving');
    try {
      const res = await fetch('/api/edit-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: selectedElement.file,
          line: selectedElement.line,
          column: selectedElement.column,
          newClasses: selectedElement.className,
          newText: newText
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        addToast(data?.error || 'Failed to write text content', 'error');
      }
    } catch (error) {
      console.error('Network error writing text:', error);
      setSaveStatus('error');
      addToast('Network error while saving text content', 'error');
    }
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleFileClick = async (filePath) => {
    setActiveFile(filePath);
    setIsLoadingCode(true);
    setActiveTab('code'); // Switch to code view
    try {
      const res = await fetch('/api/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: filePath })
      });
      const data = await res.json();
      if (data.content !== undefined) {
        setFileCode(data.content);
      } else {
        setFileCode(`// Error al leer archivo: ${data.error}`);
      }
    } catch (e) {
      setFileCode(`// Error de red al leer el archivo: ${e.message}`);
    } finally {
      setIsLoadingCode(false);
    }
  };

  const reloadPreview = () => {
    setIsIframeLoaded(false);
    setIframeUrl(`${targetUrl}?t=${Date.now()}`);
  };

  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isTopClipped = selectedElement && selectedElement.rect && selectedElement.rect.top < 55;
  const isHugeElement = selectedElement && selectedElement.rect && selectedElement.rect.height > windowHeight * 0.6;
  
  let toolbarTop = 0;
  if (selectedElement && selectedElement.rect) {
    if (isTopClipped || isHugeElement) {
      // Posición interna segura arriba
      toolbarTop = Math.max(16, selectedElement.rect.top + 16);
    } else {
      // Arriba del elemento
      toolbarTop = selectedElement.rect.top - 46;
    }
    // Límite inferior para que nunca desaparezca abajo
    toolbarTop = Math.min(toolbarTop, windowHeight - 100);
  }
  const iframeWidth = iframeRef.current ? iframeRef.current.clientWidth : (typeof window !== 'undefined' ? window.innerWidth - 320 : 1000);
  const toolbarWidth = 550; // Aprox ancho de la toolbar con todos los botones
  const toolbarLeft = selectedElement && selectedElement.rect 
    ? Math.max(8, Math.min(selectedElement.rect.left, iframeWidth - toolbarWidth))
    : 0;

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        {/* Left Section: Branding, Sidebar Toggle & Undo/Redo */}
        <div className="logo-section">
          <img 
            src="/assets/editar_logo.png" 
            alt="edItAr Logo" 
            width="24" 
            height="24" 
            style={{ objectFit: 'contain', borderRadius: '4px' }} 
          />
          <span className="logo-title">
            ed<span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>I</span>t<span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>A</span>r
          </span>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="sidebar-toggle-btn"
            title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            aria-label={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            aria-expanded={!isSidebarCollapsed}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
            <button 
              className="sidebar-toggle-btn"
              onClick={handleUndo}
              disabled={history.past.length === 0}
              style={{ opacity: history.past.length === 0 ? 0.3 : 1, cursor: history.past.length === 0 ? 'not-allowed' : 'pointer' }}
              title="Deshacer (Ctrl+Z)"
              aria-label="Deshacer cambios"
            >
              <RotateCcw size={15} />
            </button>
            <button 
              className="sidebar-toggle-btn"
              onClick={handleRedo}
              disabled={history.future.length === 0}
              style={{ opacity: history.future.length === 0 ? 0.3 : 1, cursor: history.future.length === 0 ? 'not-allowed' : 'pointer' }}
              title="Rehacer (Ctrl+Y / Cmd+Shift+Z)"
              aria-label="Rehacer cambios"
            >
              <RotateCw size={15} />
            </button>
          </div>

          {/* Mode Switcher Segmented Toggle */}
          <div className="mode-switcher-container" role="group" aria-label="Modo de trabajo del editor">
            <button 
              className={`mode-switcher-btn ${editorMode === 'edit' ? 'active' : ''}`}
              onClick={() => setEditorMode('edit')}
              title="Modo Edición"
              aria-label="Modo Edición"
              aria-pressed={editorMode === 'edit'}
            >
              <Sliders size={14} />
              <span>Editar</span>
            </button>
            <button 
              className={`mode-switcher-btn ${editorMode === 'navigate' ? 'active' : ''}`}
              onClick={() => setEditorMode('navigate')}
              title="Modo Navegación"
              aria-label="Modo Navegación"
              aria-pressed={editorMode === 'navigate'}
            >
              <MousePointer size={14} />
              <span>Navegar</span>
            </button>
          </div>

          {/* AST Save Status Badge */}
          <div className="status-badge" aria-live="polite" aria-label={`Estado de guardado: ${saveStatus}`}>
            <span className={`status-dot ${saveStatus}`} />
            <span>
              {saveStatus === 'idle' && 'Listo'}
              {saveStatus === 'saving' && 'Guardando...'}
              {saveStatus === 'saved' && 'Guardado'}
              {saveStatus === 'error' && 'Error al guardar'}
            </span>
          </div>
        </div>

        {/* Center Section: Symmetrical URL Bar */}
        <div className="url-bar-container">
          <input 
            type="text" 
            className="url-input" 
            value={targetUrl} 
            onChange={(e) => setTargetUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setIframeUrl(targetUrl)}
            aria-label="Dirección URL de la vista previa"
          />
          <button onClick={reloadPreview} className="sidebar-toggle-btn" style={{ padding: '4px', cursor: 'pointer' }} title="Recargar vista previa" aria-label="Recargar vista previa">
            <RefreshCw size={13} className={!isIframeLoaded ? 'spin' : ''} />
          </button>
        </div>

        {/* Right Section: Viewport & View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px' }}>
            <button 
              className={`tab-button ${activeTab === 'visual' ? 'active' : ''}`} 
              onClick={() => setActiveTab('visual')}
              style={{ padding: '4px 10px', fontSize: '12px' }}
              aria-label="Ver Lienzo Visual"
              aria-selected={activeTab === 'visual'}
            >
              Lienzo Visual
            </button>
            <button 
              className={`tab-button ${activeTab === 'code' ? 'active' : ''}`} 
              onClick={() => setActiveTab('code')}
              style={{ padding: '4px 10px', fontSize: '12px' }}
              aria-label="Ver Código"
              aria-selected={activeTab === 'code'}
            >
              Ver Código
            </button>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className={`sidebar-toggle-btn ${viewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setViewMode('mobile')}
              title="Vista Mobile"
              aria-label="Cambiar a vista móvil"
            >
              <Smartphone size={15} />
            </button>
            <button 
              className={`sidebar-toggle-btn ${viewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewMode('desktop')}
              title="Vista Desktop"
              aria-label="Cambiar a vista escritorio"
            >
              <Monitor size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Split */}
      <main className="workspace-split">
        {/* Left Sidebar - Files / Layers */}
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '4px' }}>
            <button 
              className={`tab-button ${leftSidebarTab === 'elements' ? 'active' : ''}`}
              style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
              onClick={() => setLeftSidebarTab('elements')}
            >
              Elementos
            </button>
            <button 
              className={`tab-button ${leftSidebarTab === 'files' ? 'active' : ''}`}
              style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
              onClick={() => setLeftSidebarTab('files')}
            >
              Archivos
            </button>
            <button 
              className={`tab-button ${leftSidebarTab === 'layers' ? 'active' : ''}`}
              style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
              onClick={() => setLeftSidebarTab('layers')}
            >
              Capas
            </button>
          </div>

          {leftSidebarTab === 'elements' ? (
            <div style={{ padding: '0.75rem', height: 'calc(100% - 40px)', overflowY: 'auto' }}>
              <div className="sidebar-title" style={{ marginBottom: '0.75rem' }}>
                <PlusSquare size={14} />
                <span>Paleta de Elementos</span>
              </div>

              {selectedElement ? (
                <div style={{ fontSize: '0.75rem', padding: '6px 10px', backgroundColor: 'var(--accent-light)', borderRadius: '6px', marginBottom: '1rem', color: 'var(--accent-hover)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={13} />
                  <span>Insertando en &lt;{selectedElement.tagName}&gt;</span>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', padding: '6px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={13} />
                  <span>Haz clic en un elemento del lienzo o arrastra para ubicarlo</span>
                </div>
              )}

              {COMPONENT_PALETTE.map((group) => (
                <div key={group.category} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    {group.category}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="component-card"
                        draggable
                        onDragStart={(e) => {
                          setDraggedTemplate(item.template);
                          e.dataTransfer.setData('text/plain', JSON.stringify(item.template));
                          if (iframeRef.current && iframeRef.current.contentWindow) {
                            iframeRef.current.contentWindow.postMessage({
                              type: 'VISUALDEV_START_DRAG',
                              element: item.template
                            }, '*');
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedTemplate(null);
                          if (iframeRef.current && iframeRef.current.contentWindow) {
                            iframeRef.current.contentWindow.postMessage({
                              type: 'VISUALDEV_END_DRAG'
                            }, '*');
                          }
                        }}
                        onClick={() => handleInsertElement(item.template)}
                        title="Haz clic para insertar o arrastra al lienzo"
                      >
                        <div className="component-card-icon">
                          {item.icon === 'MousePointer' && <MousePointer size={16} />}
                          {item.icon === 'Type' && <Type size={16} />}
                          {item.icon === 'CheckCircle' && <CheckCircle size={16} />}
                          {item.icon === 'Folder' && <Folder size={16} />}
                          {item.icon === 'Layers' && <Layers size={16} />}
                          {item.icon === 'Monitor' && <Monitor size={16} />}
                          {item.icon === 'Image' && <Image size={16} />}
                          {item.icon === 'Sliders' && <Sliders size={16} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : leftSidebarTab === 'files' ? (
            <>
              <div className="sidebar-title">
                <Folder size={14} />
                <span>Workspace</span>
                <button onClick={fetchFiles} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <RefreshCw size={12} />
                </button>
              </div>
              <ul className="file-list">
                {files.length === 0 ? (
                  <li style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cargando archivos...</li>
                ) : (
                  Object.keys(buildFileTree(files).children).sort((a, b) => {
                    const aIsDir = buildFileTree(files).children[a].isFolder;
                    const bIsDir = buildFileTree(files).children[b].isFolder;
                    if (aIsDir && !bIsDir) return -1;
                    if (!aIsDir && bIsDir) return 1;
                    return a.localeCompare(b);
                  }).map(key => (
                    <FileTreeNode 
                      key={key}
                      node={buildFileTree(files).children[key]}
                      level={0}
                      expandedFolders={expandedFolders}
                      toggleFolder={toggleFolder}
                      activeFile={activeFile}
                      onFileClick={handleFileClick}
                    />
                  ))
                )}
              </ul>
            </>
          ) : (
            <div style={{ padding: '0.5rem' }}>
              <div className="sidebar-title">
                <Layers size={14} />
                <span>Capas del Elemento</span>
              </div>
              {selectedElement && selectedElement.ancestors ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '0.5rem' }}>
                  {selectedElement.ancestors.map((ancestor, index) => {
                    const isLast = index === selectedElement.ancestors.length - 1;
                    const indent = index * 12;
                    return (
                      <div 
                        key={index}
                        className={`file-item ${isLast ? 'active' : ''}`}
                        style={{ 
                          paddingLeft: `${indent + 10}px`, 
                          fontWeight: isLast ? 'bold' : 'normal',
                          backgroundColor: isLast ? 'var(--accent-light)' : 'transparent',
                          color: isLast ? 'var(--text-primary)' : 'var(--text-secondary)'
                        }}
                        onClick={() => {
                          if (ancestor.sourceLoc) {
                            if (iframeRef.current) {
                              iframeRef.current.contentWindow.postMessage({
                                type: 'VISUALDEV_FORCE_SELECT',
                                sourceLoc: ancestor.sourceLoc
                              }, '*');
                            }
                          }
                        }}
                      >
                        <Layers size={12} style={{ marginRight: '6px', color: isLast ? 'var(--accent-hover)' : 'var(--text-muted)' }} />
                        <span>{ancestor.tagName}{ancestor.id ? `#${ancestor.id}` : ''}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <Layers size={36} />
                  <p>Selecciona un elemento en el lienzo para inspeccionar sus capas.</p>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Center Live preview canvas */}
        <section className="canvas-container">
          <div className="canvas-header">
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedElement ? `${selectedElement.file}:${selectedElement.line}:${selectedElement.column}` : 'Ningún elemento seleccionado'}
            </span>
          </div>

          <div 
            className="canvas-frame-wrapper" 
            style={{ 
              width: (viewMode === 'mobile' && activeTab === 'visual') ? '375px' : '100%', 
              height: '100%', 
              transition: 'width 0.3s ease',
              position: 'relative'
            }}
          >
            {activeTab === 'visual' ? (
              <>
                <iframe 
                  ref={iframeRef}
                  src={iframeUrl} 
                  className="preview-iframe"
                  onLoad={() => {
                    setIsIframeLoaded(true);
                    if (iframeRef.current && iframeRef.current.contentWindow) {
                      iframeRef.current.contentWindow.postMessage({
                        type: 'VISUALDEV_SET_MODE',
                        mode: editorMode
                      }, '*');
                    }
                  }}
                  id="preview-iframe"
                />

                {/* Drag Overlay over iframe */}
                {draggedTemplate && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 999999,
                      cursor: 'copy'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                      if (iframeRef.current) {
                        const rect = iframeRef.current.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        iframeRef.current.contentWindow.postMessage({
                          type: 'VISUALDEV_DRAG_HOVER',
                          x,
                          y,
                          element: draggedTemplate
                        }, '*');
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (iframeRef.current) {
                        const rect = iframeRef.current.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        iframeRef.current.contentWindow.postMessage({
                          type: 'VISUALDEV_DRAG_DROP',
                          x,
                          y,
                          element: draggedTemplate
                        }, '*');
                      }
                      setDraggedTemplate(null);
                    }}
                    onDragLeave={() => {
                      if (iframeRef.current && iframeRef.current.contentWindow) {
                        iframeRef.current.contentWindow.postMessage({
                          type: 'VISUALDEV_DRAG_END'
                        }, '*');
                      }
                    }}
                  />
                )}

                {/* Floating Quick Editing Toolbar */}
                {selectedElement && selectedElement.rect && (
                  <div 
                    className="floating-toolbar"
                    style={{
                      top: `${toolbarTop}px`,
                      left: `${toolbarLeft}px`
                    }}
                  >
                    {/* Element Tag Label */}
                    <span className="floating-toolbar-tag">
                      {selectedElement.tagName}
                    </span>

                    {/* Font Weight (Bold) Toggle */}
                    <button 
                      className={`floating-toolbar-btn ${parsedClasses.fontWeight === 'font-bold' ? 'active' : ''}`}
                      onClick={() => handleStyleChange('fontWeight', parsedClasses.fontWeight === 'font-bold' ? '' : 'font-bold')}
                      title="Negrita"
                      aria-label="Negrita"
                      aria-pressed={parsedClasses.fontWeight === 'font-bold'}
                    >
                      B
                    </button>

                    {/* Font Style (Italic) Toggle */}
                    <button 
                      className={`floating-toolbar-btn ${parsedClasses.fontWeight === 'italic' ? 'active' : ''}`}
                      onClick={() => handleStyleChange('fontWeight', parsedClasses.fontWeight === 'italic' ? '' : 'italic')}
                      title="Cursiva"
                      aria-label="Cursiva"
                      aria-pressed={parsedClasses.fontWeight === 'italic'}
                    >
                      I
                    </button>

                    {/* Font Size Quick Selector */}
                    <select 
                      className="floating-toolbar-select"
                      value={parsedClasses.textSize}
                      onChange={(e) => handleStyleChange('textSize', e.target.value)}
                      aria-label="Tamaño de texto"
                    >
                      <option value="">Tamaño</option>
                      {['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'].map(v => (
                        <option key={v} value={v}>{v.replace('text-', '')}</option>
                      ))}
                    </select>

                    {/* Align Selectors */}
                    <div className="floating-toolbar-divider" />
                    <div className="floating-toolbar-group">
                      {['left', 'center', 'right'].map(align => (
                        <button
                          key={align}
                          className={`floating-toolbar-btn ${parsedClasses.textAlign === `text-${align}` ? 'active' : ''}`}
                          onClick={() => handleStyleChange('textAlign', parsedClasses.textAlign === `text-${align}` ? '' : `text-${align}`)}
                          title={`Alinear a la ${align === 'left' ? 'izquierda' : align === 'center' ? 'centro' : 'derecha'}`}
                          aria-label={`Alinear a la ${align === 'left' ? 'izquierda' : align === 'center' ? 'centro' : 'derecha'}`}
                          aria-pressed={parsedClasses.textAlign === `text-${align}`}
                        >
                          {align === 'left' ? 'L' : align === 'center' ? 'C' : 'R'}
                        </button>
                      ))}
                    </div>

                    {/* Background & Text Quick Colors */}
                    <div className="floating-toolbar-divider" />
                    <div className="floating-toolbar-group">
                      <div style={{ position: 'relative' }}>
                        <button
                          className={`floating-toolbar-btn ${activeColorPicker === 'bg' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveColorPicker(prev => prev === 'bg' ? null : 'bg');
                          }}
                          title="Color de Fondo"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <div style={{ 
                            width: 14, height: 14, borderRadius: '50%', 
                            border: '1px solid var(--border-color)', 
                            backgroundColor: parsedClasses.bg && TAILWIND_COLORS[parsedClasses.bg.replace('bg-', '')] 
                              ? TAILWIND_COLORS[parsedClasses.bg.replace('bg-', '')] 
                              : 'transparent' 
                          }} />
                          Fondo
                        </button>
                        
                        {activeColorPicker === 'bg' && (
                          <div className="color-popover" onClick={(e) => e.stopPropagation()}>
                            {Object.entries(TAILWIND_COLORS).map(([name, hex]) => (
                              <button
                                key={name}
                                className="color-swatch"
                                style={{ backgroundColor: hex }}
                                title={name}
                                onClick={() => {
                                  handleStyleChange('bg', name === 'transparent' ? 'bg-transparent' : `bg-${name}`);
                                  setActiveColorPicker(null);
                                }}
                              >
                                {name === 'transparent' && <span style={{ color: '#888', fontSize: '12px' }}>✖</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ position: 'relative' }}>
                        <button
                          className={`floating-toolbar-btn ${activeColorPicker === 'text' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveColorPicker(prev => prev === 'text' ? null : 'text');
                          }}
                          title="Color de Texto"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <div style={{ 
                            width: 14, height: 14, borderRadius: '50%', 
                            border: '1px solid var(--border-color)', 
                            backgroundColor: parsedClasses.textColor && TAILWIND_COLORS[parsedClasses.textColor.replace('text-', '')] 
                              ? TAILWIND_COLORS[parsedClasses.textColor.replace('text-', '')] 
                              : 'transparent' 
                          }} />
                          Texto
                        </button>

                        {activeColorPicker === 'text' && (
                          <div className="color-popover" style={{ left: '-50px' }} onClick={(e) => e.stopPropagation()}>
                            {Object.entries(TAILWIND_COLORS).map(([name, hex]) => (
                              <button
                                key={name}
                                className="color-swatch"
                                style={{ backgroundColor: name === 'transparent' ? 'transparent' : hex }}
                                title={name}
                                onClick={() => {
                                  handleStyleChange('textColor', name === 'transparent' ? '' : `text-${name}`);
                                  setActiveColorPicker(null);
                                }}
                              >
                                {name === 'transparent' ? <span style={{ color: '#888', fontSize: '12px' }}>✖</span> : <span style={{ color: ['white', 'slate-200', 'transparent'].includes(name) ? '#000' : '#fff', fontWeight: 'bold' }}>A</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="floating-toolbar-divider" />
                      
                      <button 
                        className="floating-toolbar-btn"
                        style={{ color: '#ef4444' }}
                        title="Eliminar elemento (Supr)"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteElement();
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="code-viewer-container">
                {isLoadingCode ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando código fuente...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: 'var(--accent-hover)', fontFamily: 'monospace' }}>{activeFile || 'Ningún archivo seleccionado'}</span>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Vista de Lectura</span>
                    </div>
                    {fileCode ? (
                      fileCode.split('\n').map((line, idx) => (
                        <div key={idx} className="code-line">
                          <span className="code-line-number">{idx + 1}</span>
                          <span>{line || ' '}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Selecciona un archivo de tu workspace para ver su código fuente aquí.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Sidebar - Properties/Tailwind Inspector */}
        <aside className="inspector">
          <div className="inspector-header">
            <h2 className="inspector-title">
              <Sliders size={16} style={{ color: 'var(--accent-hover)' }} />
              Inspector
            </h2>
            {selectedElement ? (
              <div className="selected-element-badge">
                &lt;{selectedElement.tagName}&gt; en {selectedElement.file.split('/').pop()} L{selectedElement.line}
              </div>
            ) : (
              <div className="selected-element-badge" style={{ color: 'var(--text-muted)' }}>
                Haz clic en cualquier elemento del lienzo para editarlo
              </div>
            )}
          </div>

          {selectedElement && parsedClasses ? (
            <>
              {/* Accordion 1: Text Content Editor */}
              {['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'button', 'a', 'div'].includes(selectedElement.tagName) && (
                <div className="inspector-section">
                  <button 
                    className="accordion-header"
                    onClick={() => toggleSection('content')}
                    aria-expanded={inspectorSections.content}
                    aria-label="Sección Contenido del Texto"
                  >
                    <h3 className="accordion-title">
                      Contenido del Texto
                      {isTextLocked && (
                        <span className="lock-tooltip-container">
                          <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                          <span className="tooltip-text">Texto bloqueado: contiene expresiones o nodos dinámicos.</span>
                        </span>
                      )}
                    </h3>
                    <div className="accordion-icon">
                      {inspectorSections.content ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </button>
                  {inspectorSections.content && (
                    <div className="accordion-content">
                      <div className="input-group">
                        <textarea 
                          className="class-textarea" 
                          style={{ height: '60px', fontFamily: 'sans-serif' }}
                          value={selectedElement.text || ''} 
                          onChange={(e) => handleTextChange(e.target.value)}
                          disabled={isTextLocked}
                          aria-label="Contenido del Texto"
                          placeholder={isTextLocked ? "El contenido del texto no se puede editar debido a código dinámico..." : "Escribe el contenido del texto..."}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Accordion 2: Spacing (Padding/Margin) */}
              <div className="inspector-section">
                <button 
                  className="accordion-header"
                  onClick={() => toggleSection('style')}
                  aria-expanded={inspectorSections.style}
                  aria-label="Sección Espaciado (Padding & Margin)"
                >
                  <h3 className="accordion-title">
                    Espaciado (Padding & Margin)
                    {isClassNameLocked && (
                      <span className="lock-tooltip-container">
                        <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                        <span className="tooltip-text">Estilos bloqueados: className contiene código dinámico.</span>
                      </span>
                    )}
                  </h3>
                  <div className="accordion-icon">
                    {inspectorSections.style ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>
                {inspectorSections.style && (
                  <div className="accordion-content">
                    <div className="input-grid" style={{ marginBottom: '0.75rem' }}>
                      <div className="input-group">
                        <label>Padding (General)</label>
                        <select 
                          className="select-field" 
                          value={parsedClasses.padding} 
                          disabled={isClassNameLocked}
                          onChange={(e) => handleStyleChange('padding', e.target.value)}
                          aria-label="Padding General"
                        >
                          <option value="">Ninguno</option>
                          {['p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12', 'p-16'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Margin (General)</label>
                        <select 
                          className="select-field" 
                          value={parsedClasses.margin} 
                          disabled={isClassNameLocked}
                          onChange={(e) => handleStyleChange('margin', e.target.value)}
                          aria-label="Margin General"
                        >
                          <option value="">Ninguno</option>
                          {['m-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8', 'm-10', 'm-12', 'm-16', 'm-auto'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="input-grid">
                      <div className="input-group">
                        <label>Padding X (Eje X)</label>
                        <select 
                          className="select-field" 
                          value={parsedClasses.paddingX} 
                          disabled={isClassNameLocked}
                          onChange={(e) => handleStyleChange('paddingX', e.target.value)}
                          aria-label="Padding X"
                        >
                          <option value="">Defecto</option>
                          {['px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8', 'px-10', 'px-12', 'px-16'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Padding Y (Eje Y)</label>
                        <select 
                          className="select-field" 
                          value={parsedClasses.paddingY} 
                          disabled={isClassNameLocked}
                          onChange={(e) => handleStyleChange('paddingY', e.target.value)}
                          aria-label="Padding Y"
                        >
                          <option value="">Defecto</option>
                          {['py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8', 'py-10', 'py-12', 'py-16'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Background & Borders */}
              <div className="inspector-section">
                <button 
                  className="accordion-header"
                  onClick={() => toggleSection('layout')}
                  aria-expanded={inspectorSections.layout}
                  aria-label="Sección Color de Fondo y Bordes"
                >
                  <h3 className="accordion-title">
                    Color de Fondo y Bordes
                    {isClassNameLocked && (
                      <span className="lock-tooltip-container">
                        <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                        <span className="tooltip-text">Estilos bloqueados: className contiene código dinámico.</span>
                      </span>
                    )}
                  </h3>
                  <div className="accordion-icon">
                    {inspectorSections.layout ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>
                {inspectorSections.layout && (
                  <div className="accordion-content">
                    <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                      <label>Color de Fondo (Tailwind)</label>
                      <select 
                        className="select-field" 
                        value={parsedClasses.bg} 
                        disabled={isClassNameLocked}
                        onChange={(e) => handleStyleChange('bg', e.target.value)}
                        aria-label="Color de fondo"
                      >
                        <option value="">Sin fondo</option>
                        {Array.from(new Set([
                          ...Object.keys(customTheme.colors || {}).flatMap(c => {
                            const val = customTheme.colors[c];
                            if (typeof val === 'object' && val !== null) {
                              return Object.keys(val).map(sub => `bg-${c}-${sub}`);
                            }
                            return [`bg-${c}`];
                          }),
                          'bg-transparent', 'bg-white', 'bg-black',
                          'bg-slate-50', 'bg-slate-100', 'bg-slate-200', 'bg-slate-500', 'bg-slate-800', 'bg-slate-900',
                          'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
                          'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
                          'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
                        ])).map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div className="input-grid">
                      <div className="input-group">
                        <label>Esquinas (Round)</label>
                        <select 
                          className="select-field" 
                          value={parsedClasses.rounded} 
                          disabled={isClassNameLocked}
                          onChange={(e) => handleStyleChange('rounded', e.target.value)}
                          aria-label="Redondeo de esquinas"
                        >
                          <option value="">Esquinas rectas</option>
                          {['rounded-none', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Grosor de Borde</label>
                        <select 
                          className="select-field" 
                          value={parsedClasses.borderWidth} 
                          disabled={isClassNameLocked}
                          onChange={(e) => handleStyleChange('borderWidth', e.target.value)}
                          aria-label="Grosor de borde"
                        >
                          <option value="">Sin Borde</option>
                          {['border-0', 'border', 'border-2', 'border-4', 'border-8'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 4: Typography */}
              <div className="inspector-section">
                <button 
                  className="accordion-header"
                  onClick={() => toggleSection('typography')}
                  aria-expanded={inspectorSections.typography}
                  aria-label="Sección Tipografía"
                >
                  <h3 className="accordion-title">
                    Tipografía
                    {isClassNameLocked && (
                      <span className="lock-tooltip-container">
                        <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                        <span className="tooltip-text">Estilos bloqueados: className contiene código dinámico.</span>
                      </span>
                    )}
                  </h3>
                  <div className="accordion-icon">
                    {inspectorSections.typography ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>
                {inspectorSections.typography && (
                  <div className="accordion-content">
                    <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                      <label>Color de Texto</label>
                      <select 
                        className="select-field" 
                        value={parsedClasses.textColor} 
                        disabled={isClassNameLocked}
                        onChange={(e) => handleStyleChange('textColor', e.target.value)}
                        aria-label="Color de texto"
                      >
                        <option value="">Defecto</option>
                        {Array.from(new Set([
                          ...Object.keys(customTheme.colors || {}).flatMap(c => {
                            const val = customTheme.colors[c];
                            if (typeof val === 'object' && val !== null) {
                              return Object.keys(val).map(sub => `text-${c}-${sub}`);
                            }
                            return [`text-${c}`];
                          }),
                          'text-white', 'text-black', 'text-slate-200', 'text-slate-400', 'text-slate-600',
                          'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500',
                          'text-blue-500', 'text-indigo-500', 'text-purple-500', 'text-pink-500'
                        ])).map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div className="input-grid">
                      <div className="input-group">
                        <label>Tamaño</label>
                        <select 
                          className="select-field" 
                          value={parsedClasses.textSize} 
                          disabled={isClassNameLocked}
                          onChange={(e) => handleStyleChange('textSize', e.target.value)}
                          aria-label="Tamaño de texto"
                        >
                          <option value="">Medio (Normal)</option>
                          {['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Grosor</label>
                        <select 
                          className="select-field" 
                          value={parsedClasses.fontWeight} 
                          disabled={isClassNameLocked}
                          onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                          aria-label="Grosor de texto"
                        >
                          <option value="">Defecto</option>
                          {['font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-black'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 5: Raw Classes */}
              <div className="inspector-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <button 
                  className="accordion-header"
                  onClick={() => toggleSection('raw')}
                  aria-expanded={inspectorSections.raw}
                  aria-label="Sección Clases de Tailwind Directo"
                >
                  <h3 className="accordion-title">
                    Clases de Tailwind (Directo)
                    {isClassNameLocked && (
                      <span className="lock-tooltip-container">
                        <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                        <span className="tooltip-text">Estilos bloqueados: className contiene código dinámico.</span>
                      </span>
                    )}
                  </h3>
                  <div className="accordion-icon">
                    {inspectorSections.raw ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>
                {inspectorSections.raw && (
                  <div className="accordion-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <textarea 
                      className="class-textarea" 
                      value={selectedElement.className} 
                      onChange={handleRawClassChange}
                      disabled={isClassNameLocked}
                      style={{ flex: 1, minHeight: '80px' }}
                      aria-label="Clases de Tailwind Directas"
                      placeholder={isClassNameLocked ? "Las clases no se pueden editar debido a expresiones dinámicas..." : "Escribe clases personalizadas aquí..."}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Layers size={36} />
              <p>Selecciona un elemento en el lienzo visual para inspeccionar y cambiar sus estilos.</p>
            </div>
          )}
        </aside>
      </main>

      {/* Toast Notification Container */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="assertive" role="alert">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast-item toast-${toast.type}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {toast.type === 'error' && <AlertCircle size={16} style={{ color: 'var(--danger-color)' }} />}
                {toast.type === 'success' && <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />}
                {toast.type === 'warning' && <AlertTriangle size={16} style={{ color: 'var(--warning-color)' }} />}
                <span>{toast.message}</span>
              </div>
              <button 
                className="toast-close-btn" 
                onClick={() => removeToast(toast.id)}
                aria-label="Cerrar notificación"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
