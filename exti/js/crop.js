/* js/crop.js — Image Crop Modal (pure vanilla JS, no dependencies) */
const Crop = {
  _canvas:    null,
  _ctx:       null,
  _img:       null,
  _onConfirm: null,
  _animFrame: null,
  _dirty:     false,

  // Image transform state
  _panX:     0,
  _panY:     0,
  _zoom:     1,
  _rotation: 0, // degrees: 0 | 90 | 180 | 270

  // Crop rectangle in canvas-pixel coordinates
  _crop: { x: 0, y: 0, w: 0, h: 0 },

  // Active drag: null | { type, startMX, startMY, ...snapshot }
  _drag: null,

  MIN_CROP:    50,
  HANDLE_SIZE: 10,

  // ── PUBLIC API ────────────────────────────────────────────────────────────

  /** Call this after a file is selected. `callback(croppedDataUrl)` fires on confirm. */
  open(url, callback) {
    this._onConfirm = callback;
    const img = new Image();
    img.onload = () => {
      this._img = img;
      this._showModal();
    };
    img.onerror = () => console.error('[Crop] failed to load image');
    img.src = url;
  },

  close() {
    this._stopRenderLoop();
    const modal = document.getElementById('crop-modal');
    if (!modal) return;
    modal.classList.add('crop-modal--hiding');
    setTimeout(() => {
      modal.classList.remove('crop-modal--visible', 'crop-modal--hiding');
    }, 300);
  },

  // ── MODAL LIFECYCLE ───────────────────────────────────────────────────────

  _showModal() {
    const modal     = document.getElementById('crop-modal');
    const container = document.getElementById('crop-canvas-container');
    this._canvas    = document.getElementById('crop-canvas');
    if (!modal || !this._canvas || !container) return;

    modal.classList.add('crop-modal--visible');

    // Canvas must be sized AFTER layout so offsetWidth is valid
    requestAnimationFrame(() => {
      const rect = container.getBoundingClientRect();
      this._canvas.width  = Math.round(rect.width)  || window.innerWidth;
      this._canvas.height = Math.round(rect.height) || window.innerHeight - 110;
      this._ctx = this._canvas.getContext('2d');
      this._reset();
      this._startRenderLoop();
    });
  },

  _getImageBounds() {
    if (!this._img || !this._canvas) return { left: 0, top: 0, right: 0, bottom: 0 };
    const isRotated = this._rotation % 180 !== 0;
    const rw = (isRotated ? this._img.naturalHeight : this._img.naturalWidth) * this._zoom;
    const rh = (isRotated ? this._img.naturalWidth : this._img.naturalHeight) * this._zoom;
    
    const cx = this._canvas.width / 2 + this._panX;
    const cy = this._canvas.height / 2 + this._panY;
    
    return {
      left: cx - rw / 2,
      top: cy - rh / 2,
      right: cx + rw / 2,
      bottom: cy + rh / 2
    };
  },

  _clampCropToBounds() {
    const bounds = this._getImageBounds();
    const minX = Math.max(0, bounds.left);
    const minY = Math.max(0, bounds.top);
    const maxX = Math.min(this._canvas.width, bounds.right);
    const maxY = Math.min(this._canvas.height, bounds.bottom);

    let { x, y, w, h } = this._crop;
    
    if (w > maxX - minX) w = maxX - minX;
    if (h > maxY - minY) h = maxY - minY;
    
    if (x < minX) x = minX;
    if (y < minY) y = minY;
    if (x + w > maxX) x = maxX - w;
    if (y + h > maxY) y = maxY - h;
    
    // Ensure minimum size
    w = Math.max(this.MIN_CROP, w);
    h = Math.max(this.MIN_CROP, h);
    
    this._crop = { x, y, w, h };
  },

  _reset() {
    const cw = this._canvas.width,  ch = this._canvas.height;
    const iw = this._img.naturalWidth, ih = this._img.naturalHeight;

    // Fit image with 10% padding on each side
    this._zoom     = Math.min((cw * 0.82) / iw, (ch * 0.82) / ih);
    this._panX     = 0;
    this._panY     = 0;
    this._rotation = 0;

    const bounds = this._getImageBounds();
    const bWidth = bounds.right - bounds.left;
    const bHeight = bounds.bottom - bounds.top;

    // Default crop box: centre 65% of canvas, clamped to image size
    const cropW = Math.max(this.MIN_CROP, Math.min(Math.round(cw * 0.65), bWidth));
    const cropH = Math.max(this.MIN_CROP, Math.min(Math.round(ch * 0.65), bHeight));

    this._crop = {
      x: bounds.left + (bWidth - cropW) / 2,
      y: bounds.top + (bHeight - cropH) / 2,
      w: cropW,
      h: cropH,
    };
    this._dirty = true;
  },

  // ── RENDER LOOP ───────────────────────────────────────────────────────────

  _startRenderLoop() {
    const loop = () => {
      if (this._dirty) { this._draw(); this._dirty = false; }
      this._animFrame = requestAnimationFrame(loop);
    };
    this._animFrame = requestAnimationFrame(loop);
  },

  _stopRenderLoop() {
    if (this._animFrame) { cancelAnimationFrame(this._animFrame); this._animFrame = null; }
  },

  _draw() {
    const canvas = this._canvas, ctx = this._ctx;
    const { x, y, w, h } = this._crop;
    const cw = canvas.width, ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // 1 ── Draw image with pan / zoom / rotate
    ctx.save();
    ctx.translate(cw / 2 + this._panX, ch / 2 + this._panY);
    ctx.rotate(this._rotation * Math.PI / 180);
    ctx.scale(this._zoom, this._zoom);
    ctx.drawImage(this._img, -this._img.naturalWidth / 2, -this._img.naturalHeight / 2);
    ctx.restore();

    // 2 ── Dim four rectangles around the crop box (no compositing needed)
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.fillRect(0, 0,     cw,    y);           // top
    ctx.fillRect(0, y + h, cw,    ch - y - h);  // bottom
    ctx.fillRect(0, y,     x,     h);            // left
    ctx.fillRect(x + w, y, cw - x - w, h);      // right
    ctx.restore();

    // 3 ── Crop border
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);

    // 4 ── Rule-of-thirds grid
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const gx = x + w * i / 3, gy = y + h * i / 3;
      ctx.beginPath(); ctx.moveTo(gx, y);   ctx.lineTo(gx, y + h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, gy);   ctx.lineTo(x + w, gy); ctx.stroke();
    }

    // 5 ── Corner / edge handles (filled squares, subtle shadow)
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur  = 4;
    ctx.fillStyle   = '#ffffff';
    this._getHandleRects().forEach(hr => ctx.fillRect(hr.x, hr.y, hr.w, hr.h));
    ctx.restore();
  },

  // ── HANDLE GEOMETRY ───────────────────────────────────────────────────────

  _getHandleRects() {
    const { x, y, w, h } = this._crop;
    const hs = this.HANDLE_SIZE, hh = Math.floor(hs / 2);
    const cx = x + Math.floor(w / 2), cy = y + Math.floor(h / 2);
    return [
      { id: 'nw', x: x - hh,     y: y - hh     },
      { id: 'ne', x: x + w - hh, y: y - hh     },
      { id: 'sw', x: x - hh,     y: y + h - hh },
      { id: 'se', x: x + w - hh, y: y + h - hh },
      { id: 'n',  x: cx - hh,    y: y - hh     },
      { id: 's',  x: cx - hh,    y: y + h - hh },
      { id: 'w',  x: x - hh,     y: cy - hh    },
      { id: 'e',  x: x + w - hh, y: cy - hh    },
    ].map(r => ({ ...r, w: hs, h: hs }));
  },

  _hitTestHandle(mx, my) {
    const pad = 6;
    for (const hr of this._getHandleRects()) {
      if (mx >= hr.x - pad && mx <= hr.x + hr.w + pad &&
          my >= hr.y - pad && my <= hr.y + hr.h + pad) return hr.id;
    }
    return null;
  },

  _insideCrop(mx, my) {
    const { x, y, w, h } = this._crop;
    return mx > x && mx < x + w && my > y && my < y + h;
  },

  // ── MOUSE EVENTS ──────────────────────────────────────────────────────────

  _onMouseDown(e) {
    const rect = this._canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    const handle = this._hitTestHandle(mx, my);
    if (handle) {
      this._drag = { type: 'handle', handle, startMX: mx, startMY: my, startCrop: { ...this._crop } };
      return;
    }
    if (this._insideCrop(mx, my)) {
      this._drag = { type: 'move', startMX: mx, startMY: my, startCrop: { ...this._crop } };
      return;
    }
    this._drag = { type: 'pan', startMX: mx, startMY: my, startPanX: this._panX, startPanY: this._panY };
    this._canvas.style.cursor = 'grabbing';
  },

  _onMouseMove(e) {
    if (!this._drag) {
      // Update cursor only
      const rect = this._canvas.getBoundingClientRect();
      this._updateCursor(e.clientX - rect.left, e.clientY - rect.top);
      return;
    }

    const rect = this._canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const dx = mx - this._drag.startMX, dy = my - this._drag.startMY;
    const cw = this._canvas.width, ch = this._canvas.height;
    const MIN = this.MIN_CROP;

    if (this._drag.type === 'pan') {
      this._panX = this._drag.startPanX + dx;
      this._panY = this._drag.startPanY + dy;

    } else if (this._drag.type === 'move') {
      const sc = this._drag.startCrop;
      this._crop.x = Math.max(0, Math.min(cw - sc.w, sc.x + dx));
      this._crop.y = Math.max(0, Math.min(ch - sc.h, sc.y + dy));

    } else if (this._drag.type === 'handle') {
      const sc = this._drag.startCrop;
      let { x, y, w, h } = sc;
      const id = this._drag.handle;

      if (id.includes('e')) w = Math.max(MIN, w + dx);
      if (id.includes('s')) h = Math.max(MIN, h + dy);
      if (id.includes('w')) { const nw = Math.max(MIN, w - dx); x += w - nw; w = nw; }
      if (id.includes('n')) { const nh = Math.max(MIN, h - dy); y += h - nh; h = nh; }

      this._crop = { x, y, w, h };
    }
    
    this._clampCropToBounds();
    this._dirty = true;
  },

  _onMouseUp() {
    this._drag = null;
  },

  _onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    this._zoom = Math.max(0.05, Math.min(20, this._zoom * factor));
    this._clampCropToBounds();
    this._dirty = true;
  },

  _updateCursor(mx, my) {
    const cursorMap = {
      nw: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', se: 'nwse-resize',
      n: 'ns-resize', s: 'ns-resize', w: 'ew-resize', e: 'ew-resize',
    };
    const h = this._hitTestHandle(mx, my);
    if (h) this._canvas.style.cursor = cursorMap[h];
    else if (this._insideCrop(mx, my)) this._canvas.style.cursor = 'move';
    else this._canvas.style.cursor = 'grab';
  },

  // ── TOOLBAR ACTIONS ───────────────────────────────────────────────────────

  rotate(deg) {
    this._rotation = (this._rotation + deg + 360) % 360;
    this._clampCropToBounds();
    this._dirty = true;
  },

  zoomIn()   { 
    this._zoom = Math.min(20, this._zoom * 1.2); 
    this._clampCropToBounds();
    this._dirty = true; 
  },
  zoomOut()  { 
    this._zoom = Math.max(0.05, this._zoom / 1.2); 
    this._clampCropToBounds();
    this._dirty = true; 
  },

  resetView() {
    this._reset();
  },

  // ── CONFIRM / OUTPUT ──────────────────────────────────────────────────────

  confirm() {
    const { x, y, w, h } = this._crop;
    if (w < 1 || h < 1) return;

    const offscreen = document.createElement('canvas');
    offscreen.width  = Math.round(w);
    offscreen.height = Math.round(h);
    const ctx = offscreen.getContext('2d');

    // Apply same transform as the main canvas, but offset so the crop origin → (0, 0)
    ctx.translate(
      this._canvas.width  / 2 + this._panX - x,
      this._canvas.height / 2 + this._panY - y
    );
    ctx.rotate(this._rotation * Math.PI / 180);
    ctx.scale(this._zoom, this._zoom);
    ctx.drawImage(this._img, -this._img.naturalWidth / 2, -this._img.naturalHeight / 2);

    const result = offscreen.toDataURL('image/jpeg', 0.95);
    this.close();
    if (this._onConfirm) this._onConfirm(result);
  },

  // ── INIT — BIND LISTENERS ─────────────────────────────────────────────────

  setupListeners() {
    const canvas = document.getElementById('crop-canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', e => this._onMouseDown(e));
    // Global move & up so drag works even when pointer leaves canvas
    document.addEventListener('mousemove', e => {
      if (!document.getElementById('crop-modal')?.classList.contains('crop-modal--visible')) return;
      const onCanvas = e.target === this._canvas || !!this._drag;
      if (onCanvas) this._onMouseMove(e);
    });
    document.addEventListener('mouseup', () => this._onMouseUp());
    canvas.addEventListener('wheel', e => this._onWheel(e), { passive: false });

    document.getElementById('crop-confirm')  ?.addEventListener('click', () => this.confirm());
    document.getElementById('crop-cancel')   ?.addEventListener('click', () => this.close());
    document.getElementById('crop-rotate-l') ?.addEventListener('click', () => this.rotate(-90));
    document.getElementById('crop-rotate-r') ?.addEventListener('click', () => this.rotate(90));
    document.getElementById('crop-zoom-in')  ?.addEventListener('click', () => this.zoomIn());
    document.getElementById('crop-zoom-out') ?.addEventListener('click', () => this.zoomOut());
    document.getElementById('crop-reset')    ?.addEventListener('click', () => this.resetView());
  },
};

document.addEventListener('DOMContentLoaded', () => Crop.setupListeners());
