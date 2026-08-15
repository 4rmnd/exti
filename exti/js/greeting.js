/* js/greeting.js — Greeting widget */
const Greeting = {
  el: null,

  GREET_ID: {
    morning: 'Selamat pagi',
    afternoon: 'Selamat siang',
    evening: 'Selamat sore',
    night: 'Selamat malam',
  },
  GREET_EN: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
  },

  init(name = '', lang = 'id', pos = {}) {
    this.el   = document.getElementById('widget-greeting');
    this.name = name;
    this.lang = lang;
    this.render();
    setInterval(() => this.render(), 60000);
  },

  render() {
    let displayText = '';
    
    if (this.name && this.name.trim() !== '') {
      displayText = `${this.name} 👋`;
    } else {
      const h    = new Date().getHours();
      const greet = this.lang === 'id' ? this.GREET_ID : this.GREET_EN;
      let text;
      if (h >= 5  && h < 12) text = greet.morning;
      else if (h >= 12 && h < 15) text = greet.afternoon;
      else if (h >= 15 && h < 18) text = greet.evening;
      else text = greet.night;

      displayText = `${text} 👋`;
    }

    document.getElementById('greeting-text').textContent = displayText;
  },

  update(name, lang) {
    this.name = name;
    this.lang = lang;
    this.render();
  }
};
