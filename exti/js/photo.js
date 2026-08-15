/* js/photo.js — Photo Widget Module */
const Photo = {
  _el:  null,
  _img: null,
  _placeholder: null,
  _customWidth: null,
  _customHeight: null,

  async init(widgetData) {
    this._el          = document.getElementById('widget-photo');
    this._img         = document.getElementById('photo-widget-img');
    this._placeholder = document.getElementById('photo-widget-placeholder');

    if (!this._el) return;

    // Restore saved photo and size
    let savedUrl  = (await Storage.get('photoUrl'))  || '';
    if (savedUrl === 'indexeddb') {
      const blob = await MediaDB.getBlob('photoWidget');
      if (blob) savedUrl = URL.createObjectURL(blob);
    }
    const savedSize = (await Storage.get('photoSize')) || '1x1';

    // Load custom dimensions if any
    this._customWidth  = await Storage.get('photoCustomWidth');
    this._customHeight = await Storage.get('photoCustomHeight');

    this.setSize(savedSize);
    this.setPhoto(savedUrl);
  },

  _saveTimeout: null,
  saveCustomSizeDebounced(w, h) {
    this._customWidth  = w;
    this._customHeight = h;
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => {
      Storage.save('photoCustomWidth',  w);
      Storage.save('photoCustomHeight', h);
    }, 300);
  },

  setPhoto(url) {
    if (!this._el) return;
    if (url) {
      if (this._img)         { this._img.src = url; this._img.style.display = 'block'; }
      if (this._placeholder) this._placeholder.style.display = 'none';
    } else {
      if (this._img)         { this._img.src = ''; this._img.style.display = 'none'; }
      if (this._placeholder) this._placeholder.style.display = 'flex';
    }
  },

  setSize(size) {
    if (!this._el) return;
    // Remove any existing size class
    ['size-1x1', 'size-2x2', 'size-2x3', 'size-3x2', 'size-16x9', 'size-custom'].forEach(c => {
      this._el.classList.remove(c);
    });

    if (size === 'custom') {
      this._el.classList.add('size-custom');
      // Apply saved dimensions if any, otherwise default to a sensible starting size
      if (this._customWidth && this._customHeight) {
        this._el.style.width  = this._customWidth  + 'px';
        this._el.style.height = this._customHeight + 'px';
      } else {
        this._el.style.width  = '240px';
        this._el.style.height = '240px';
      }
      // If we're already in customize mode, re-enable the resize handle
      if (document.body.classList.contains('customize-mode') && typeof Drag !== 'undefined') {
        Drag.enablePhotoResize();
      }
    } else {
      this._el.classList.add(`size-${size}`);
      // Clear inline width and height so standard sizes apply via CSS
      this._el.style.width  = '';
      this._el.style.height = '';
      // Disable resize handle for non-custom sizes
      if (typeof Drag !== 'undefined') Drag.disablePhotoResize();
    }
  },
};
