(function () {
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
  var reset = document.getElementById('reset-progress');
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
  if (reset && items.length) {
    reset.hidden = false;
    reset.addEventListener('click', function () {
      state = {}; save();
      items.forEach(function (li) { li.classList.remove('is-done'); });
    });
  }

  var wakeBtn = document.getElementById('wake-toggle');
  if (wakeBtn && 'wakeLock' in navigator) {
    var lock = null;
    wakeBtn.hidden = false;
    function setLabel() { wakeBtn.textContent = lock ? 'Screen staying on ✓' : 'Keep screen on'; wakeBtn.classList.toggle('is-on', !!lock); }
    wakeBtn.addEventListener('click', function () {
      if (lock) { lock.release(); lock = null; setLabel(); return; }
      navigator.wakeLock.request('screen').then(function (l) {
        lock = l; setLabel();
        l.addEventListener('release', function () { if (lock === l) { lock = null; setLabel(); } });
      }).catch(function () {});
    });
  }
})();
