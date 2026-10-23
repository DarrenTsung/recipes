(function () {
  // Inline SVG icons so they look the same on every device (text glyphs vary by font)
  var svg = function (body) {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  };
  var ICONS = {
    // Clockwise open-circle arrow, drawn to match the look of the ↻ character
    reset: svg('<path d="M19.52 9.26A8 8 0 1 1 12 4"/><path d="M11 0.6L15.6 4L11 7.4z" fill="currentColor" stroke="none"/>'),
    moon: svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 3v1.5M12 19.5V21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M3 12h1.5M19.5 12H21M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1"/>')
  };

  // Light/dark toggle: overrides the device setting and remembers the choice
  var root = document.documentElement;
  var themeHost = document.querySelector('.crumbs') || document.querySelector('.site-header .wrap');
  if (themeHost) {
    var themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.className = 'theme-btn';
    var isDark = function () {
      return root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    };
    var label = function () {
      themeBtn.innerHTML = isDark() ? ICONS.sun : ICONS.moon;
      themeBtn.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
      themeBtn.title = themeBtn.getAttribute('aria-label');
    };
    label();
    themeBtn.addEventListener('click', function () {
      root.dataset.theme = isDark() ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
      label();
    });
    themeHost.appendChild(themeBtn);
  }

  // Home: search + category filter
  var search = document.getElementById('recipe-search');
  var chips = document.querySelectorAll('.chip[data-cat]');
  var activeCat = 'all';
  function applyFilter() {
    var q = search ? search.value.trim().toLowerCase() : '';
    var terms = q.split(/\s+/).filter(Boolean);
    document.querySelectorAll('.cat-group').forEach(function (g) {
      var catOk = activeCat === 'all' || g.dataset.cat === activeCat;
      var shown = 0;
      g.querySelectorAll('.recipe-item').forEach(function (li) {
        var hay = li.dataset.search || '';
        var ok = catOk && terms.every(function (t) { return hay.indexOf(t) !== -1; });
        li.hidden = !ok;
        if (ok) shown++;
      });
      g.hidden = shown === 0;
    });
    var none = document.querySelector('.no-results');
    if (none) none.hidden = !!document.querySelector('.cat-group:not([hidden])');
  }
  if (search) search.addEventListener('input', applyFilter);
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      activeCat = c.dataset.cat;
      chips.forEach(function (o) { o.classList.toggle('is-active', o === c); });
      applyFilter();
    });
  });
  document.addEventListener('keydown', function (e) {
    if (search && e.key === '/' && document.activeElement !== search) { e.preventDefault(); search.focus(); }
  });

  // Recipe page: tap ingredients to check off, tap a step to mark where you are
  var recipe = document.querySelector('.recipe');
  if (!recipe) return;
  var heading = recipe.querySelector('h1');
  var key = 'recipe-progress:' + (heading ? heading.textContent.trim() : location.pathname);
  var state = {};
  try { state = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}
  function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {} }
  var items = recipe.querySelectorAll('.block-ingredients li, .block-instructions > ol > li');
  items.forEach(function (li, i) {
    li.classList.add('tickable');
    if (state[i]) li.classList.add('is-done');
    li.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      e.stopPropagation();
      state[i] = !state[i];
      li.classList.toggle('is-done', state[i]);
      save();
    });
  });
  // Reset icon next to the Ingredients heading clears this recipe's checkmarks
  var ingHeading = recipe.querySelector('.block-ingredients h2');
  if (ingHeading && items.length) {
    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'reset-btn';
    reset.title = 'Reset checkmarks';
    reset.setAttribute('aria-label', 'Reset checkmarks');
    reset.innerHTML = ICONS.reset;
    ingHeading.appendChild(reset);
    reset.addEventListener('click', function () {
      state = {}; save();
      items.forEach(function (li) { li.classList.remove('is-done'); });
    });
  }

  // Keep the screen awake while a recipe is open (re-acquired when the tab comes back)
  if ('wakeLock' in navigator) {
    var lock = null;
    var acquire = function () {
      if (lock || document.visibilityState !== 'visible') return;
      navigator.wakeLock.request('screen').then(function (l) {
        lock = l;
        l.addEventListener('release', function () { lock = null; });
      }).catch(function () {});
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    // Some browsers only grant the lock after a tap
    document.addEventListener('click', acquire, { once: true });
  }
})();
