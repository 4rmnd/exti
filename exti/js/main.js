/* js/main.js — App Entry Point */
(async function init() {
  // Load all stored data
  const data = await Storage.loadAll();

  // Translate UI immediately based on saved preference
  const currentLang = data.appLang || 'en';
  if (window.translateUI) {
    window.translateUI(currentLang);
  }

  // 1. Apply wallpaper
  await Settings.applyInitialWallpaper(data.wallpaperPreset, data.wallpaperCustomUrl);

  // ── 2. Position ALL widgets BEFORE making any visible ──────────────────────
  // CSS defines default positions (bottom-left) for all widgets.
  // Here we apply saved positions or preset positions via inline styles,
  // which correctly override the CSS bottom values.
  const draggableWidgets = document.querySelectorAll('#widget-container > .widget:not(.widget-quicklinks)');
  
  const vw = window.innerWidth;
  const vh = window.innerHeight;
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

    // ensure data.widgets exists to avoid errors on first load
    if (!data.widgets) data.widgets = {};
    const pos = data.widgets[name];

    let x, y;

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

    if (pos && pos.x != null && pos.y != null) {
      x = pos.x; y = pos.y;
    } else {
      // Calculate dynamic flow grid position
      if (currentX + w > vw - START_X && currentX > START_X) {
        currentX = START_X;
        currentY += maxRowHeight + GAP_Y;
        maxRowHeight = 0;
      }
      x = currentX;
      y = currentY;
      
      currentX += w + GAP_X;
      maxRowHeight = Math.max(maxRowHeight, h);
      
      x = Math.max(0, Math.min(vw - w, x));
      y = Math.max(0, Math.min(vh - h, y));
    }

    // Inline styles override CSS class rules
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
  });

  // 3. Init Clock
  Clock.init(
    data.clockFormat,
    data.appLang || data.clockLang || 'en',
    data.widgets.clock
  );
  const clockEl = document.getElementById('widget-clock');
  if (clockEl) {
    if (data.widgets.clock?.visible === false) clockEl.classList.add('hidden');
    else clockEl.classList.remove('hidden');
  }

  // 4. Init Quick Links
  QuickLinks.init(data.quickLinks, data.quicklinksNewTab ?? true, data.widgets.quicklinks);
  const quicklinksEl = document.getElementById('widget-quicklinks');
  if (quicklinksEl) {
    if (data.widgets.quicklinks?.visible === false) quicklinksEl.classList.add('hidden');
    else quicklinksEl.classList.remove('hidden');
  }

  // 5. Init Greeting
  Greeting.init(data.greetingName, data.appLang || data.clockLang || 'en', data.widgets.greeting);
  const greetingEl = document.getElementById('widget-greeting');
  if (greetingEl) {
    if (data.widgets.greeting?.visible) greetingEl.classList.remove('hidden');
    else greetingEl.classList.add('hidden');
  }

  // 6. Init Todo
  Todo.init(data.todos, data.widgets.todo);
  const todoEl = document.getElementById('widget-todo');
  if (todoEl) {
    if (data.widgets.todo?.visible) todoEl.classList.remove('hidden');
    else todoEl.classList.add('hidden');
  }

  // 7. Init Notes
  Notes.init(data.notesContent, data.widgets.notes);
  const notesEl = document.getElementById('widget-notes');
  if (notesEl) {
    if (data.widgets.notes?.visible) notesEl.classList.remove('hidden');
    else notesEl.classList.add('hidden');
  }

  // 8. Init Pomodoro
  Pomodoro.init(data, data.widgets.pomodoro);
  const pomodoroEl = document.getElementById('widget-pomodoro');
  if (pomodoroEl) {
    if (data.widgets.pomodoro?.visible) pomodoroEl.classList.remove('hidden');
    else pomodoroEl.classList.add('hidden');
  }

  // 9. Init Photo
  Photo.init(data.widgets.photo);
  const photoEl = document.getElementById('widget-photo');
  if (photoEl) {
    if (data.widgets.photo?.visible) photoEl.classList.remove('hidden');
    else photoEl.classList.add('hidden');
  }

  // 10. Init Settings panel (last — needs all other modules loaded)
  Settings.init(data);

  // 9. First-install: if 'widgets' was never saved (brand-new user),
  //    apply the layout preset so all widgets appear in the reference positions.
  //    Existing users already have 'widgets' in storage → skip.
  const existingWidgets = await Storage.get('widgets');
  if (!existingWidgets) {
    // Brief delay so all widgets are fully rendered (offsetWidth/Height valid)
    requestAnimationFrame(() => {
      setTimeout(() => Settings.applyLayoutPreset(), 50);
    });
  }

  // 9. All widgets ready — fade in the container to prevent FOUC flash on load
  requestAnimationFrame(() => {
    document.getElementById('widget-container').classList.add('ready');
  });

  // 9. Fix blank video when returning to tab (Brave Memory Saver / tab discard)
  const vid = document.getElementById('wallpaper-video');
  let lastTime = -1;
  let stuckCount = 0;

  const checkVideoAlive = () => {
    if (!vid || vid.style.display === 'none') return;
    if (!vid.muted) vid.muted = true;
    if (document.visibilityState !== 'visible') return;

    // Kalo video benar-benar mati/kosong (readyState 0), paksa muat ulang
    if (vid.readyState === 0) {
      vid.load();
      return;
    }

    // Jangan intervensi jika video masih loading buffer
    if (vid.readyState < 3) return;

    const ct = vid.currentTime;

    if (vid.paused) {
      vid.play().catch(() => {});
    } else if (ct === lastTime && ct > 0) {
      stuckCount++;
      if (stuckCount >= 2) {
        // Jika nge-freeze lebih dari 2 detik, dorong sedikit framenya
        vid.currentTime = ct + 0.1;
        vid.play().catch(() => {});
        stuckCount = 0;
      }
    } else {
      stuckCount = 0;
    }

    lastTime = vid.currentTime;
  };

  let videoCheckInterval = setInterval(checkVideoAlive, 1000);

  const resumeNow = () => {
    if (vid && vid.style.display !== 'none') {
      vid.muted = true;
      if (vid.readyState === 0) {
        vid.load();
      }
      if (vid.paused) {
        vid.play().catch(() => {});
      }
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      clearInterval(videoCheckInterval);
      videoCheckInterval = setInterval(checkVideoAlive, 1000);
      resumeNow();
      setTimeout(resumeNow, 500);
    } else {
      clearInterval(videoCheckInterval);
    }
  });

  window.addEventListener('pageshow', resumeNow);

  // Fallback user interactions to satisfy browser autoplay policy if it strictly demands a gesture
  ['click', 'keydown', 'pointerdown', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, () => {
      if (vid && vid.style.display !== 'none' && vid.paused) {
        resumeNow();
      }
    }, { passive: true });
  });

})();
