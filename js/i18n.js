const I18N = (() => {
  let currentLang = localStorage.getItem('astd_lang') || 'pt';

  function getLang() { return currentLang; }

  function setLang(lang) {
    if (lang === currentLang) return;
    localStorage.setItem('astd_lang', lang);
    window.location.reload();
  }

  function t(key, vars, fallback) {
    const dict = currentLang === 'en' ? LANG_EN : LANG_PT;
    let str = dict[key] !== undefined ? dict[key] : (fallback !== undefined ? fallback : key);
    if (vars && typeof vars === 'object') {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return str;
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
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.title = t(key);
    });
  }

  function applyDataTranslations() {
    if (currentLang === 'pt') return; // Padrão
    const dict = LANG_EN;

    // Traduz Personagens
    if (typeof CHARACTERS !== 'undefined') {
      for (const id in CHARACTERS) {
        const c = CHARACTERS[id];
        if (dict[`char_${id}_name`]) c.name = dict[`char_${id}_name`];

        if (c.passive && !Array.isArray(c.passive) && dict[`char_${id}_passive`]) {
          c.passive.label = dict[`char_${id}_passive`];
        }
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

        if (c.prestige_passives) {
          [1, 5, 10].forEach(tier => {
            const pp = c.prestige_passives[tier];
            if (pp && dict[`char_${id}_prestige_${tier}`]) pp.label = dict[`char_${id}_prestige_${tier}`];
          });
        }
      }
    }

    // Traduz Mundos e Fases
    if (typeof WORLDS !== 'undefined') {
      for (const w of WORLDS) {
        if (dict[`world_${w.id}_name`]) w.name = dict[`world_${w.id}_name`];
        if (dict[`world_${w.id}_desc`]) w.description = dict[`world_${w.id}_desc`];
      }
    }

    if (typeof STAGES !== 'undefined') {
      STAGES.forEach(s => {
        if (dict[`stage_${s.id}_name`]) s.name = dict[`stage_${s.id}_name`];
      });
    }

    // Traduz Missões
    if (typeof MISSIONS_LIST !== 'undefined') {
      MISSIONS_LIST.forEach(m => {
        if (dict[`mission_${m.id}_label`]) m.label = dict[`mission_${m.id}_label`];
      });
    }
    if (typeof DAILY_MISSIONS_POOL !== 'undefined') {
      DAILY_MISSIONS_POOL.forEach(m => {
        if (dict[`mission_${m.id}_label`]) m.label = dict[`mission_${m.id}_label`];
      });
    }

    // Traduz Eventos
    if (typeof EVENTS_DATA !== 'undefined') {
      EVENTS_DATA.forEach(e => {
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
