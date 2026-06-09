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
      for (const w_id in window.WORLDS) {
        const w = window.WORLDS[w_id];
        if (dict[`world_${w_id}_name`]) w.name = dict[`world_${w_id}_name`];
        if (dict[`world_${w_id}_desc`]) w.desc = dict[`world_${w_id}_desc`];
      }
    }

    if (window.STAGES) {
      for (const w_id in window.STAGES) {
        const stages = window.STAGES[w_id];
        stages.forEach((s, idx) => {
           if (dict[`world_${w_id}_stage_${idx+1}_name`]) s.name = dict[`world_${w_id}_stage_${idx+1}_name`];
        });
      }
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
