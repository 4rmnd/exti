/* js/todo.js — Todo List widget */
const Todo = {
  el: null,
  todos: [],

  init(todos = [], pos = {}) {
    this.el    = document.getElementById('widget-todo');
    this.todos = todos;
    this.render();

    const input = document.getElementById('todo-input');
    document.getElementById('todo-add-btn').addEventListener('click', () => this.addTask());
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.addTask(); });
  },

  render() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    const visible = this.todos.slice(0, 10);
    visible.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.dataset.todoId = todo.id;

      const check = document.createElement('button');
      check.className = 'todo-checkbox';
      check.addEventListener('click', () => this.toggle(todo.id));

      const text = document.createElement('span');
      text.className   = 'todo-text';
      text.textContent = todo.text;

      const del = document.createElement('button');
      del.className   = 'todo-delete';
      del.textContent = '×';
      del.addEventListener('click', () => this.delete(todo.id));

      li.appendChild(check);
      li.appendChild(text);
      li.appendChild(del);
      list.appendChild(li);
    });
  },

  async addTask() {
    const input = document.getElementById('todo-input');
    const text  = input.value.trim();
    if (!text) return;
    this.todos.unshift({ id: Date.now().toString(), text, done: false });
    input.value = '';
    await this._save();
    this.render();
  },

  async toggle(id) {
    const t = this.todos.find(t => t.id === id);
    if (!t) return;
    t.done = true;
    await this._save();
    this.render();

    // Wait for next frame so DOM updates
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const li = document.querySelector(`[data-todo-id="${id}"]`);
        if (!li) return;
        const check = li.querySelector('.todo-checkbox');
        if (!check) return;

        // Add done class to show checkmark
        check.classList.add('done');

        // Wait for checkmark to be visible (~200ms)
        setTimeout(() => {
          li.style.transition = 'opacity 0.3s ease, transform 0.3s ease, max-height 0.35s ease, margin 0.3s ease, padding 0.3s ease';
          li.style.opacity = '0';
          li.style.transform = 'translateX(-10px)';
          li.style.maxHeight = '0';
          li.style.marginBottom = '0';
          li.style.padding = '0';

          // After animation done, remove from list
          setTimeout(() => {
            this.todos = this.todos.filter(t => t.id !== id);
            this._save();
            this.render();
          }, 350);
        }, 200);
      });
    });
  },

  async delete(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    await this._save();
    this.render();
  },

  async _save() { await Storage.save('todos', this.todos); }
};
