/* js/storage.js — Chrome Storage helper with localStorage fallback */
const MediaDB = {
  dbName: 'ExtiMediaDB',
  storeName: 'media',
  version: 1,

  async _getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  },

  async saveBlob(key, blob) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(blob, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getBlob(key) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteBlob(key) {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clearAll() {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

const Storage = {
  DEFAULT_DATA: {
    wallpaperPreset: 'liquid-chrome',
    wallpaperCustomUrl: '',
    widgets: {
      clock:      { visible: true, x: null, y: null },
      quicklinks: { visible: true, x: null, y: null },
      greeting:   { visible: true, x: null, y: null },
      todo:       { visible: true, x: null, y: null },
      notes:      { visible: true, x: null, y: null },
      pomodoro:   { visible: true, x: null, y: null },
      photo:      { visible: false, x: null, y: null },
    },
    clockFormat: '24h',
    clockLang: 'en',
    appLang: 'en',
    quickLinks: [
      { id: '1', name: 'YouTube',  url: 'https://youtube.com' },
      { id: '2', name: 'Gmail',    url: 'https://gmail.com' },
      { id: '3', name: 'GitHub',   url: 'https://github.com' },
      { id: '4', name: 'Google',   url: 'https://google.com' },
      { id: '5', name: 'Twitter',  url: 'https://twitter.com' },
    ],
    greetingName: '',
    greetingLang: 'en',
    todos: [],
    notesContent: '',
    pomodoroWork: 25,
    pomodoroBreak: 5,
    pomodoroAutoStart: false,
    pomodoroSessions: 0,
    photoUrl: '',
    photoSize: '1x1',
  },

  _useChrome() {
    return typeof chrome !== 'undefined' && chrome.storage;
  },

  async loadAll() {
    return new Promise((resolve) => {
      if (this._useChrome()) {
        chrome.storage.local.get(null, (raw) => {
          const d = { ...this.DEFAULT_DATA };
          Object.keys(raw).forEach(k => {
            if (k === 'widgets') {
              d.widgets = { ...this.DEFAULT_DATA.widgets };
              Object.keys(raw.widgets).forEach(w => {
                d.widgets[w] = { ...this.DEFAULT_DATA.widgets[w], ...raw.widgets[w] };
              });
            } else {
              d[k] = raw[k];
            }
          });
          resolve(d);
        });
      } else {
        try {
          const raw = JSON.parse(localStorage.getItem('exti') || '{}');
          const d = { ...this.DEFAULT_DATA };
          Object.keys(raw).forEach(k => {
            if (k === 'widgets') {
              d.widgets = { ...this.DEFAULT_DATA.widgets };
              Object.keys(raw.widgets || {}).forEach(w => {
                d.widgets[w] = { ...this.DEFAULT_DATA.widgets[w], ...raw.widgets[w] };
              });
            } else {
              d[k] = raw[k];
            }
          });
          resolve(d);
        } catch { resolve({ ...this.DEFAULT_DATA }); }
      }
    });
  },

  async save(key, value) {
    return new Promise((resolve) => {
      if (this._useChrome()) {
        chrome.storage.local.set({ [key]: value }, resolve);
      } else {
        try {
          const d = JSON.parse(localStorage.getItem('exti') || '{}');
          d[key] = value;
          localStorage.setItem('exti', JSON.stringify(d));
        } catch {}
        resolve();
      }
    });
  },

  async get(key) {
    return new Promise((resolve) => {
      if (this._useChrome()) {
        chrome.storage.local.get([key], (d) => resolve(d[key]));
      } else {
        try {
          const d = JSON.parse(localStorage.getItem('exti') || '{}');
          resolve(d[key]);
        } catch { resolve(undefined); }
      }
    });
  },

  async saveWidgetPosition(name, x, y) {
    const widgets = (await this.get('widgets')) || { ...this.DEFAULT_DATA.widgets };
    if (!widgets[name]) widgets[name] = {};
    widgets[name].x = Math.round(x);
    widgets[name].y = Math.round(y);
    await this.save('widgets', widgets);
  },

  async setWidgetVisible(name, visible) {
    const widgets = (await this.get('widgets')) || { ...this.DEFAULT_DATA.widgets };
    if (!widgets[name]) widgets[name] = {};
    widgets[name].visible = visible;
    await this.save('widgets', widgets);
  },

  async clearAll() {
    try { await MediaDB.clearAll(); } catch(e) { console.error('Failed to clear MediaDB', e); }
    return new Promise((resolve) => {
      if (this._useChrome()) {
        chrome.storage.local.clear(resolve);
      } else {
        localStorage.removeItem('exti');
        resolve();
      }
    });
  }
};
