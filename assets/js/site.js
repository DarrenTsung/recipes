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

  // "Source" tooltip (sources without a link): tap to toggle, tap elsewhere to close
  document.querySelectorAll('.source-tip').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
    });
    document.addEventListener('click', function () { btn.setAttribute('aria-expanded', 'false'); });
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

  // Portion scaling: a −/+ picker under Ingredients scales the amounts on the page.
  // Base yield comes from `yield:` front matter (e.g. 4 servings); without it the
  // picker scales the batch (1× = as written). What scales:
  //   - the amount at the start of an ingredient line ("1½ cups", "2-3", "~90g")
  //   - amounts in parentheses on that line ("(808g)", "(about 6 slices)", "(2½ × ½ cup)" scales the 2½)
  //   - in the steps, only amounts with a weight/volume unit ("1/4 cup olive oil", "30g")
  // What doesn't: package sizes right after a count ("1 (14.5 oz) can"), "### Per bowl" groups,
  // and ingredient lines marked `- {:.no-scale} ...` in the Markdown.
  (function () {
    var FR = { '¼': .25, '½': .5, '¾': .75, '⅛': .125, '⅜': .375, '⅝': .625, '⅞': .875, '⅓': 1 / 3, '⅔': 2 / 3 };
    var UNI = '[¼½¾⅛⅜⅝⅞⅓⅔]';
    var QTY = '(?:\\d+ \\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?' + UNI + '?|' + UNI + ')';
    var SEP = '\\s*(?:-|–|to)\\s*';
    var UNIT = '(?:kg|g|ml|cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?)\\b';
    var LEAD = new RegExp('^(\\s*(?:~|about\\s+)?)(' + QTY + ')(?:(' + SEP + ')(' + QTY + '))?');
    var ANY = new RegExp(QTY, 'g');
    var WITH_UNIT = new RegExp('(' + QTY + ')(?:(' + SEP + ')(' + QTY + '))?(?=\\s?' + UNIT + ')', 'gi');
    var SIZE_AFTER = /^\s*(?:(?:cans?|packages?|packets?|pieces?|jars?|bags?|blocks?)\s*)?\(/i;

    function parse(s) {
      var m;
      if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) return +m[1] + m[2] / m[3];
      if ((m = s.match(/^(\d+)\/(\d+)$/))) return m[1] / m[2];
      var last = s.slice(-1);
      if (FR[last] !== undefined) return (s.length > 1 ? +s.slice(0, -1) : 0) + FR[last];
      return +s;
    }
    var SNAP = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'], [1, '']];
    function fraction(v) {
      if (v >= 10) v = Math.round(v * 2) / 2;
      var whole = Math.floor(v), rest = v - whole, best = SNAP[0];
      SNAP.forEach(function (c) { if (Math.abs(c[0] - rest) < Math.abs(best[0] - rest)) best = c; });
      if (best[0] === 1) { whole += 1; best = SNAP[0]; }
      if (!whole && !best[1]) return '⅛';
      return (whole ? whole : '') + best[1];
    }
    function decimal(v, places) {
      var p = Math.pow(10, places);
      return String(Math.round(v * p) / p);
    }
    function format(span, factor) {
      var v = +span.dataset.v * factor;
      if (span.dataset.k === 'm') return v >= 10 ? String(Math.round(v)) : decimal(v, 1);
      if (span.dataset.k === 'd') return decimal(v, 2);
      return fraction(v);
    }

    // Split a text node into text + <span class="qty"> pieces for the given [start, end] ranges
    function wrap(node, ranges) {
      if (!ranges.length) return;
      ranges.sort(function (a, b) { return a[0] - b[0]; });
      var text = node.nodeValue, frag = document.createDocumentFragment(), at = 0;
      ranges.forEach(function (r) {
        if (r[0] < at) return;
        frag.appendChild(document.createTextNode(text.slice(at, r[0])));
        var raw = text.slice(r[0], r[1]), span = document.createElement('span');
        span.className = 'qty';
        span.textContent = raw;
        span.dataset.o = raw;
        span.dataset.v = parse(raw);
        var after = text.slice(r[1]);
        span.dataset.k = /^\s?(?:kg|g|ml|mg)\b/i.test(after) ? 'm' : raw.indexOf('.') !== -1 ? 'd' : 'f';
        frag.appendChild(span);
        at = r[1];
      });
      frag.appendChild(document.createTextNode(text.slice(at)));
      node.parentNode.replaceChild(frag, node);
    }
    function textNodes(el) {
      var out = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) { return n.parentNode.closest('a, code') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
      });
      while (walk.nextNode()) out.push(walk.currentNode);
      return out;
    }
    function inPerBowl(li) {
      var el = li.closest('ul, ol');
      while (el && (el = el.previousElementSibling)) {
        if (el.tagName === 'H3') return /^per\b/i.test(el.textContent.trim());
        if (el.tagName === 'H2') return false;
      }
      return false;
    }
    // Ingredient line: leading amount, plus amounts inside parentheses (not package sizes)
    function markIngredient(li) {
      if (li.classList.contains('no-scale') || inPerBowl(li)) return;
      // Loose lists wrap items in <p>, so skip whitespace-only text nodes when finding the start
      var nodes = textNodes(li).filter(function (n) { return /\S/.test(n.nodeValue); }), skipFirstParen = false;
      nodes.forEach(function (node, i) {
        var text = node.nodeValue, ranges = [];
        if (i === 0) {
          var m = text.match(LEAD);
          if (m) {
            var s1 = m[1].length;
            ranges.push([s1, s1 + m[2].length]);
            var end = s1 + m[2].length;
            if (m[4]) { var s2 = end + m[3].length; ranges.push([s2, s2 + m[4].length]); end = s2 + m[4].length; }
            if (SIZE_AFTER.test(text.slice(end))) skipFirstParen = true;
          }
        }
        var re = /\(([^()]*)\)/g, p, first = true;
        while ((p = re.exec(text))) {
          if (i === 0 && first && skipFirstParen) { first = false; continue; }
          first = false;
          var inner = p[1], base = p.index + 1, q;
          ANY.lastIndex = 0;
          while ((q = ANY.exec(inner))) {
            var before = inner.slice(0, q.index), after = inner.slice(q.index + q[0].length);
            if (/[\w.\/]$/.test(before) || /(?:×|\bx)\s*$/.test(before)) continue; // mid-word, or the "½ cup" in "2½ × ½ cup"
            if (/^(?:-?inch|\s*in\b|"|°|x\d)/i.test(after)) continue; // sizes like 2-inch, 4x3
            if (/^-[a-z]/i.test(after) || /[a-z]-$/i.test(before)) continue; // "1-to-1"
            ranges.push([base + q.index, base + q.index + q[0].length]);
          }
        }
        // Any other amount with a unit, e.g. "6 fish balls or 4 oz fish cake" (outside a package-size paren)
        var skipEnd = -1;
        if (i === 0 && skipFirstParen) { var o = text.indexOf('('); skipEnd = text.indexOf(')', o); }
        unitRanges(text).forEach(function (r) {
          if (r[0] < skipEnd) return;
          if (ranges.some(function (x) { return r[0] < x[1] && x[0] < r[1]; })) return;
          ranges.push(r);
        });
        wrap(node, ranges);
      });
    }
    function unitRanges(text) {
      var ranges = [], m;
      WITH_UNIT.lastIndex = 0;
      while ((m = WITH_UNIT.exec(text))) {
        var before = text.slice(0, m.index);
        if (/[\w.\/°-]$/.test(before) || /(?:×|\bx)\s*$/.test(before)) continue;
        ranges.push([m.index, m.index + m[1].length]);
        if (m[3]) { var s2 = m.index + m[1].length + m[2].length; ranges.push([s2, s2 + m[3].length]); }
      }
      return ranges;
    }
    // Steps: only amounts followed by a weight/volume unit
    function markStep(li) {
      textNodes(li).forEach(function (node) { wrap(node, unitRanges(node.nodeValue)); });
    }

    var ing = recipe.querySelector('.block-ingredients');
    if (!ing) return;
    ing.querySelectorAll('li').forEach(markIngredient);
    recipe.querySelectorAll('.block-instructions li').forEach(markStep);
    var spans = recipe.querySelectorAll('.qty');
    if (!ing.querySelector('.qty')) return;

    var base = parseFloat(recipe.dataset.yield) || 0;
    var unit = recipe.dataset.yieldUnit || 'servings';
    var step = base ? (base % 1 ? 0.5 : 1) : 0.5;
    var start = base || 1;
    var scaleKey = 'recipe-scale:' + location.pathname;
    var n = start;
    try { var saved = parseFloat(localStorage.getItem(scaleKey)); if (saved > 0) n = saved; } catch (e) {}

    var bar = document.createElement('div');
    bar.className = 'scaler';
    bar.innerHTML =
      (base ? '' : '<span class="scaler-label">Scale</span>') +
      '<button type="button" class="scaler-btn" data-d="-1" aria-label="Fewer">−</button>' +
      '<span class="scaler-val" aria-live="polite"></span>' +
      '<button type="button" class="scaler-btn" data-d="1" aria-label="More">+</button>' +
      '<button type="button" class="scaler-reset">Reset</button>';
    var hint = document.createElement('p');
    hint.className = 'scaler-hint';
    hint.textContent = 'Pan size and cook times stay as written.';
    var heading = ing.querySelector('h2');
    heading.parentNode.insertBefore(bar, heading.nextSibling);
    bar.parentNode.insertBefore(hint, bar.nextSibling);
    var val = bar.querySelector('.scaler-val'), resetBtn = bar.querySelector('.scaler-reset');

    function render() {
      var factor = n / start;
      if (base) {
        var label = unit;
        if (n === 1 && /s$/.test(unit)) label = unit.slice(0, -1);
        val.textContent = fraction(n) + ' ' + label;
      } else {
        val.textContent = fraction(n) + '×';
      }
      spans.forEach(function (s) {
        var scaled = factor !== 1;
        s.textContent = scaled ? format(s, factor) : s.dataset.o;
        s.classList.toggle('is-scaled', scaled);
      });
      resetBtn.hidden = factor === 1;
      hint.hidden = factor === 1;
      bar.querySelector('[data-d="-1"]').disabled = n - step < step / 2;
      try { if (factor === 1) localStorage.removeItem(scaleKey); else localStorage.setItem(scaleKey, n); } catch (e) {}
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b === resetBtn) n = start;
      else n = Math.max(step, Math.round((n + step * +b.dataset.d) / step) * step);
      render();
    });
    render();
  })();

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
