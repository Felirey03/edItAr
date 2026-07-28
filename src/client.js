// This script runs inside the Next.js preview page
(function() {
  if (window.__visualdev_injected) return;
  window.__visualdev_injected = true;

  console.log('[VisualDev Client] Injected successfully.');

  let selectedElement = null;
  let hoverElement = null;
  let currentMode = 'edit';

  // Origin Handshake state
  let allowedParentOrigin = new URLSearchParams(window.location.search).get('parentOrigin') || null;

  function postToParent(msg) {
    try {
      if (window.parent && window.parent !== window) {
        const targetOrigin = allowedParentOrigin || '*';
        window.parent.postMessage(msg, targetOrigin);
      }
    } catch (err) {
      // Ignore cross-origin errors
    }
  }

  // Create overlay borders for hover and selection
  const hoverOutline = document.createElement('div');
  hoverOutline.style.position = 'absolute';
  hoverOutline.style.border = '1px solid rgba(37, 99, 235, 0.35)';
  hoverOutline.style.pointerEvents = 'none';
  hoverOutline.style.zIndex = '999999';
  hoverOutline.style.transition = 'all 0.1s ease';
  hoverOutline.style.display = 'none';
  document.body.appendChild(hoverOutline);

  const selectOutline = document.createElement('div');
  selectOutline.style.position = 'absolute';
  selectOutline.style.border = '2px solid #2563eb';
  selectOutline.style.pointerEvents = 'none';
  selectOutline.style.zIndex = '999998';
  selectOutline.style.display = 'none';
  document.body.appendChild(selectOutline);

  // Label for selected element
  const selectLabel = document.createElement('div');
  selectLabel.style.position = 'absolute';
  selectLabel.style.background = '#2563eb';
  selectLabel.style.color = '#fff';
  selectLabel.style.fontSize = '10px';
  selectLabel.style.padding = '2px 6px';
  selectLabel.style.borderRadius = '3px';
  selectLabel.style.pointerEvents = 'none';
  selectLabel.style.zIndex = '999999';
  selectLabel.style.display = 'none';
  document.body.appendChild(selectLabel);

  function updateOutline(element, outline, label = null) {
    if (!element) {
      outline.style.display = 'none';
      if (label) label.style.display = 'none';
      return;
    }
    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Offset outline slightly outside the element so we don't cover it
    outline.style.left = `${rect.left + scrollX - 4}px`;
    outline.style.top = `${rect.top + scrollY - 4}px`;
    outline.style.width = `${rect.width + 8}px`;
    outline.style.height = `${rect.height + 8}px`;
    outline.style.backgroundColor = 'transparent';
    outline.style.display = 'block';

    if (label) {
      const sourceLoc = element.getAttribute('data-source-loc') || '';
      const filename = sourceLoc.split(':')[0].split('/').pop() || element.tagName.toLowerCase();
      label.textContent = `${element.tagName.toLowerCase()} (${filename})`;
      
      // Place label below if the element is at the very top of the page
      const labelOffset = (rect.top > 25) ? -22 : (rect.height + 6);
      label.style.left = `${rect.left + scrollX}px`;
      label.style.top = `${rect.top + scrollY + labelOffset}px`;
      label.style.display = 'block';
    }
  }

  function notifyUrlChanged() {
    postToParent({
      type: 'VISUALDEV_URL_CHANGED',
      url: window.location.href
    });
  }

  // Patch history methods safely
  if (window.history) {
    if (typeof window.history.pushState === 'function' && !window.history.pushState.__visualdev_patched) {
      const origPushState = window.history.pushState;
      window.history.pushState = function(...args) {
        const result = origPushState.apply(this, args);
        notifyUrlChanged();
        return result;
      };
      window.history.pushState.__visualdev_patched = true;
    }

    if (typeof window.history.replaceState === 'function' && !window.history.replaceState.__visualdev_patched) {
      const origReplaceState = window.history.replaceState;
      window.history.replaceState = function(...args) {
        const result = origReplaceState.apply(this, args);
        notifyUrlChanged();
        return result;
      };
      window.history.replaceState.__visualdev_patched = true;
    }
  }

  window.addEventListener('popstate', notifyUrlChanged);
  window.addEventListener('hashchange', notifyUrlChanged);

  // Monitor mouse movements for hover styling
  document.addEventListener('mouseover', (e) => {
    if (currentMode === 'navigate') {
      hoverOutline.style.display = 'none';
      return;
    }
    let el = e.target;
    // Find closest element with data-source-loc
    while (el && el !== document.body) {
      if (el.getAttribute('data-source-loc')) {
        hoverElement = el;
        updateOutline(hoverElement, hoverOutline);
        return;
      }
      el = el.parentElement;
    }
    hoverOutline.style.display = 'none';
  }, true);

  // Disable pointer events on links/buttons to prevent navigating away during editing
  document.addEventListener('click', (e) => {
    if (currentMode === 'navigate') {
      return;
    }
    let el = e.target;
    while (el && el !== document.body) {
      const sourceLoc = el.getAttribute('data-source-loc');
      if (sourceLoc) {
        e.preventDefault();
        e.stopPropagation();

        selectedElement = el;
        updateOutline(selectedElement, selectOutline, selectLabel);

        const instanceIndex = Math.max(0, Array.from(document.querySelectorAll('[data-source-loc="' + sourceLoc + '"]')).indexOf(el));

        // Build ancestors list
        const ancestors = [];
        let curr = el;
        while (curr && curr !== document.body) {
          const loc = curr.getAttribute('data-source-loc');
          ancestors.unshift({
            tagName: curr.tagName.toLowerCase(),
            sourceLoc: loc || '',
            className: curr.className || '',
            id: curr.id || ''
          });
          curr = curr.parentElement;
        }

        const rect = el.getBoundingClientRect();

        // Send message to parent window (Editor App)
        postToParent({
          type: 'VISUALDEV_SELECT_ELEMENT',
          sourceLoc: sourceLoc,
          instanceIndex: instanceIndex,
          className: el.className || '',
          tagName: el.tagName.toLowerCase(),
          text: el.innerText || '',
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          ancestors: ancestors,
          styles: {
            backgroundColor: window.getComputedStyle(el).backgroundColor,
            color: window.getComputedStyle(el).color,
          }
        });
        return;
      }
      el = el.parentElement;
    }
  }, true);

  // Sync positions on scroll or resize
  window.addEventListener('scroll', () => {
    if (currentMode === 'navigate') return;
    updateOutline(hoverElement, hoverOutline);
    updateOutline(selectedElement, selectOutline, selectLabel);
  });
  window.addEventListener('resize', () => {
    if (currentMode === 'navigate') return;
    updateOutline(hoverElement, hoverOutline);
    updateOutline(selectedElement, selectOutline, selectLabel);
  });

  // Forward keydown events to parent window (Escape, Undo/Redo)
  document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    if (
      activeEl &&
      (activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable)
    ) {
      if (e.key === 'Escape') {
        activeEl.blur();
      }
      return;
    }

    if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y'))) {
      postToParent({
        type: 'VISUALDEV_KEY_DOWN',
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey
      });
    }
  });

  // Listen for updates from the Editor App
  window.addEventListener('message', (e) => {
    if (!e.data) return;

    // Process Handshake INIT
    if (e.data.type === 'VISUALDEV_INIT') {
      if (e.data.parentOrigin) {
        allowedParentOrigin = e.data.parentOrigin;
      }
      return;
    }

    // Validate origin if allowedParentOrigin is set
    if (allowedParentOrigin && e.origin !== allowedParentOrigin) {
      return;
    }

    if (e.data.type === 'VISUALDEV_SET_MODE') {
      currentMode = e.data.mode || 'edit';
      if (currentMode === 'navigate') {
        hoverOutline.style.display = 'none';
        selectOutline.style.display = 'none';
        selectLabel.style.display = 'none';
        hoverElement = null;
        selectedElement = null;
      }
    } else if (e.data.type === 'VISUALDEV_CLEAR_SELECTION') {
      selectedElement = null;
      updateOutline(null, selectOutline, selectLabel);
    } else if (e.data.type === 'VISUALDEV_UPDATE_CLASSNAME') {
      const { sourceLoc, instanceIndex, className } = e.data;
      const matches = document.querySelectorAll('[data-source-loc="' + sourceLoc + '"]');
      const el = matches[instanceIndex !== undefined ? instanceIndex : 0] || matches[0];
      if (el) {
        el.className = className;
        setTimeout(() => {
          if (currentMode !== 'navigate') {
            updateOutline(el, selectOutline, selectLabel);
          }
        }, 50);
      }
    } else if (e.data.type === 'VISUALDEV_UPDATE_TEXT') {
      const { sourceLoc, text } = e.data;
      const el = document.querySelector(`[data-source-loc="${sourceLoc}"]`);
      if (el) {
        el.innerText = text;
        setTimeout(() => {
          if (currentMode !== 'navigate') {
            updateOutline(el, selectOutline, selectLabel);
          }
        }, 50);
      }
    } else if (e.data.type === 'VISUALDEV_FORCE_SELECT') {
      const { sourceLoc, instanceIndex } = e.data;
      const matches = document.querySelectorAll('[data-source-loc="' + sourceLoc + '"]');
      const targetEl = matches[instanceIndex !== undefined ? instanceIndex : 0] || matches[0];
      if (targetEl) {
        selectedElement = targetEl;
        if (currentMode !== 'navigate') {
          updateOutline(selectedElement, selectOutline, selectLabel);
        }

        // Re-build ancestors
        const ancestors = [];
        let curr = selectedElement;
        while (curr && curr !== document.body) {
          const loc = curr.getAttribute('data-source-loc');
          ancestors.unshift({
            tagName: curr.tagName.toLowerCase(),
            sourceLoc: loc || '',
            className: curr.className || '',
            id: curr.id || ''
          });
          curr = curr.parentElement;
        }
        
        const rect = selectedElement.getBoundingClientRect();
        const targetIndex = Math.max(0, Array.from(document.querySelectorAll('[data-source-loc="' + sourceLoc + '"]')).indexOf(selectedElement));

        postToParent({
          type: 'VISUALDEV_SELECT_ELEMENT',
          sourceLoc: sourceLoc,
          instanceIndex: targetIndex,
          className: selectedElement.className || '',
          tagName: selectedElement.tagName.toLowerCase(),
          text: selectedElement.innerText || '',
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          },
          ancestors: ancestors,
          styles: {
            backgroundColor: window.getComputedStyle(selectedElement).backgroundColor,
            color: window.getComputedStyle(selectedElement).color,
          }
        });
      }
    }
  });
})();
