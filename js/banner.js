const BannerSystem = (() => {
  const DURATION_MS = 30 * 60 * 1000; // 30 minutos
  const KEY = 'astd_banner_v2';

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generate() {
    const s3 = shuffle(ALL_CHARACTERS_POOL.star3).slice(0, 3);
    const s4 = shuffle(ALL_CHARACTERS_POOL.star4).slice(0, 2);
    const s5 = shuffle(ALL_CHARACTERS_POOL.star5).slice(0, 1);
    return { star3: s3, star4: s4, star5: s5, generatedAt: Date.now() };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const b = JSON.parse(raw);
        // Validate all ids still exist
        const allIds = [...b.star3, ...b.star4, ...b.star5];
        const valid = allIds.every(id => getCharById(id));
        if (valid && Date.now() - b.generatedAt < DURATION_MS) return b;
      }
    } catch(e) {}
    return null;
  }

  function saveBanner(banner) {
    try { localStorage.setItem(KEY, JSON.stringify(banner)); } catch(e) {}
  }

  function applyToPool(banner) {
    GACHA_POOL.star3 = [...banner.star3];
    GACHA_POOL.star4 = [...banner.star4];
    GACHA_POOL.star5 = [...banner.star5];
  }

  function init() {
    const existing = load();
    const banner = existing || generate();
    if (!existing) saveBanner(banner);
    applyToPool(banner);
    return banner;
  }

  function checkRotation() {
    const existing = load();
    if (!existing) {
      const fresh = generate();
      saveBanner(fresh);
      applyToPool(fresh);
      return fresh;
    }
    return null;
  }

  function timeUntilReset() {
    const b = load();
    if (!b) return 0;
    return Math.max(0, DURATION_MS - (Date.now() - b.generatedAt));
  }

  function getCurrent() {
    return load() || generate();
  }

  return { init, checkRotation, timeUntilReset, getCurrent };
})();
