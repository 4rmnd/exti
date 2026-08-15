/* js/notes.js — Notes widget with auto-save */
const Notes = {
  el: null,
  timer: null,

  init(content = '', pos = {}) {
    this.el = document.getElementById('widget-notes');

    const ta = document.getElementById('notes-textarea');
    ta.value = content;
    ta.addEventListener('input', () => this._debounce());
  },

  _debounce() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this._save(), 1000);
  },

  async _save() {
    const content = document.getElementById('notes-textarea').value;
    await Storage.save('notesContent', content);
  }
};
