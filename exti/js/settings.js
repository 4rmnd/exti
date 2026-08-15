// ── LAYOUT PRESET ────────────────────────────────────────────────────────────
// Positions as a fraction of viewport (matching the reference screenshot).
// quicklinks is excluded — it is pinned to bottom-center via CSS.
const LAYOUT_PRESET = {
  pomodoro: { xPct: 0.12, yPct: 0.29 }, // top-left quadrant
  clock: { xPct: 0.08, yPct: 0.75 }, // bottom-left
  greeting: { xPct: 0.67, yPct: 0.17 }, // top-right
  todo: { xPct: 0.77, yPct: 0.42 }, // right side, upper
  notes: { xPct: 0.77, yPct: 0.63 }, // right side, lower
  photo: { xPct: 0.08, yPct: 0.30 }, // left side, upper-mid
};

const Settings = {
  data: null,
  _customizeCard: null,    // which bento-card triggered customize mode
  _customizeState: null,   // callback to re-open that card on Done

  init(data) {
    this.data = data;

    // Bento Grid Settings Toggle
    const btn = document.getElementById('settings-btn');
    const bentoMenu = document.getElementById('settings-bento-menu');
    const container = document.querySelector('.settings-menu-container');


    // ── HORIZONTAL SCROLL: Convert vertical wheel → horizontal scroll ──────
    bentoMenu.addEventListener('wheel', (e) => {
      // Only intercept when the grid is visible and not expanded
      if (bentoMenu.classList.contains('hidden')) return;
      // If user explicitly uses horizontal scroll (trackpad), let it pass
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      bentoMenu.scrollLeft += e.deltaY;
    }, { passive: false });

    const widgetSlider = document.querySelector('.widget-tiles-slider');
    if (widgetSlider) {
      widgetSlider.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        e.preventDefault();
        e.stopPropagation();

        // Scroll exactly one slide's width left or right
        const scrollAmount = e.deltaY > 0 ? widgetSlider.clientWidth : -widgetSlider.clientWidth;
        widgetSlider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }, { passive: false });
    }

    // ── STATE MACHINE ──────────────────────────────────────────────────────
    // state: 'closed' | 'grid' | 'detail'
    let state = 'closed';
    const bentoCards = document.querySelectorAll('.bento-card');
    const backBtn = document.getElementById('bento-back-btn');
    let expandedCard = null, expandedCardParent = null, expandedCardSibling = null;

    // helpers
    const openGrid = () => {
      state = 'grid';
      container.classList.add('open');
      bentoMenu.classList.remove('hidden', 'has-expanded');
      // Re-enable transitions and make grid visible again
      bentoMenu.style.transition = '';
      bentoMenu.style.opacity = '';
      bentoMenu.style.visibility = '';
      bentoCards.forEach(c => c.classList.remove('expanded', 'expanded-fixed', 'collapsed'));
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
      btn.classList.add('active');
    };

    const closeAll = () => {
      state = 'closed';
      container.classList.remove('open');
      bentoMenu.classList.add('hidden');
      bentoMenu.classList.remove('has-expanded');
      // Reset any inline overrides
      bentoMenu.style.transition = '';
      bentoMenu.style.opacity = '';
      bentoMenu.style.visibility = '';
      bentoCards.forEach(c => c.classList.remove('expanded', 'expanded-fixed', 'collapsed'));
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
      btn.classList.remove('active');
      _restoreCard();
    };

    const openDetail = (card) => {
      state = 'detail';
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
      btn.classList.remove('active');

      // ── STEP 1: Kill transitions & hide grid INSTANTLY (0ms, no animation) ──
      // transition:none overrides the CSS 'transition: all 0.4s' rule so the
      // visibility/opacity change takes effect in the very next paint, not 400ms later.
      bentoMenu.style.transition = 'none';
      bentoMenu.style.opacity = '0';
      bentoMenu.style.visibility = 'hidden';

      // ── STEP 2: Record DOM position for later restore ──
      expandedCard = card;
      expandedCardParent = card.parentNode;
      expandedCardSibling = card.nextSibling;

      // ── STEP 3: Clean up other cards (grid is already invisible) ──
      bentoCards.forEach(c => {
        if (c !== card) {
          c.classList.remove('expanded', 'expanded-fixed');
          c.classList.add('collapsed');
        }
      });

      // ── STEP 4: Move card to body and apply expanded state ──
      card.classList.remove('collapsed');
      card.classList.add('expanded', 'expanded-fixed');
      document.body.appendChild(card);

      bentoMenu.classList.add('has-expanded');
    };

    let _suppressClose = false;

    const exitDetail = () => {
      // Suppress close events for 600ms so the grid stays visible after Exit
      _suppressClose = true;
      setTimeout(() => { _suppressClose = false; }, 600);

      // Reset widget settings sub-view back to tile grid (toggleView)
      // so the bento card doesn't show the last-opened widget settings panel
      if (settingsView && toggleView) {
        settingsView.classList.add('hidden');
        toggleView.classList.remove('hidden');
        _activeWSTile = null;
      }

      _restoreCard();
      expandedCard = null; expandedCardParent = null; expandedCardSibling = null;
      // openGrid() restores bentoMenu transitions + visibility
      openGrid();
    };

    const _restoreCard = () => {
      if (expandedCard && expandedCardParent) {
        expandedCard.classList.remove('expanded', 'expanded-fixed', 'collapsed');
        expandedCardParent.insertBefore(expandedCard, expandedCardSibling);
      }
    };

    // ── EVENTS ─────────────────────────────────────────────────────────────

    // Arrow button: toggle grid open/closed
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state === 'closed') openGrid();
      else if (state === 'grid') closeAll();
      // 'detail' state: btn is invisible, no action
    });

    // Card click: go to detail
    bentoCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (state !== 'grid') return;
        if (e.target.closest('.bento-card-actions')) return;
        openDetail(card);
      });
    });

    // Exit buttons: return to grid
    document.querySelectorAll('.bento-back-card').forEach(exitBtn => {
      exitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exitDetail();
      });
    });

    // Save buttons: save + return to grid
    document.querySelectorAll('.bento-save-card').forEach(saveBtn => {
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.saveAll();
        exitDetail();
      });
    });

    // Old back btn
    if (backBtn) {
      backBtn.addEventListener('click', (e) => { e.stopPropagation(); exitDetail(); });
    }

    // ── CUSTOMIZE LAYOUT BUTTON ────────────────────────────────────────────
    const customizeBtn = document.getElementById('btn-customize-layout');
    if (customizeBtn) {
      customizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Remember which card to re-open when Done is pressed
        this._customizeCard = document.querySelector('.bento-card.bento-toggles');
        this._customizeReopenFn = () => {
          // openGrid() sets state='grid' (required for openDetail to work).
          // openDetail() immediately kills transitions and hides the grid, so
          // no delay is needed — both run in the same JS tick → single paint.
          openGrid();
          openDetail(this._customizeCard);
        };
        // Close settings panel entirely first
        closeAll();
        // Enter customize mode after panel finishes closing
        setTimeout(() => this.enterCustomizeMode(), 350);
      });
    }

    // ── CUSTOMIZE DONE BUTTON ─────────────────────────────────────────────
    const customizeDoneBtn = document.getElementById('customize-done-btn');
    if (customizeDoneBtn) {
      customizeDoneBtn.addEventListener('click', () => this.exitCustomizeMode());
    }

    // ── RESET LAYOUT BUTTON ───────────────────────────────────────────────
    const customizeResetBtn = document.getElementById('customize-reset-btn');
    if (customizeResetBtn) {
      customizeResetBtn.addEventListener('click', async () => {
        await this.applyLayoutPreset();
      });
    }

    // Click outside: close grid (suppressed right after Exit)
    document.addEventListener('click', (e) => {
      if (state !== 'grid') return;
      if (_suppressClose) return;
      if (!container.contains(e.target) && e.target !== btn) closeAll();
    });

    // Mouse leave: close grid (suppressed right after Exit)
    if (container) {
      container.addEventListener('mouseleave', () => {
        if (_suppressClose) return;
        if (state === 'grid') closeAll();
      });
    }

    // ── WIDGET TILES → open per-widget settings ───────────────────────────
    const WIDGET_META = {
      clock: { label: 'Clock', icon: '🕒' },
      quicklinks: { label: 'Links', icon: '🔗' },
      greeting: { label: 'Hi', icon: '👋' },
      todo: { label: 'Todo', icon: '☑️' },
      notes: { label: 'Notes', icon: '📄' },
      pomodoro: { label: 'Pomo', icon: '⏱️' },
      photo: { label: 'Photo', icon: '🖼️' },
    };

    const toggleView = document.getElementById('widget-toggle-view');
    const settingsView = document.getElementById('widget-settings-view');
    const wsBackBtn = document.getElementById('ws-back-btn');
    const wsIcon = document.getElementById('ws-widget-icon');
    const wsTitle = document.getElementById('ws-widget-title');
    const wsVisible = document.getElementById('ws-visible-toggle');
    let _activeWSTile = null;

    // Update tile active state from data
    const _refreshTiles = () => {
      Object.keys(WIDGET_META).forEach(name => {
        const tile = document.getElementById(`tile-${name}`);
        if (!tile) return;
        const isVis = this.data?.widgets?.[name]?.visible ?? true;
        tile.classList.toggle('active', isVis);
      });
    };
    _refreshTiles();

    // Open widget settings sub-view
    const _openWidgetSettings = (name) => {
      _activeWSTile = name;
      const meta = WIDGET_META[name];
      wsIcon.textContent = meta.icon;

      const currentLang = this.data?.appLang || 'en';
      const key = `widget-meta-${name}`;
      wsTitle.textContent = (window.TRANSLATIONS && window.TRANSLATIONS[currentLang] && window.TRANSLATIONS[currentLang][key]) || meta.label;

      // Populate visibility toggle
      wsVisible.checked = this.data?.widgets?.[name]?.visible ?? true;

      // Show correct settings panel
      document.querySelectorAll('.ws-panel').forEach(p => p.classList.add('hidden'));
      const panel = document.getElementById(`ws-panel-${name}`);
      if (panel) panel.classList.remove('hidden');

      // Refresh links list when opening quicklinks panel
      if (name === 'quicklinks') this.renderLinksList();

      // Switch views
      toggleView.classList.add('hidden');
      settingsView.classList.remove('hidden');
      // Re-trigger animation
      settingsView.style.animation = 'none';
      requestAnimationFrame(() => { settingsView.style.animation = ''; });
    };

    // ── QUICK TOGGLE: directly enable/disable widget from grid ────────────────
    // Uses div[role="switch"] (not button) to avoid invalid nested-button HTML.
    // Handles both click and keyboard (Enter / Space) for accessibility.
    // _tileRefresh is a ref so _applyQuickToggle always calls the patched version.
    const _tileRefresh = { fn: _refreshTiles };

    const _applyQuickToggle = async (toggleEl) => {
      const name = toggleEl.dataset.widget;
      if (!name) return;

      const currentlyVisible = this.data?.widgets?.[name]?.visible ?? true;
      const newVisible = !currentlyVisible;

      // Persist + show/hide widget on screen
      await this._toggleWidget(name, newVisible);

      // Update in-memory data
      if (!this.data.widgets) this.data.widgets = {};
      if (!this.data.widgets[name]) this.data.widgets[name] = {};
      this.data.widgets[name].visible = newVisible;

      // Sync detail-view toggle if currently open for this widget
      if (_activeWSTile === name && wsVisible) wsVisible.checked = newVisible;

      // Refresh tile active classes + aria-checked on all quick toggles
      _tileRefresh.fn();

      // Micro-feedback: brief scale pop
      toggleEl.style.transform = 'scale(1.3)';
      setTimeout(() => { toggleEl.style.transform = ''; }, 180);
    };

    document.querySelectorAll('.tile-quick-toggle').forEach(toggleEl => {
      // Click
      toggleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        _applyQuickToggle(toggleEl);
      });
      // Keyboard: Enter or Space (same as native button)
      toggleEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          _applyQuickToggle(toggleEl);
        }
      });
    });

    // Patch _tileRefresh to also sync aria-checked on quick toggles
    _tileRefresh.fn = () => {
      _refreshTiles();
      document.querySelectorAll('.tile-quick-toggle').forEach(toggleEl => {
        const name = toggleEl.dataset.widget;
        const isVis = this.data?.widgets?.[name]?.visible ?? true;
        toggleEl.setAttribute('aria-checked', isVis ? 'true' : 'false');
      });
    };
    // Run once on init to set aria-checked from persisted data
    _tileRefresh.fn();

    // Tile clicks — only open widget settings when card is already expanded
    const bentoTogglesCard = document.querySelector('.bento-card.bento-toggles');
    document.querySelectorAll('.bento-widget-tile').forEach(tile => {
      tile.addEventListener('click', (e) => {
        // If the card isn't expanded yet, let the click bubble so it opens the detail view
        if (!bentoTogglesCard || !bentoTogglesCard.classList.contains('expanded')) return;
        e.stopPropagation();
        _openWidgetSettings(tile.dataset.widget);
      });
    });

    // Reset widget-settings sub-view whenever the toggles card opens into detail
    if (bentoTogglesCard) {
      bentoTogglesCard.addEventListener('click', () => {
        // Reset back to tile grid whenever the card is freshly expanded
        if (!bentoTogglesCard.classList.contains('expanded')) {
          settingsView.classList.add('hidden');
          toggleView.classList.remove('hidden');
          _activeWSTile = null;
        }
      });
    }

    // Back button: return to tile grid
    if (wsBackBtn) {
      wsBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsView.classList.add('hidden');
        toggleView.classList.remove('hidden');
        _activeWSTile = null;
      });
    }

    // Visibility toggle
    if (wsVisible) {
      wsVisible.addEventListener('change', async () => {
        if (!_activeWSTile) return;
        const isVis = wsVisible.checked;
        await this._toggleWidget(_activeWSTile, isVis);
        if (this.data?.widgets?.[_activeWSTile]) this.data.widgets[_activeWSTile].visible = isVis;
        _refreshTiles();
      });
    }

    // Clock settings in ws-panel
    const wsClkFmt = document.getElementById('ws-clock-format');
    const wsClkLang = document.getElementById('ws-clock-lang');
    if (wsClkFmt) {
      wsClkFmt.value = data.clockFormat;
      wsClkFmt.addEventListener('change', async (e) => {
        await Storage.save('clockFormat', e.target.value);
        Clock.format = e.target.value; Clock.tick();
        // Keep old pref-clock-format in sync
        const old = document.getElementById('pref-clock-format');
        if (old) old.value = e.target.value;
      });
    }
    if (wsClkLang) {
      wsClkLang.value = data.clockLang;
      wsClkLang.addEventListener('change', async (e) => {
        const lang = e.target.value;
        await Storage.save('clockLang', lang);
        Clock.lang = lang; Clock.tick();
        if (typeof Greeting !== 'undefined') Greeting.update(Greeting.name, lang);
        const old = document.getElementById('pref-lang');
        if (old) old.value = lang;
      });
    }

    // Greeting name in ws-panel
    const wsGreetName = document.getElementById('ws-greeting-name');
    if (wsGreetName) {
      wsGreetName.value = data.greetingName;
      wsGreetName.addEventListener('input', async (e) => {
        await Storage.save('greetingName', e.target.value);
        if (typeof Greeting !== 'undefined') Greeting.update(e.target.value, Greeting.lang);
        const old = document.getElementById('pref-greeting-name');
        if (old) old.value = e.target.value;
      });
    }

    // Pomodoro settings in ws-panel
    const wsPomoWork = document.getElementById('ws-pomo-work');
    const wsPomoBreak = document.getElementById('ws-pomo-break');
    const wsPomoAuto = document.getElementById('ws-pomo-autostart');
    if (wsPomoWork) {
      wsPomoWork.value = data.pomodoroWork;
      wsPomoWork.addEventListener('input', async (e) => {
        let v = parseInt(e.target.value);
        if (isNaN(v)) v = 25;
        if (v < 1) v = 1;
        if (v > 60) v = 60;
        await Storage.save('pomodoroWork', v);
        if (typeof Pomodoro !== 'undefined') Pomodoro.updateSettings(v, Pomodoro.breakMin, Pomodoro.autoStart);
      });
    }
    if (wsPomoBreak) {
      wsPomoBreak.value = data.pomodoroBreak;
      wsPomoBreak.addEventListener('input', async (e) => {
        let v = parseInt(e.target.value);
        if (isNaN(v)) v = 0;
        if (v < 0) v = 0;
        if (v > 60) v = 60;
        await Storage.save('pomodoroBreak', v);
        if (typeof Pomodoro !== 'undefined') Pomodoro.updateSettings(Pomodoro.workMin, v, Pomodoro.autoStart);
      });
    }
    if (wsPomoAuto) {
      wsPomoAuto.checked = data.pomodoroAutoStart;
      wsPomoAuto.addEventListener('change', async (e) => {
        await Storage.save('pomodoroAutoStart', e.target.checked);
        if (typeof Pomodoro !== 'undefined') Pomodoro.autoStart = e.target.checked;
      });
    }
    // Wallpaper presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => this._setWallpaper(btn.dataset.preset));
    });
    this._highlightPreset(data.wallpaperPreset);

    // Custom wallpaper upload
    const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const sizeInMB = file.size / (1024 * 1024);
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const lang = this.data?.appLang || 'en';

      if (isVideo && sizeInMB > 15) {
        this._showAlert(lang === 'en' ? 'Maximum video size is 15 MB.' : 'Ukuran video maksimal 15 MB.', lang === 'en' ? 'Warning' : 'Peringatan');
        e.target.value = '';
        return;
      }

      if (isImage && sizeInMB > 5) {
        this._showAlert(lang === 'en' ? 'Maximum image size is 5 MB.' : 'Ukuran gambar maksimal 5 MB.', lang === 'en' ? 'Warning' : 'Peringatan');
        e.target.value = '';
        return;
      }

      try {
        await MediaDB.saveBlob('wallpaperCustom', file);
        await Storage.save('wallpaperCustomType', file.type);
        await Storage.save('wallpaperCustomUrl', 'indexeddb');
        await Storage.save('wallpaperPreset', 'custom');
        
        const objectUrl = URL.createObjectURL(file);
        this._applyWallpaper('custom', objectUrl, file.type);
        this._highlightPreset('custom');
        document.getElementById('wallpaper-clear').style.display = 'inline-block';
      } catch (err) {
        console.error('Failed to save to MediaDB', err);
        this._showAlert(lang === 'en' ? 'Failed to save wallpaper.' : 'Gagal menyimpan wallpaper.', lang === 'en' ? 'Error' : 'Error');
      }
    };

    document.getElementById('wallpaper-file-photo').addEventListener('change', handleFileUpload);
    document.getElementById('wallpaper-file-video').addEventListener('change', handleFileUpload);



    document.getElementById('wallpaper-clear').addEventListener('click', async () => {
      const confirmed = await this._confirmReplaceCustom();
      if (!confirmed) {
        return;
      }
      await MediaDB.deleteBlob('wallpaperCustom');
      await Storage.save('wallpaperCustomType', '');
      await Storage.save('wallpaperCustomUrl', '');
      await Storage.save('wallpaperPreset', 'liquid-chrome');
      this._applyWallpaper('liquid-chrome', '');
      this._highlightPreset('liquid-chrome');
      document.getElementById('wallpaper-clear').style.display = 'none';
    });

    if (data.wallpaperPreset === 'custom' && data.wallpaperCustomUrl) {
      document.getElementById('wallpaper-clear').style.display = 'inline-block';
    }


    // General card content (rendered dynamically)
    this._renderGeneralCard();

    // Quick links management (render is called when panel opens via _openWidgetSettings)
    const wsLinksTarget = document.getElementById('ws-links-target');
    if (wsLinksTarget) {
      wsLinksTarget.checked = this.data?.quicklinksNewTab ?? true;
      wsLinksTarget.addEventListener('change', async (e) => {
        const val = e.target.checked;
        await Storage.save('quicklinksNewTab', val);
        if (this.data) this.data.quicklinksNewTab = val;
        if (typeof QuickLinks !== 'undefined') {
          QuickLinks.newTab = val;
          QuickLinks.render();
        }
      });
    }

    document.getElementById('settings-add-link').addEventListener('click', () => {
      if (typeof QuickLinks !== 'undefined') QuickLinks.openModal();
    });

    // ── PHOTO WIDGET SETTINGS ─────────────────────────────────────────────
    const wsPhotoFile = document.getElementById('ws-photo-file');
    const wsPhotoSize = document.getElementById('ws-photo-size');
    const wsPhotoClear = document.getElementById('ws-photo-clear');
    const wsPhotoRecrop = document.getElementById('ws-photo-recrop');
    const wsPhotoPreview = document.getElementById('ws-photo-preview');
    const wsPhotoPreviewImg = document.getElementById('ws-photo-preview-img');

    const _syncPhotoPanel = async () => {
      let url = (await Storage.get('photoUrl')) || '';
      if (url === 'indexeddb') {
        const blob = await MediaDB.getBlob('photoWidget');
        if (blob) url = URL.createObjectURL(blob);
        else url = '';
      }
      const size = (await Storage.get('photoSize')) || '1x1';
      if (wsPhotoSize) wsPhotoSize.value = size;
      if (wsPhotoClear) wsPhotoClear.style.display = url ? 'block' : 'none';
      if (wsPhotoRecrop) wsPhotoRecrop.style.display = url ? 'block' : 'none';
      if (wsPhotoPreview) {
        wsPhotoPreview.style.display = url ? 'block' : 'none';
        if (url && wsPhotoPreviewImg) wsPhotoPreviewImg.src = url;
      }
    };

    // Unified MutationObserver: sync panel state + manage "Adjust Size" button
    const _enterCustomizeForPhoto = () => {
      const customizeBtn = document.getElementById('btn-customize-layout');
      if (customizeBtn) customizeBtn.click();
    };

    const _refreshAdjustBtn = () => {
      const panel = document.getElementById('ws-panel-photo');
      if (!panel) return;
      const size = wsPhotoSize ? wsPhotoSize.value : '';
      let adjustBtn = panel.querySelector('#ws-photo-adjust-size');
      if (size === 'custom') {
        if (!adjustBtn) {
          adjustBtn = document.createElement('button');
          adjustBtn.id = 'ws-photo-adjust-size';
          adjustBtn.className = 'file-btn';
          adjustBtn.style.cssText = 'width:100%; box-sizing:border-box; text-align:center; display:block; margin-top:8px;';
          adjustBtn.textContent = '↔ Atur Ukuran Widget';
          adjustBtn.addEventListener('click', _enterCustomizeForPhoto);
          const sizeRow = panel.querySelector('.pref-row');
          if (sizeRow) sizeRow.insertAdjacentElement('afterend', adjustBtn);
          else panel.insertBefore(adjustBtn, panel.firstChild);
        }
      } else if (adjustBtn) {
        adjustBtn.remove();
      }
    };

    const wsPhotoPanel = document.getElementById('ws-panel-photo');
    if (wsPhotoPanel) {
      const photoObserver = new MutationObserver(async () => {
        if (!wsPhotoPanel.classList.contains('hidden')) {
          await _syncPhotoPanel();
          _refreshAdjustBtn();
        }
      });
      photoObserver.observe(wsPhotoPanel, { attributes: true, attributeFilter: ['class'] });
    }

    if (wsPhotoFile) {
      wsPhotoFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const sizeInMB = file.size / (1024 * 1024);
        if (sizeInMB > 5) {
          const lang = this.data?.appLang || 'en';
          this._showAlert(lang === 'en' ? 'Maximum photo size is 5 MB.' : 'Ukuran foto maksimal 5 MB.', lang === 'en' ? 'Warning' : 'Peringatan');
          e.target.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const rawUrl = ev.target.result;
          // Open crop modal; callback fires only when user confirms crop
          Crop.open(rawUrl, async (croppedUrl) => {
            const rawRes = await fetch(rawUrl);
            const rawBlob = await rawRes.blob();
            await MediaDB.saveBlob('photoOriginal', rawBlob);
            await Storage.save('photoOriginalUrl', 'indexeddb'); // Save original for re-cropping

            const cropRes = await fetch(croppedUrl);
            const cropBlob = await cropRes.blob();
            await MediaDB.saveBlob('photoWidget', cropBlob);
            await Storage.save('photoUrl', 'indexeddb');
            
            const objUrl = URL.createObjectURL(cropBlob);
            if (typeof Photo !== 'undefined') Photo.setPhoto(objUrl);
            _syncPhotoPanel();
          });
        };
        reader.readAsDataURL(file);
        // Reset input so re-selecting same file triggers change again
        e.target.value = '';
      });
    }

    if (wsPhotoRecrop) {
      wsPhotoRecrop.addEventListener('click', async () => {
        // Use original uncropped photo if available, fallback to current photo
        let origUrl = (await Storage.get('photoOriginalUrl')) || (await Storage.get('photoUrl'));
        if (origUrl === 'indexeddb') {
          const blob = (await MediaDB.getBlob('photoOriginal')) || (await MediaDB.getBlob('photoWidget'));
          if (blob) origUrl = URL.createObjectURL(blob);
          else origUrl = '';
        }
        if (!origUrl) return;
        
        Crop.open(origUrl, async (croppedUrl) => {
          const cropRes = await fetch(croppedUrl);
          const cropBlob = await cropRes.blob();
          await MediaDB.saveBlob('photoWidget', cropBlob);
          await Storage.save('photoUrl', 'indexeddb');
          
          const objUrl = URL.createObjectURL(cropBlob);
          if (typeof Photo !== 'undefined') Photo.setPhoto(objUrl);
          _syncPhotoPanel();
        });
      });
    }

    if (wsPhotoSize) {
      wsPhotoSize.addEventListener('change', async (e) => {
        const size = e.target.value;
        await Storage.save('photoSize', size);
        if (typeof Photo !== 'undefined') Photo.setSize(size);

        // Always refresh the "Adjust Size" button visibility
        _refreshAdjustBtn();

        if (size === 'custom') {
          _enterCustomizeForPhoto();
        }
      });
    }

    if (wsPhotoClear) {
      wsPhotoClear.addEventListener('click', async () => {
        await MediaDB.deleteBlob('photoWidget');
        await MediaDB.deleteBlob('photoOriginal');
        await Storage.save('photoUrl', '');
        await Storage.save('photoOriginalUrl', '');
        if (typeof Photo !== 'undefined') Photo.setPhoto('');
        _syncPhotoPanel();
      });
    }
  },

  _populateFields() { },

  // Helper: reset expanded state, restore card to original DOM position, restore arrow
  _collapseAll(bentoMenu, bentoCards, btn, expandedCard, expandedCardParent, expandedCardNextSibling) {
    bentoMenu.classList.remove('has-expanded');
    // Move card back to its original position in the bento grid
    if (expandedCard && expandedCardParent) {
      expandedCard.classList.remove('expanded', 'expanded-fixed', 'collapsed');
      if (expandedCardNextSibling) {
        expandedCardParent.insertBefore(expandedCard, expandedCardNextSibling);
      } else {
        expandedCardParent.appendChild(expandedCard);
      }
    }
    bentoCards.forEach(c => c.classList.remove('expanded', 'expanded-fixed', 'collapsed'));
    if (btn) {
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
      btn.style.transform = '';
    }
  },

  // Save current settings and show feedback
  saveAll() {
    document.querySelectorAll('.bento-save-card').forEach(sb => {
      sb.textContent = '✓ Saved!';
      setTimeout(() => sb.textContent = 'Save', 1500);
    });
    this._savePrefs();
    this._saveWidgetPositions(); // also persist any drag positions
  },

  // Persist current widget inline positions to storage
  async _saveWidgetPositions() {
    const positions = Drag.collectPositions();
    if (Object.keys(positions).length === 0) return;
    const widgets = (await Storage.get('widgets')) || {};
    for (const [name, pos] of Object.entries(positions)) {
      if (!widgets[name]) widgets[name] = {};
      widgets[name].x = pos.x;
      widgets[name].y = pos.y;
    }
    await Storage.save('widgets', widgets);
  },

  // ── CUSTOMIZE MODE ────────────────────────────────────────────────────────
  enterCustomizeMode() {
    document.body.classList.add('customize-mode');
    const overlay = document.getElementById('customize-overlay');
    if (overlay) overlay.classList.remove('hidden');
    Drag.enableAll();
  },

  async exitCustomizeMode() {
    // 1. Collect & save positions before removing handlers
    await this._saveWidgetPositions();

    // 2. Stop dragging
    Drag.disableAll();
    document.body.classList.remove('customize-mode');

    // 3. Hide overlay
    const overlay = document.getElementById('customize-overlay');
    if (overlay) overlay.classList.add('hidden');

    // 4. Re-open settings at the Widgets card
    if (this._customizeReopenFn) {
      this._customizeReopenFn();
      this._customizeReopenFn = null;
    }
  },

  // ── APPLY LAYOUT PRESET ───────────────────────────────────────────────────
  // Repositions all draggable widgets to the preset coordinates (viewport %).
  // Saves the new positions to storage. Does NOT touch visibility.
  async applyLayoutPreset() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const widgets = (await Storage.get('widgets')) || {};

    const draggableWidgets = document.querySelectorAll('#widget-container > .widget:not(.widget-quicklinks)');

    const START_X = 40;
    const START_Y = 40;
    const GAP_X = 24;
    const GAP_Y = 24;

    let currentX = START_X;
    let currentY = START_Y;
    let maxRowHeight = 0;

    Array.from(draggableWidgets).forEach((el) => {
      const name = el.dataset.widget;
      if (!name) return;

      // Temporarily unhide to get accurate dimensions if needed
      const wasHidden = el.classList.contains('hidden');
      if (wasHidden) {
        el.style.visibility = 'hidden';
        el.style.display = 'block';
        el.classList.remove('hidden');
      }

      const w = el.offsetWidth || 240;
      const h = el.offsetHeight || 140;

      if (wasHidden) {
        el.classList.add('hidden');
        el.style.display = '';
        el.style.visibility = '';
      }

      // Wrap to next line if exceeds screen width (except for the first widget in a row)
      if (currentX + w > vw - START_X && currentX > START_X) {
        currentX = START_X;
        currentY += maxRowHeight + GAP_Y;
        maxRowHeight = 0;
      }

      let x = currentX;
      let y = currentY;

      // Clamp within viewport bounds (just in case)
      x = Math.max(0, Math.min(vw - w, x));
      y = Math.max(0, Math.min(vh - h, y));

      // Apply inline position (same as Drag system)
      Drag.applyPosition(el, x, y);

      // Persist to storage
      if (!widgets[name]) widgets[name] = {};
      widgets[name].x = x;
      widgets[name].y = y;

      currentX += w + GAP_X;
      maxRowHeight = Math.max(maxRowHeight, h);
    });

    await Storage.save('widgets', widgets);

    // Visual feedback on the reset button
    const resetBtn = document.getElementById('customize-reset-btn');
    if (resetBtn) {
      const orig = resetBtn.textContent;
      resetBtn.textContent = '✓ Reset!';
      resetBtn.style.borderColor = 'rgba(100,220,150,0.7)';
      resetBtn.style.color = 'rgba(100,220,150,0.95)';
      setTimeout(() => {
        resetBtn.textContent = orig;
        resetBtn.style.borderColor = '';
        resetBtn.style.color = '';
      }, 1500);
    }
  },

  async _savePrefs() {
    // Clock format & language from current visible settings inputs
    const clockFormat = document.getElementById('ws-clock-format')?.value;
    const lang = document.getElementById('ws-clock-lang')?.value;
    const greetName = document.getElementById('ws-greeting-name')?.value ?? '';

    if (clockFormat) { await Storage.save('clockFormat', clockFormat); Clock.format = clockFormat; Clock.tick(); }
    if (lang) { await Storage.save('clockLang', lang); }
    await Storage.save('greetingName', greetName);
    if (typeof Greeting !== 'undefined') Greeting.update(greetName, lang || Clock.lang);

    // Save Pomodoro settings explicitly to ensure no values are lost or in a race condition
    const wsPomoWork = document.getElementById('ws-pomo-work');
    const wsPomoBreak = document.getElementById('ws-pomo-break');
    const wsPomoAuto = document.getElementById('ws-pomo-autostart');

    if (wsPomoWork) {
      let workVal = parseInt(wsPomoWork.value);
      if (isNaN(workVal) || workVal < 1) workVal = 25;
      await Storage.save('pomodoroWork', workVal);
      if (typeof Pomodoro !== 'undefined') Pomodoro.workMin = workVal;
    }
    if (wsPomoBreak) {
      let breakVal = parseInt(wsPomoBreak.value);
      if (isNaN(breakVal) || breakVal < 0) breakVal = 5;
      await Storage.save('pomodoroBreak', breakVal);
      if (typeof Pomodoro !== 'undefined') Pomodoro.breakMin = breakVal;
    }
    if (wsPomoAuto) {
      await Storage.save('pomodoroAutoStart', wsPomoAuto.checked);
      if (typeof Pomodoro !== 'undefined') Pomodoro.autoStart = wsPomoAuto.checked;
    }

    if (typeof Pomodoro !== 'undefined' && !Pomodoro.isRunning) {
      Pomodoro.reset();
    }
  },

  async _toggleWidget(name, visible) {
    await Storage.setWidgetVisible(name, visible);
    const el = document.getElementById(`widget-${name}`);
    if (!el) return;

    if (visible) {
      // Compute position BEFORE removing hidden class.
      // CSS sets all four sides (top, bottom, left, right) for every widget so
      // JS inline styles override correctly regardless of widget type.

      let x, y;

      // quicklinks: CSS handles all positioning via bottom + transform:center
      if (name === 'quicklinks') {
        el.classList.remove('hidden');
        return;
      }

      const widgets = (await Storage.get('widgets')) || {};
      const savedPos = widgets[name];

      if (savedPos && savedPos.x != null && savedPos.y != null) {
        x = savedPos.x; y = savedPos.y;
      } else if (LAYOUT_PRESET[name]) {
        const vw = window.innerWidth, vh = window.innerHeight;
        const preset = LAYOUT_PRESET[name];
        x = Math.round(preset.xPct * vw);
        y = Math.round(preset.yPct * vh);
        const w = el.offsetWidth || 200, h = el.offsetHeight || 120;
        x = Math.max(0, Math.min(vw - w, x));
        y = Math.max(0, Math.min(vh - h, y));
        if (!widgets[name]) widgets[name] = {};
        widgets[name].x = x; widgets[name].y = y;
        await Storage.save('widgets', widgets);
      } else {
        x = 28; y = null;
      }

      // Apply position — set top/bottom consistently so inline styles override CSS
      el.style.position = 'fixed';
      el.style.left = x + 'px';
      if (y != null) {
        el.style.top = y + 'px';
        el.style.bottom = 'auto';
      } else {
        el.style.top = 'auto';
        el.style.bottom = '28px';
      }
      el.style.right = 'auto';
      el.style.transform = 'none';

      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  },

  async _confirmReplaceCustom() {
    return new Promise((resolve) => {
      const overlay = document.getElementById('modal-confirm-overlay');
      const yesBtn = document.getElementById('modal-confirm-yes');
      const noBtn = document.getElementById('modal-confirm-no');

      overlay.classList.remove('hidden');

      const handleYes = () => { cleanup(); resolve(true); };
      const handleNo = () => { cleanup(); resolve(false); };

      const cleanup = () => {
        overlay.classList.add('hidden');
        yesBtn.removeEventListener('click', handleYes);
        noBtn.removeEventListener('click', handleNo);
      };

      yesBtn.addEventListener('click', handleYes);
      noBtn.addEventListener('click', handleNo);
    });
  },

  async _showAlert(message, title = 'Peringatan') {
    return new Promise((resolve) => {
      const overlay = document.getElementById('modal-alert-overlay');
      const titleEl = document.getElementById('modal-alert-title');
      const msgEl = document.getElementById('modal-alert-message');
      const okBtn = document.getElementById('modal-alert-ok');

      if (!overlay) {
        alert(message);
        resolve();
        return;
      }

      titleEl.textContent = title;
      msgEl.textContent = message;
      overlay.classList.remove('hidden');

      const handleOk = () => {
        overlay.classList.add('hidden');
        okBtn.removeEventListener('click', handleOk);
        resolve();
      };

      okBtn.addEventListener('click', handleOk);
    });
  },

  async _setWallpaper(preset) {
    const wp = document.getElementById('wallpaper');
    if (wp.classList.contains('wallpaper-custom')) {
      const confirmed = await this._confirmReplaceCustom();
      if (!confirmed) {
        return;
      }
    }

    this._applyWallpaper(preset, '');
    this._highlightPreset(preset);
    Storage.save('wallpaperPreset', preset);
    Storage.save('wallpaperCustomUrl', '');
    document.getElementById('wallpaper-clear').style.display = 'none';
  },

  _applyWallpaper(preset, customUrl, customType = '') {
    const wp = document.getElementById('wallpaper');
    const vid = document.getElementById('wallpaper-video');
    wp.className = 'wallpaper';
    if (vid) vid.style.display = 'none';

    if (preset === 'custom' && customUrl) {
      wp.classList.add('wallpaper-custom');
      const isVideo = customType.startsWith('video/') || customUrl.startsWith('data:video');
      if (isVideo) {
        wp.style.backgroundImage = '';
        if (vid) {
          vid.poster = ''; // No poster for custom videos yet
          vid.style.backgroundImage = ''; // Clear fallback background
          vid.src = customUrl;
          vid.loop = true;
          vid.muted = true;
          vid.play().catch(e => console.error("Auto-play prevented:", e));
          vid.style.display = 'block';
        }
      } else {
        // Uploaded Image
        wp.style.backgroundImage = `url("${customUrl}")`;
        if (vid) vid.style.display = 'none';
      }
    } else {
      wp.style.backgroundImage = '';
      const map = {
        'liquid-chrome': 'wallpaper-liquid',
        'dark': 'wallpaper-dark',
      };
      const presetClass = map[preset] || 'wallpaper-liquid';
      wp.classList.add(presetClass);

      if (vid) {
        if (presetClass === 'wallpaper-liquid') {
          vid.poster = 'Liquid.jpeg';
          vid.style.backgroundImage = 'url("Liquid.jpeg")';
          if (!vid.src.includes('Liquid%20Animate%20Loop.webm')) {
            vid.src = 'Liquid Animate Loop.webm';
            vid.loop = true;
            vid.play().catch(e => console.error("Auto-play prevented:", e));
          }
          vid.style.display = 'block';
        } else if (presetClass === 'wallpaper-dark') {
          vid.poster = 'Liquid Dark Minimal.jpeg';
          vid.style.backgroundImage = 'url("Liquid Dark Minimal.jpeg")';
          if (!vid.src.includes('Liquid%20Dark%20Minimal%20Loop.webm')) {
            vid.src = 'Liquid Dark Minimal Loop.webm';
            vid.loop = true;
            vid.play().catch(e => console.error("Auto-play prevented:", e));
          }
          vid.style.display = 'block';
        }
      }
    }
  },

  _highlightPreset(preset) {
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === preset);
    });
  },

  renderLinksList() {
    const container = document.getElementById('settings-quicklinks-list');
    container.innerHTML = '';
    if (typeof QuickLinks === 'undefined') return;
    QuickLinks.links.forEach(link => {
      const row = document.createElement('div');
      row.className = 'settings-link-item';

      const iconEl = document.createElement('span');
      iconEl.className = 'settings-link-icon';
      if (link.icon && link.icon.startsWith('data:image')) {
        const img = document.createElement('img');
        img.src = link.icon;
        img.alt = link.name;
        img.style.width = '16px';
        img.style.height = '16px';
        img.style.objectFit = 'contain';
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
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.585 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .33.225.705.825.585C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z"/></svg>');
          } else {
            img.src = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(iconUrl)}&size=64`;
          }
        } catch { img.src = ''; }
        img.alt = link.name;
        img.style.width = '16px';
        img.style.height = '16px';
        img.onerror = () => { iconEl.textContent = '🔗'; };
        iconEl.appendChild(img);
      } else {
        // Custom links fallback to initial
        const initial = link.name ? link.name.charAt(0).toUpperCase() : '?';
        iconEl.textContent = initial;
        iconEl.style.fontSize = '12px';
        iconEl.style.fontWeight = '600';
      }

      const info = document.createElement('div');
      info.className = 'settings-link-info';
      info.innerHTML = `<div class="settings-link-name">${link.name}</div>
                        <div class="settings-link-url">${link.url}</div>`;

      const delBtn = document.createElement('button');
      delBtn.className = 'settings-link-delete';
      delBtn.textContent = '×';
      delBtn.addEventListener('click', () => QuickLinks.deleteLink(link.id));

      row.appendChild(iconEl);
      row.appendChild(info);
      row.appendChild(delBtn);
      container.appendChild(row);
    });
  },

  _renderGeneralCard() {
    const container = document.getElementById('general-card-content');
    if (!container) return;

    const lang = this.data?.appLang || 'en';
    const isEn = lang === 'en';

    container.innerHTML = `
      <div class="general-section" style="margin-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 16px;">
        <label class="settings-label" style="display: block; margin-bottom: 8px;">${isEn ? 'Language' : 'Bahasa'}</label>
        <select id="ws-general-lang" class="settings-select" style="width: 100%;">
          <option value="en" ${isEn ? 'selected' : ''}>English</option>
          <option value="id" ${!isEn ? 'selected' : ''}>Bahasa Indonesia</option>
        </select>
      </div>
      <div class="general-section" style="margin-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 16px;">
        <p style="font-size: 11px; font-weight: 600; letter-spacing: 1px; color: rgba(255,255,255,0.45); text-transform: uppercase; margin: 0 0 10px 0;">${isEn ? 'Support & Feedback' : 'Bantuan & Masukan'}</p>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSeN9FB9pQlCsNi2G1p73_lGx6uJDVoxJIpo33nZEKDFXj2ing/viewform?usp=dialog" target="_blank" class="file-btn full-width" style="text-decoration: none; text-align: center; display: block; box-sizing: border-box; background: rgba(255, 255, 255, 0.05);">
          ✉️ ${isEn ? 'Contact / Report Issue' : 'Hubungi / Lapor Bug'}
        </a>
      </div>
      <div class="general-section">
        <p style="font-size: 11px; font-weight: 600; letter-spacing: 1px; color: rgba(255,255,255,0.45); text-transform: uppercase; margin: 0 0 10px 0;">${isEn ? 'Danger Zone' : 'Zona Bahaya'}</p>
        <button class="btn-reset full-width" id="btn-reset-all" style="margin-top: 0;">
          🗑️ ${isEn ? 'Reset All Data' : 'Reset Semua Data'}
        </button>
      </div>
    `;

    document.getElementById('ws-general-lang').addEventListener('change', async (e) => {
      const newLang = e.target.value;
      this.data.appLang = newLang;
      await Storage.save('appLang', newLang);

      // Sync other storage keys
      await Storage.save('clockLang', newLang);
      await Storage.save('greetingLang', newLang);

      // Sync the hidden clock lang dropdown
      const wsClkLang = document.getElementById('ws-clock-lang');
      if (wsClkLang) wsClkLang.value = newLang;

      // Translate UI elements
      if (window.translateUI) {
        window.translateUI(newLang);
      }

      // Update widget instances dynamically
      if (typeof Clock !== 'undefined') {
        Clock.lang = newLang;
        Clock.tick();
      }
      if (typeof Greeting !== 'undefined') {
        Greeting.lang = newLang;
        Greeting.render();
      }
      if (typeof Pomodoro !== 'undefined') {
        Pomodoro.lang = newLang;
        Pomodoro.updateSessions();
        if (!Pomodoro.isRunning) {
          Pomodoro.reset();
        }
      }

      // Re-render the general card to reflect updated labels
      this._renderGeneralCard();
    });

    document.getElementById('btn-reset-all').addEventListener('click', async () => {
      const confirmMsg = isEn
        ? 'Reset all data? All widgets, links, and notes will be deleted.'
        : 'Reset semua data? Semua widget, link, dan catatan akan dihapus.';
      if (confirm(confirmMsg)) {
        await Storage.clearAll();
        location.reload();
      }
    });
  },

  async applyInitialWallpaper(preset, customUrl) {
    if (preset === 'custom' && customUrl === 'indexeddb') {
      try {
        const blob = await MediaDB.getBlob('wallpaperCustom');
        const type = await Storage.get('wallpaperCustomType');
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          this._applyWallpaper(preset, objectUrl, type);
          return;
        }
      } catch (e) {
        console.error("Failed to load wallpaper from IndexedDB", e);
      }
      // fallback if blob is missing
      this._applyWallpaper('liquid-chrome', '');
    } else {
      this._applyWallpaper(preset, customUrl);
    }
  }
};
