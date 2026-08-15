/* js/pomodoro.js — Pomodoro Timer widget */
const Pomodoro = {
  el: null,
  workMin: 25,
  breakMin: 5,
  autoStart: false,
  sessions: 0,
  isRunning: false,
  isBreak: false,
  remaining: 0,
  interval: null,
  lang: 'id',

  init(data = {}, pos = {}) {
    this.el        = document.getElementById('widget-pomodoro');
    this.workMin   = data.pomodoroWork    ?? 25;
    this.breakMin  = data.pomodoroBreak   ?? 5;
    this.autoStart = data.pomodoroAutoStart ?? false;
    this.sessions  = data.pomodoroSessions  ?? 0;
    this.lang      = data.appLang ?? data.clockLang ?? 'en';
    this.remaining = this.workMin * 60;

    this.updateDisplay();
    this.updateSessions();

    const startBtn = document.getElementById('pomo-start');
    if (startBtn) {
      startBtn.textContent = this.lang === 'id' ? '▶ Mulai' : '▶ Start';
    }

    document.getElementById('pomo-start').addEventListener('click', () => this.toggleTimer());
    document.getElementById('pomo-reset').addEventListener('click', () => this.reset());
  },

  toggleTimer() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  },

  start() {
    this.isRunning = true;
    const btn = document.getElementById('pomo-start');
    btn.textContent = '⏸ Pause';
    btn.classList.add('running');
    this.interval = setInterval(() => this.tick(), 1000);
  },

  pause() {
    this.isRunning = false;
    clearInterval(this.interval);
    const btn = document.getElementById('pomo-start');
    btn.textContent = this.lang === 'id' ? '▶ Lanjut' : '▶ Resume';
    btn.classList.remove('running');
  },

  reset() {
    clearInterval(this.interval);
    this.isRunning = false;
    this.isBreak   = false;
    this.remaining = this.workMin * 60;
    const btn = document.getElementById('pomo-start');
    btn.textContent = this.lang === 'id' ? '▶ Mulai' : '▶ Start';
    btn.classList.remove('running');
    document.getElementById('pomodoro-mode').textContent = this.lang === 'id' ? 'Waktu Kerja' : 'Work Time';
    document.getElementById('pomodoro-display').classList.remove('break-mode');
    document.getElementById('pomodoro-display').classList.add('work-mode');
    this.updateDisplay();
  },

  tick() {
    this.remaining--;
    this.updateDisplay();
    if (this.remaining <= 0) {
      this.onComplete();
    }
  },

  onComplete() {
    clearInterval(this.interval);
    this.isRunning = false;

    if (!this.isBreak) {
      // Work session ended
      this.sessions++;
      Storage.save('pomodoroSessions', this.sessions);
      this.updateSessions();

      if (this.breakMin <= 0) {
        // Skip break if set to 0 minutes
        this.notify(
          this.lang === 'id' ? 'Waktu kerja selesai! Langsung ke sesi berikutnya.' : 'Work time done! Moving to next session.',
          this.lang === 'id' ? 'Exti Pomodoro' : 'Exti Pomodoro'
        );
        this.remaining = this.workMin * 60;
      } else {
        this.notify(
          this.lang === 'id' ? 'Waktu kerja selesai! Istirahat dulu.' : 'Work time done! Take a break.',
          this.lang === 'id' ? 'Exti Pomodoro' : 'Exti Pomodoro'
        );
        this.isBreak   = true;
        this.remaining = this.breakMin * 60;
        document.getElementById('pomodoro-mode').textContent = this.lang === 'id' ? 'Istirahat' : 'Break';
        document.getElementById('pomodoro-display').classList.add('break-mode');
        document.getElementById('pomodoro-display').classList.remove('work-mode');
      }
    } else {
      // Break ended
      this.notify(
        this.lang === 'id' ? 'Istirahat selesai! Kembali kerja.' : 'Break done! Back to work.',
        'Exti Pomodoro'
      );
      this.isBreak   = false;
      this.remaining = this.workMin * 60;
      document.getElementById('pomodoro-mode').textContent = this.lang === 'id' ? 'Waktu Kerja' : 'Work Time';
      document.getElementById('pomodoro-display').classList.remove('break-mode');
      document.getElementById('pomodoro-display').classList.add('work-mode');
    }

    this.updateDisplay();
    const btn = document.getElementById('pomo-start');
    btn.classList.remove('running');

    if (this.autoStart) {
      btn.textContent = '⏸ Pause';
      this.start();
    } else {
      btn.textContent = this.lang === 'id' ? '▶ Mulai' : '▶ Start';
    }
  },

  updateDisplay() {
    const m = Math.floor(this.remaining / 60);
    const s = this.remaining % 60;
    document.getElementById('pomodoro-display').textContent =
      `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  },

  updateSessions() {
    const label = this.lang === 'id'
      ? `${this.sessions} sesi selesai`
      : `${this.sessions} session${this.sessions !== 1 ? 's' : ''} done`;
    document.getElementById('pomodoro-sessions').textContent = label;
  },

  notify(message, title = 'Exti') {
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title,
        message,
      });
    } else if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => {
          if (p === 'granted') new Notification(title, { body: message });
        });
      }
    }
  },

  updateSettings(workMin, breakMin, autoStart) {
    this.workMin   = workMin;
    this.breakMin  = breakMin;
    this.autoStart = autoStart;
    if (!this.isRunning) this.reset();
  }
};
