/* js/quicklinks.js — Quick Links widget */
const QuickLinks = {
  el: null,
  links: [],
  newTab: true,

  init(links = [], newTab = true, pos = {}) {
    this.el    = document.getElementById('widget-quicklinks');
    this.links = links;
    this.newTab = newTab;
    this.render();

    document.getElementById('quicklinks-add-btn').addEventListener('click', () => {
      QuickLinks.openModal();
    });
    this._initModal();
  },

  render() {
    const bar = document.getElementById('quicklinks-bar');
    bar.innerHTML = '';
    this.links.forEach(link => {
      const a = document.createElement('a');
      a.className    = 'quicklink-item';
      a.href         = link.url;
      a.target       = this.newTab ? '_blank' : '_self';
      if (this.newTab) a.rel = 'noopener noreferrer';
      a.dataset.id   = link.id;

      a.title        = link.name;

      const iconEl = document.createElement('div');
      iconEl.className = 'quicklink-icon';

      if (link.icon && link.icon.startsWith('data:image')) {
        const img = document.createElement('img');
        img.src = link.icon;
        img.alt = link.name;
        iconEl.appendChild(img);
      } else if (link.id && link.id.length < 5) {
        // Default extension links use favicon
        const img = document.createElement('img');
        try {
          let iconUrl = link.url;
          if (iconUrl.includes('gmail.com')) {
            iconUrl = 'https://mail.google.com';
          }
          if (iconUrl.includes('github.com')) {
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.585 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .33.225.705.825.585C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z"/></svg>');
            img.style.width = '24px';
            img.style.height = '24px';
            img.classList.add('icon-invert-on-hover');
          } else {
            img.src = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(iconUrl)}&size=64`;
          }
        } catch { img.src = ''; }
        img.alt = link.name;
        img.onerror = () => { iconEl.textContent = '🔗'; };
        iconEl.appendChild(img);
      } else {
        // Custom links fallback to initial
        const initial = link.name ? link.name.charAt(0).toUpperCase() : '?';
        iconEl.textContent = initial;
        iconEl.style.fontSize = '20px';
        iconEl.style.fontWeight = '600';
        iconEl.style.color = 'rgba(255,255,255,0.8)';
      }

      const nameEl = document.createElement('div');
      nameEl.className   = 'quicklink-name';
      nameEl.textContent = link.name;

      const tooltip = document.createElement('div');
      tooltip.className   = 'quicklink-tooltip';
      tooltip.textContent = link.name;

      a.appendChild(iconEl);
      a.appendChild(nameEl);
      a.appendChild(tooltip);
      bar.appendChild(a);
    });
  },

  openModal(editId = null) {
    const overlay = document.getElementById('modal-overlay');
    const nameI   = document.getElementById('modal-link-name');
    const urlI    = document.getElementById('modal-link-url');
    const iconI   = document.getElementById('modal-link-icon');
    const title   = document.querySelector('.modal-title');
    
    const lang = document.documentElement.getAttribute('lang') || 'en';

    if (editId) {
      const link = this.links.find(l => l.id === editId);
      if (link) {
        title.textContent = lang === 'id' ? 'Edit Link' : 'Edit Link';
        nameI.value = link.name;
        urlI.value  = link.url;
        iconI.value = ''; // File input cannot be set programmatically
        overlay.dataset.editId = editId;
      }
    } else {
      title.textContent = lang === 'id' ? 'Tambah Quick Link' : 'Add Quick Link';
      nameI.value = urlI.value = '';
      iconI.value = '';
      delete overlay.dataset.editId;
    }
    overlay.classList.remove('hidden');
    nameI.focus();
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  _initModal() {
    document.getElementById('modal-link-save').addEventListener('click', () => this._saveModal());
    document.getElementById('modal-link-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') this.closeModal();
    });
    document.getElementById('modal-link-url').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._saveModal();
    });
  },

  async _saveModal() {
    const overlay = document.getElementById('modal-overlay');
    const name = document.getElementById('modal-link-name').value.trim();
    let url    = document.getElementById('modal-link-url').value.trim();
    const iconInput = document.getElementById('modal-link-icon');
    if (!name || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const editId = overlay.dataset.editId;
    let icon = '';
    
    // Maintain old icon if editing and no new file selected
    if (editId) {
      const existing = this.links.find(l => l.id === editId);
      if (existing) icon = existing.icon || '';
    }

    const file = iconInput.files[0];
    if (file) {
      icon = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    if (editId) {
      const idx = this.links.findIndex(l => l.id === editId);
      if (idx !== -1) this.links[idx] = { ...this.links[idx], name, url, icon };
    } else {
      this.links.push({ id: Date.now().toString(), name, url, icon });
    }
    await Storage.save('quickLinks', this.links);
    this.render();
    this.closeModal();
    if (typeof Settings !== 'undefined') Settings.renderLinksList();
  },

  async deleteLink(id) {
    this.links = this.links.filter(l => l.id !== id);
    await Storage.save('quickLinks', this.links);
    this.render();
    if (typeof Settings !== 'undefined') Settings.renderLinksList();
  }
};
