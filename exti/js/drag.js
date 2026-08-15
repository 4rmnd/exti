/* js/drag.js — Drag & Drop system */
const Drag = {
  _handlers: [], // [{ handle, onDown }] — kept to allow clean removeEventListener
  _resizeHandler: null, // photo resize handler ref

  // Apply a saved (x, y) position to a widget element
  applyPosition(el, x, y) {
    if (x != null && y != null) {
      el.style.position  = 'fixed';
      el.style.left       = x + 'px';
      el.style.top        = y + 'px';
      el.style.right      = 'auto';
      el.style.bottom     = 'auto';
      el.style.transform  = 'none';
    }
  },

  // Enable dragging on all visible draggable widgets (exclude quicklinks — it's pinned)
  enableAll() {
    this.disableAll(); // ensure no double-binding
    const widgets = document.querySelectorAll(
      '#widget-container > .widget:not(.widget-quicklinks):not(.hidden)'
    );
    widgets.forEach(el => {
      const handle = el.querySelector('.drag-handle') || el;

      const onDown = (e) => {
        if (['INPUT','BUTTON','TEXTAREA','SELECT','A'].includes(e.target.tagName)) return;
        // Don't start drag if clicking the resize handle
        if (e.target.closest('.photo-resize-handle')) return;
        e.preventDefault();

        const rect   = el.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        el.style.position = 'fixed';
        el.classList.add('dragging');

        const onMove = (mv) => {
          let x = mv.clientX - offsetX;
          let y = mv.clientY - offsetY;
          const w = el.offsetWidth, h = el.offsetHeight;
          x = Math.max(0, Math.min(window.innerWidth  - w, x));
          y = Math.max(0, Math.min(window.innerHeight - h, y));
          el.style.left      = x + 'px';
          el.style.top       = y + 'px';
          el.style.right     = 'auto';
          el.style.bottom    = 'auto';
          el.style.transform = 'none';
        };

        const onUp = () => {
          el.classList.remove('dragging');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup',  onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',  onUp);
      };

      handle.addEventListener('mousedown', onDown);
      this._handlers.push({ handle, onDown });
    });

    // Also enable the photo resize handle if visible
    this.enablePhotoResize();
  },

  // Remove all drag handlers (called when exiting customize mode)
  disableAll() {
    this._handlers.forEach(({ handle, onDown }) => {
      handle.removeEventListener('mousedown', onDown);
    });
    this._handlers = [];
    this.disablePhotoResize();
  },

  // ── PHOTO WIDGET RESIZE ────────────────────────────────────────────────────
  enablePhotoResize() {
    this.disablePhotoResize(); // avoid double-binding

    const el     = document.getElementById('widget-photo');
    const handle = document.getElementById('photo-resize-handle');
    if (!el || !handle) return;
    if (!el.classList.contains('size-custom')) return;

    const onDown = (e) => {
      e.preventDefault();
      e.stopPropagation(); // don't bubble to the drag handler

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;

      const onMove = (mv) => {
        const newW = Math.max(100, startW + (mv.clientX - startX));
        const newH = Math.max(100, startH + (mv.clientY - startY));
        // Clamp to viewport
        const rect = el.getBoundingClientRect();
        const maxW = window.innerWidth  - rect.left;
        const maxH = window.innerHeight - rect.top;
        el.style.width  = Math.min(newW, maxW) + 'px';
        el.style.height = Math.min(newH, maxH) + 'px';
      };

      const onUp = () => {
        // Persist the new size
        if (typeof Photo !== 'undefined') {
          Photo.saveCustomSizeDebounced(el.offsetWidth, el.offsetHeight);
        }
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    };

    handle.addEventListener('mousedown', onDown);
    this._resizeHandler = { handle, onDown };
  },

  disablePhotoResize() {
    if (this._resizeHandler) {
      const { handle, onDown } = this._resizeHandler;
      handle.removeEventListener('mousedown', onDown);
      this._resizeHandler = null;
    }
  },

  // Read current rendered positions of all draggable widgets
  collectPositions() {
    const positions = {};
    const widgets = document.querySelectorAll(
      '#widget-container > .widget:not(.widget-quicklinks)'
    );
    widgets.forEach(el => {
      const name = el.dataset.widget;
      if (!name) return;
      // Only record if user actually moved it (inline style set) or it has a CSS position
      const rect = el.getBoundingClientRect();
      if (el.style.left || el.style.top) {
        positions[name] = { x: Math.round(rect.left), y: Math.round(rect.top) };
      }
    });
    return positions;
  }
};
