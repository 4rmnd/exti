/* js/clock.js — Clock & Date widget */
const Clock = {
  el: null,
  interval: null,
  format: '24h',
  lang: 'id',

  DAYS_ID: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
  DAYS_EN: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  MONTHS_ID: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],
  MONTHS_EN: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],

  init(format = '24h', lang = 'id', pos = {}) {
    this.format = format;
    this.lang   = lang;
    this.el     = document.getElementById('widget-clock');
    this.tick();
    this.interval = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const now    = new Date();
    const days   = this.lang === 'id' ? this.DAYS_ID   : this.DAYS_EN;
    const months = this.lang === 'id' ? this.MONTHS_ID : this.MONTHS_EN;
    const day    = days[now.getDay()].toUpperCase();
    const date   = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    let timeStr;
    if (this.format === '12h') {
      const ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      timeStr = `${h}:${m} ${ap}`;
    } else {
      timeStr = `${String(h).padStart(2,'0')}:${m}`;
    }
    document.getElementById('clock-day').textContent  = day;
    document.getElementById('clock-date').textContent = date;
    document.getElementById('clock-time').textContent = timeStr;
  },

  destroy() { if (this.interval) clearInterval(this.interval); }
};
