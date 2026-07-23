import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, File, Layers, RefreshCw, Smartphone, Monitor, CheckCircle, HelpCircle, Save, Sliders, Type, Move, Image, Lock, AlertTriangle, PanelLeftClose, PanelLeftOpen, RotateCcw, RotateCw
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

export default function App() {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState('');
  const [targetUrl, setTargetUrl] = useState('http://localhost:3000');
  const [iframeUrl, setIframeUrl] = useState('http://localhost:3000');
  const [selectedElement, setSelectedElement] = useState(null);
  const [parsedClasses, setParsedClasses] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('desktop');

  // History state stack (max 50)
  const [history, setHistory] = useState({ past: [], present: null, future: [] });

  // Custom Tailwind theme config
  const [customTheme, setCustomTheme] = useState({ colors: {}, spacing: {}, fontFamily: {} });

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
    const { sourceLoc, file, line, column, className, text, parsed } = transaction;

    setSelectedElement(prev => prev ? {
      ...prev,
      className: className !== undefined ? className : prev.className,
      text: text !== undefined ? text : prev.text
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
    try {
      await fetch('/api/edit-style', {
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
    } catch (e) {
      console.error('Error applying transaction state:', e);
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
  };

  // Keyboard shortcut listener with focus guarding
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
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
        const { sourceLoc, className, tagName, text, rect, ancestors } = e.data;
        const fileParts = sourceLoc.split(':');
        const relativeFilePath = fileParts[0];
        const line = parseInt(fileParts[1], 10);
        const col = parseInt(fileParts[2], 10);

        const parsed = parseTailwindClasses(className);

        setSelectedElement({
          sourceLoc,
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
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

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
      if (!data.success) {
        console.error('Error writing styles:', data.error);
      }
    } catch (error) {
      console.error('Network error writing style:', error);
    }
  };

  // Change individual select/text fields in UI
  const handleStyleChange = (field, value) => {
    if (!parsedClasses) return;
    const updated = { ...parsedClasses, [field]: value };
    updateStyleClass(updated);
  };

  // Manual raw class typing
  const handleRawClassChange = (e) => {
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
        className: rawVal
      }, '*');
    }

    // Call api to write to file
    if (selectedElement) {
      fetch('/api/edit-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: selectedElement.file,
          line: selectedElement.line,
          column: selectedElement.column,
          newClasses: rawVal
        })
      }).catch(e => console.error(e));
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
      if (!data.success) {
        console.error('Error writing text content:', data.error);
      }
    } catch (error) {
      console.error('Network error writing text:', error);
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

  const isTopClipped = selectedElement && selectedElement.rect && selectedElement.rect.top < 55;
  const toolbarTop = selectedElement && selectedElement.rect 
    ? (isTopClipped ? (selectedElement.rect.top + selectedElement.rect.height + 8) : (selectedElement.rect.top - 46))
    : 0;
  const toolbarLeft = selectedElement && selectedElement.rect 
    ? Math.max(8, selectedElement.rect.left)
    : 0;

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        {/* Left Section: Branding, Sidebar Toggle & Undo/Redo */}
        <div className="logo-section">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span className="logo-title">
            ed<span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>I</span>t<span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>A</span>r
          </span>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="sidebar-toggle-btn"
            title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
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
            >
              <RotateCcw size={15} />
            </button>
            <button 
              className="sidebar-toggle-btn"
              onClick={handleRedo}
              disabled={history.future.length === 0}
              style={{ opacity: history.future.length === 0 ? 0.3 : 1, cursor: history.future.length === 0 ? 'not-allowed' : 'pointer' }}
              title="Rehacer (Ctrl+Y / Cmd+Shift+Z)"
            >
              <RotateCw size={15} />
            </button>
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
          />
          <button onClick={reloadPreview} className="sidebar-toggle-btn" style={{ padding: '4px', cursor: 'pointer' }} title="Recargar vista previa">
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
            >
              Lienzo Visual
            </button>
            <button 
              className={`tab-button ${activeTab === 'code' ? 'active' : ''}`} 
              onClick={() => setActiveTab('code')}
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              Ver Código
            </button>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className={`sidebar-toggle-btn ${viewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setViewMode('mobile')}
              title="Vista Mobile"
            >
              <Smartphone size={15} />
            </button>
            <button 
              className={`sidebar-toggle-btn ${viewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewMode('desktop')}
              title="Vista Desktop"
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
              className={`tab-button ${leftSidebarTab === 'files' ? 'active' : ''}`}
              style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}
              onClick={() => setLeftSidebarTab('files')}
            >
              Archivos
            </button>
            <button 
              className={`tab-button ${leftSidebarTab === 'layers' ? 'active' : ''}`}
              style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}
              onClick={() => setLeftSidebarTab('layers')}
            >
              Capas (DOM)
            </button>
          </div>

          {leftSidebarTab === 'files' ? (
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
                          color: isLast ? '#fff' : 'var(--text-secondary)'
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
              transition: 'width 0.3s ease' 
            }}
          >
            {activeTab === 'visual' ? (
              <>
                <iframe 
                  ref={iframeRef}
                  src={iframeUrl} 
                  className="preview-iframe"
                  onLoad={() => setIsIframeLoaded(true)}
                  id="preview-iframe"
                />

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
                    >
                      B
                    </button>

                    {/* Font Style (Italic) Toggle */}
                    <button 
                      className={`floating-toolbar-btn ${parsedClasses.fontWeight === 'italic' ? 'active' : ''}`}
                      onClick={() => handleStyleChange('fontWeight', parsedClasses.fontWeight === 'italic' ? '' : 'italic')}
                      title="Cursiva"
                    >
                      I
                    </button>

                    {/* Font Size Quick Selector */}
                    <select 
                      className="floating-toolbar-select"
                      value={parsedClasses.textSize}
                      onChange={(e) => handleStyleChange('textSize', e.target.value)}
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
                        >
                          {align === 'left' ? 'L' : align === 'center' ? 'C' : 'R'}
                        </button>
                      ))}
                    </div>

                    {/* Background & Text Quick Colors */}
                    <div className="floating-toolbar-divider" />
                    <div className="floating-toolbar-group">
                      <select
                        className="floating-toolbar-select"
                        value={parsedClasses.bg}
                        onChange={(e) => handleStyleChange('bg', e.target.value)}
                        title="Fondo"
                      >
                        <option value="">Fondo</option>
                        {['bg-transparent', 'bg-white', 'bg-black', 'bg-slate-100', 'bg-slate-800', 'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500'].map(v => (
                          <option key={v} value={v}>{v.replace('bg-', '')}</option>
                        ))}
                      </select>
                      
                      <select
                        className="floating-toolbar-select"
                        value={parsedClasses.textColor}
                        onChange={(e) => handleStyleChange('textColor', e.target.value)}
                        title="Texto"
                      >
                        <option value="">Texto</option>
                        {['text-white', 'text-black', 'text-slate-400', 'text-red-500', 'text-green-500', 'text-blue-500', 'text-indigo-500'].map(v => (
                          <option key={v} value={v}>{v.replace('text-', '')}</option>
                        ))}
                      </select>
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
              {/* Text Content Editor */}
              {['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'button', 'a', 'div'].includes(selectedElement.tagName) && (
                <div className="inspector-section">
                  <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Contenido del Texto
                    {isTextLocked && (
                      <span className="lock-tooltip-container">
                        <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                        <span className="tooltip-text">Texto bloqueado: contiene expresiones o nodos dinámicos.</span>
                      </span>
                    )}
                  </h3>
                  <div className="input-group">
                    <textarea 
                      className="class-textarea" 
                      style={{ height: '60px', fontFamily: 'sans-serif' }}
                      value={selectedElement.text || ''} 
                      onChange={(e) => handleTextChange(e.target.value)}
                      disabled={isTextLocked}
                      placeholder={isTextLocked ? "El contenido del texto no se puede editar debido a código dinámico..." : "Escribe el contenido del texto..."}
                    />
                  </div>
                </div>
              )}

              {/* Spacing (Padding/Margin) */}
              <div className="inspector-section">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Espaciado (Padding & Margin)
                  {isClassNameLocked && (
                    <span className="lock-tooltip-container">
                      <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                      <span className="tooltip-text">Estilos bloqueados: className contiene código dinámico.</span>
                    </span>
                  )}
                </h3>
                
                <div className="input-grid" style={{ marginBottom: '0.75rem' }}>
                  <div className="input-group">
                    <label>Padding (General)</label>
                    <select 
                      className="select-field" 
                      value={parsedClasses.padding} 
                      disabled={isClassNameLocked}
                      onChange={(e) => handleStyleChange('padding', e.target.value)}
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
                    >
                      <option value="">Defecto</option>
                      {['py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8', 'py-10', 'py-12', 'py-16'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Background & Borders */}
              <div className="inspector-section">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Color de Fondo y Bordes
                  {isClassNameLocked && (
                    <span className="lock-tooltip-container">
                      <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                      <span className="tooltip-text">Estilos bloqueados: className contiene código dinámico.</span>
                    </span>
                  )}
                </h3>
                
                <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                  <label>Color de Fondo (Tailwind)</label>
                  <select 
                    className="select-field" 
                    value={parsedClasses.bg} 
                    disabled={isClassNameLocked}
                    onChange={(e) => handleStyleChange('bg', e.target.value)}
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
                    >
                      <option value="">Sin Borde</option>
                      {['border-0', 'border', 'border-2', 'border-4', 'border-8'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="inspector-section">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Tipografía
                  {isClassNameLocked && (
                    <span className="lock-tooltip-container">
                      <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                      <span className="tooltip-text">Estilos bloqueados: className contiene código dinámico.</span>
                    </span>
                  )}
                </h3>
                
                <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                  <label>Color de Texto</label>
                  <select 
                    className="select-field" 
                    value={parsedClasses.textColor} 
                    disabled={isClassNameLocked}
                    onChange={(e) => handleStyleChange('textColor', e.target.value)}
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
                    >
                      <option value="">Defecto</option>
                      {['font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-black'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Flexbox / Grid Layout */}
              <div className="inspector-section">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Disposición (Layout)
                  {isClassNameLocked && (
                    <span className="lock-tooltip-container">
                      <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                      <span className="tooltip-text">Estilos bloqueados: className contiene código dinámico.</span>
                    </span>
                  )}
                </h3>
                
                <div className="input-grid" style={{ marginBottom: '0.75rem' }}>
                  <div className="input-group">
                    <label>Visualización</label>
                    <select 
                      className="select-field" 
                      value={parsedClasses.display} 
                      disabled={isClassNameLocked}
                      onChange={(e) => handleStyleChange('display', e.target.value)}
                    >
                      <option value="">Defecto</option>
                      {['block', 'flex', 'grid', 'inline-block', 'hidden'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Dirección Flex</label>
                    <select 
                      className="select-field" 
                      value={parsedClasses.flexDir} 
                      disabled={isClassNameLocked || parsedClasses.display !== 'flex'}
                      onChange={(e) => handleStyleChange('flexDir', e.target.value)}
                    >
                      <option value="">Defecto</option>
                      {['flex-row', 'flex-col', 'flex-row-reverse', 'flex-col-reverse'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-grid">
                  <div className="input-group">
                    <label>Alineación (Items)</label>
                    <select 
                      className="select-field" 
                      value={parsedClasses.alignItems} 
                      disabled={isClassNameLocked || (parsedClasses.display !== 'flex' && parsedClasses.display !== 'grid')}
                      onChange={(e) => handleStyleChange('alignItems', e.target.value)}
                    >
                      <option value="">Defecto</option>
                      {['items-start', 'items-center', 'items-end', 'items-stretch'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Espacio (Gap)</label>
                    <select 
                      className="select-field" 
                      value={parsedClasses.gap} 
                      disabled={isClassNameLocked || (parsedClasses.display !== 'flex' && parsedClasses.display !== 'grid')}
                      onChange={(e) => handleStyleChange('gap', e.target.value)}
                    >
                      <option value="">Ninguno</option>
                      {['gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8', 'gap-12'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Raw Classes */}
              <div className="inspector-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '140px' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Clases de Tailwind (Directo)
                  {isClassNameLocked && (
                    <span className="lock-tooltip-container">
                      <Lock size={12} style={{ color: 'var(--warning-color)' }} />
                      <span className="tooltip-text">Estilos bloqueados: className contiene código dinámico.</span>
                    </span>
                  )}
                </h3>
                <textarea 
                  className="class-textarea" 
                  value={selectedElement.className} 
                  onChange={handleRawClassChange}
                  disabled={isClassNameLocked}
                  style={{ flex: 1 }}
                  placeholder={isClassNameLocked ? "Las clases no se pueden editar debido a expresiones dinámicas..." : "Escribe clases personalizadas aquí..."}
                />
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
    </div>
  );
}
