const I18N = (() => {
  let currentLang = localStorage.getItem('astd_lang') || 'pt';

  function getLang() { return currentLang; }

  function setLang(lang) {
    if (lang === currentLang) return;
    localStorage.setItem('astd_lang', lang);
    window.location.reload();
  }

  function t(key) {
    const dict = currentLang === 'en' ? LANG_EN : LANG_PT;
    return dict[key] !== undefined ? dict[key] : key;
  }

  function translateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        if (el.tagName === 'INPUT' && el.type === 'placeholder') {
          el.placeholder = t(key);
        } else {
          el.innerHTML = t(key);
        }
      }
    });
  }

  function applyDataTranslations() {
    if (currentLang === 'pt') return; // Padrão
    const dict = LANG_EN;

    // Traduz Personagens
    if (window.CHARACTERS) {
      for (const id in window.CHARACTERS) {
        const c = window.CHARACTERS[id];
        if (dict[`char_${id}_name`]) c.name = dict[`char_${id}_name`];
        
        if (c.passive && dict[`char_${id}_passive`]) {
          c.passive.label = dict[`char_${id}_passive`];
        }
        // Vizard passives (array)
        if (Array.isArray(c.passive)) {
          c.passive.forEach((p, i) => {
            if (dict[`char_${id}_passive_${i}`]) p.label = dict[`char_${id}_passive_${i}`];
          });
        }
        
        if (c.active_ability && dict[`char_${id}_active`]) {
          c.active_ability.label = dict[`char_${id}_active`];
        }

        if (c.upgrades) {
          c.upgrades.forEach((u, i) => {
            if (dict[`char_${id}_upg_${i}_name`]) u.name = dict[`char_${id}_upg_${i}_name`];
            if (dict[`char_${id}_upg_${i}_desc`]) u.desc = dict[`char_${id}_upg_${i}_desc`];
          });
        }
      }
    }

    // Traduz Mundos e Fases
    if (window.WORLDS) {
      for (const w of window.WORLDS) {
        if (dict[`world_${w.id}_name`]) w.name = dict[`world_${w.id}_name`];
        if (dict[`world_${w.id}_desc`]) w.desc = dict[`world_${w.id}_desc`];
      }
    }

    if (window.STAGES) {
      window.STAGES.forEach(s => {
        if (dict[`stage_${s.id}_name`]) s.name = dict[`stage_${s.id}_name`];
      });
    }
    
    // Traduz Missões
    if (window.MISSIONS_LIST) {
      window.MISSIONS_LIST.forEach(m => {
        if (dict[`mission_${m.id}_label`]) m.label = dict[`mission_${m.id}_label`];
      });
    }
    if (window.DAILY_MISSIONS_POOL) {
      window.DAILY_MISSIONS_POOL.forEach(m => {
        if (dict[`mission_${m.id}_label`]) m.label = dict[`mission_${m.id}_label`];
      });
    }
    
    // Traduz Eventos
    if (window.EVENTS_DATA) {
      window.EVENTS_DATA.forEach(e => {
        if (dict[`event_${e.id}_name`]) e.name = dict[`event_${e.id}_name`];
        if (dict[`event_${e.id}_desc`]) e.desc = dict[`event_${e.id}_desc`];
        if (e.stages) {
          e.stages.forEach(s => {
            if (dict[`event_stage_${s.id}_name`]) s.name = dict[`event_stage_${s.id}_name`];
            if (dict[`event_stage_${s.id}_story`]) s.story = dict[`event_stage_${s.id}_story`];
            if (dict[`event_stage_${s.id}_desc`]) s.description = dict[`event_stage_${s.id}_desc`];
          });
        }
      });
    }
  }

  // Translate specific manual elements
  function updateLangSelector() {
    const selector = document.getElementById('lang-selector');
    if (selector) selector.value = currentLang;
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyDataTranslations();
    translateDOM();
    updateLangSelector();
  });

  return { getLang, setLang, t, translateDOM, applyDataTranslations };
})();
