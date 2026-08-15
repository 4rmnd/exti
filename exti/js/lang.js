/* js/lang.js — Language Dictionary and Translation Helper */
const TRANSLATIONS = {
  en: {
    // Bento back button
    'bento-back-btn': '⬅ Back',
    // Wallpaper card
    'wallpaper-title': '🎨 Wallpaper',
    'wallpaper-preset-liquid': 'Liquid Chrome',
    'wallpaper-preset-dark': 'Dark Minimal',
    'wallpaper-upload-photo': 'Upload Photo',
    'wallpaper-upload-video': 'Upload Video',
    'wallpaper-url-placeholder': 'URL (jpg/png/mp4)',
    'wallpaper-url-apply': 'Apply',
    'wallpaper-clear-custom': '✕ Clear Custom',
    'wallpaper-exit': '← Exit',
    'wallpaper-save': 'Save',
    // Widgets card
    'widgets-title': '🧩 Widgets',
    'widget-tile-clock': 'Clock',
    'widget-tile-links': 'Links',
    'widget-tile-greeting': 'Hi',
    'widget-tile-todo': 'Todo',
    'widget-tile-notes': 'Notes',
    'widget-tile-pomodoro': 'Pomo',
    'widget-tile-photo': 'Photo',
    'btn-customize-layout': 'Customize Layout',
    // Widget detail headers & fields
    'ws-back-btn-text': 'Widgets',
    'ws-show-widget': 'Show Widget',
    // Clock panel
    'ws-clock-format-label': 'Clock Format',
    'ws-clock-format-24': '24 Hour',
    'ws-clock-format-12': '12 Hour (AM/PM)',
    'ws-clock-lang-label': 'Language',
    // Links panel
    'ws-links-add': '+ Add Link',
    'ws-links-target': 'Open in New Tab',
    // Greeting panel
    'ws-greeting-name-label': 'Name',
    'ws-greeting-name-placeholder': 'Your name...',
    // Todo panel
    'ws-todo-info': '📋 Add and manage tasks directly from the Todo widget on screen.',
    // Notes panel
    'ws-notes-info': '📝 Your notes are automatically saved as you type.',
    // Pomodoro panel
    'ws-pomo-work-label': 'Work (minutes)',
    'ws-pomo-break-label': 'Break (minutes)',
    'ws-pomo-auto-start': 'Auto-start',
    // Photo panel
    'ws-photo-size-label': 'Size',
    'ws-photo-size-1x1': 'Small Square (1:1)',
    'ws-photo-size-2x2': 'Large Square (2:2)',
    'ws-photo-size-2x3': 'Portrait (2:3)',
    'ws-photo-size-3x2': 'Landscape (3:2)',
    'ws-photo-size-16x9': 'Wide (16:9)',
    'ws-photo-size-custom': 'Custom (Drag to Resize)',
    'ws-photo-upload': '📷 Upload Photo',
    'ws-photo-clear': '✕ Remove Photo',
    // Widgets themselves
    'widget-label-tasks': 'TASKS',
    'widget-todo-placeholder': 'Add new task...',
    'widget-label-notes': 'NOTES',
    'widget-notes-placeholder': 'Type your notes...',
    'widget-pomo-reset': '↺ Reset',
    // Customize overlay
    'customize-reset-btn': '↩ Reset Layout',
    'customize-hint': '✶ Drag widgets to reposition them',
    'customize-done-btn': '✓ Done',
    // Modal Quicklink
    'modal-link-title': 'Add Quick Link',
    'modal-link-name-placeholder': 'Name (e.g. YouTube)',
    'modal-link-url-placeholder': 'URL (e.g. https://youtube.com)',
    'modal-link-icon-label': 'Upload Icon (Optional)',
    'modal-link-file-label': '📁 Choose File',
    'modal-link-save': 'Save',
    'modal-link-cancel': 'Cancel',
    // Modal Confirm
    'modal-confirm-title': 'Change Wallpaper?',
    'modal-confirm-desc': 'You are currently using a custom wallpaper. Are you sure you want to change to the default look? Custom wallpaper will be deleted.',
    'modal-confirm-yes': 'Yes, Change',
    'modal-confirm-no': 'Cancel',
    // Settings titles inside widget settings sub-panel (WIDGET_META label translation)
    'widget-meta-clock': 'Clock',
    'widget-meta-quicklinks': 'Links',
    'widget-meta-greeting': 'Hi',
    'widget-meta-todo': 'Todo',
    'widget-meta-notes': 'Notes',
    'widget-meta-pomodoro': 'Pomo',
    'widget-meta-photo': 'Photo',
    // Reset Data
    'general-danger-zone': 'Danger Zone',
    'general-reset-data': 'Reset Data',
    'btn-reset-all': '🗑️ Reset All Data',
    'quicklinks-add-tooltip': 'Add link',
    'customize-reset-tooltip': 'Reset widget positions to default presets',
  },
  id: {
    // Bento back button
    'bento-back-btn': '⬅ Kembali',
    // Wallpaper card
    'wallpaper-title': '🎨 Wallpaper',
    'wallpaper-preset-liquid': 'Liquid Chrome',
    'wallpaper-preset-dark': 'Dark Minimal',
    'wallpaper-upload-photo': 'Upload Photo',
    'wallpaper-upload-video': 'Upload Video',
    'wallpaper-url-placeholder': 'URL (jpg/png/mp4)',
    'wallpaper-url-apply': 'Apply',
    'wallpaper-clear-custom': '✕ Hapus Custom',
    'wallpaper-exit': '← Exit',
    'wallpaper-save': 'Save',
    // Widgets card
    'widgets-title': '🧩 Widgets',
    'widget-tile-clock': 'Clock',
    'widget-tile-links': 'Links',
    'widget-tile-greeting': 'Hi',
    'widget-tile-todo': 'Todo',
    'widget-tile-notes': 'Notes',
    'widget-tile-pomodoro': 'Pomo',
    'widget-tile-photo': 'Foto',
    'btn-customize-layout': 'Customize Layout',
    // Widget detail headers & fields
    'ws-back-btn-text': 'Widgets',
    'ws-show-widget': 'Tampilkan Widget',
    // Clock panel
    'ws-clock-format-label': 'Format Jam',
    'ws-clock-format-24': '24 Jam',
    'ws-clock-format-12': '12 Jam (AM/PM)',
    'ws-clock-lang-label': 'Bahasa',
    // Links panel
    'ws-links-add': '+ Tambah Link',
    'ws-links-target': 'Buka di Tab Baru',
    // Greeting panel
    'ws-greeting-name-label': 'Nama',
    'ws-greeting-name-placeholder': 'Nama kamu...',
    // Todo panel
    'ws-todo-info': '📋 Tambah dan kelola task langsung dari widget Todo di layar.',
    // Notes panel
    'ws-notes-info': '📝 Catatanmu otomatis tersimpan saat kamu mengetik.',
    // Pomodoro panel
    'ws-pomo-work-label': 'Kerja (menit)',
    'ws-pomo-break-label': 'Istirahat (menit)',
    'ws-pomo-auto-start': 'Auto-start',
    // Photo panel
    'ws-photo-size-label': 'Ukuran',
    'ws-photo-size-1x1': 'Kotak Kecil (1:1)',
    'ws-photo-size-2x2': 'Kotak Besar (2:2)',
    'ws-photo-size-2x3': 'Potret (2:3)',
    'ws-photo-size-3x2': 'Lanskap (3:2)',
    'ws-photo-size-16x9': 'Lebar (16:9)',
    'ws-photo-size-custom': 'Custom (Bebas)',
    'ws-photo-upload': '📷 Upload Foto',
    'ws-photo-clear': '✕ Hapus Foto',
    // Widgets themselves
    'widget-label-tasks': 'TUGAS',
    'widget-todo-placeholder': 'Tambah task baru...',
    'widget-label-notes': 'CATATAN',
    'widget-notes-placeholder': 'Ketik catatanmu...',
    'widget-pomo-reset': '↺ Reset',
    // Customize overlay
    'customize-reset-btn': '↩ Reset Layout',
    'customize-hint': '✶ Geser widget untuk mengubah posisi',
    'customize-done-btn': '✓ Selesai',
    // Modal Quicklink
    'modal-link-title': 'Tambah Quick Link',
    'modal-link-name-placeholder': 'Nama (contoh: YouTube)',
    'modal-link-url-placeholder': 'URL (contoh: https://youtube.com)',
    'modal-link-icon-label': 'Upload Icon (Opsional)',
    'modal-link-file-label': '📁 Pilih File',
    'modal-link-save': 'Simpan',
    'modal-link-cancel': 'Batal',
    // Modal Confirm
    'modal-confirm-title': 'Ganti Wallpaper?',
    'modal-confirm-desc': 'Anda sedang menggunakan custom wallpaper. Yakin ingin mengganti ke tampilan default? Custom wallpaper akan dihapus.',
    'modal-confirm-yes': 'Ya, Ganti',
    'modal-confirm-no': 'Batal',
    // Settings titles inside widget settings sub-panel (WIDGET_META label translation)
    'widget-meta-clock': 'Clock',
    'widget-meta-quicklinks': 'Links',
    'widget-meta-greeting': 'Hi',
    'widget-meta-todo': 'Todo',
    'widget-meta-notes': 'Notes',
    'widget-meta-pomodoro': 'Pomo',
    'widget-meta-photo': 'Foto',
    // Reset Data
    'general-danger-zone': 'Zona Bahaya',
    'general-reset-data': 'Reset Data',
    'btn-reset-all': '🗑️ Reset Semua Data',
    'quicklinks-add-tooltip': 'Tambah link',
    'customize-reset-tooltip': 'Reset posisi widget ke preset default',
  }
};

function translateUI(lang = 'en') {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Set html lang attribute
  document.documentElement.setAttribute('lang', lang);

  // Translate elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) {
      // If element has a span with i18n inside it, or if it is just a plain text
      // Let's check if the element contains children that we shouldn't overwrite.
      // Usually, if we only set textContent, any child SVG or HTML elements will be lost.
      // For elements like `bento-back-btn` or buttons that only have text, we can overwrite.
      // If we have an icon/svg inside, we must be careful.
      // In our design:
      // - `<button class="customize-layout-btn"><span>✦</span> <span data-i18n="...">...</span></button>` (svg/span preserved because data-i18n is on the inner span)
      // - For other buttons/labels, we did not mix SVG with text directly on the data-i18n node.
      el.textContent = t[key];
    }
  });

  // Translate elements with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) {
      el.placeholder = t[key];
    }
  });

  // Translate elements with data-i18n-title attribute
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (t[key] !== undefined) {
      el.title = t[key];
    }
  });
}

// Expose functions globally
window.translateUI = translateUI;
window.TRANSLATIONS = TRANSLATIONS;
