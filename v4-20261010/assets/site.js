/* Agnes Liu — shared behaviour: nav, home focus switch, work filters, case drawer, contents menu, slides, hover motion. */
(function () {
  'use strict';
  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
  };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var FOCI = ['brand', 'product', 'print'];
  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navigation ---------- */
  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) { return; }
    var box = nav.querySelector('.nav-box'), btn = nav.querySelector('.menu-btn'), menu = nav.querySelector('.nav-menu');
    var open = false, openY = 0;
    var measure = function () { if (open) { box.style.height = (60 + menu.scrollHeight) + 'px'; } };
    var close = function (refocus) {
      open = false; nav.classList.remove('is-open'); box.style.height = '';
      btn.setAttribute('aria-expanded', 'false');
      if (refocus) { btn.focus(); }
    };
    var openMenu = function () {
      open = true; openY = window.scrollY || 0; nav.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true'); measure(); setTimeout(measure, 80); setTimeout(measure, 600);
    };
    var lastY = window.scrollY || 0, acc = 0;
    var onScroll = function () {
      var y = window.scrollY || 0, dy = y - lastY;
      lastY = y;
      nav.classList.toggle('is-boxed', y > 4);
      if (open && Math.abs(y - openY) > 48) { close(); }
      if (open || y < 120) { nav.classList.remove('is-hidden'); acc = 0; return; }
      acc = (dy > 0) === (acc > 0) ? acc + dy : dy;
      if (acc > 24) { nav.classList.add('is-hidden'); }
      else if (acc < -24) { nav.classList.remove('is-hidden'); }
    };
    nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });
    btn.addEventListener('click', function () { if (open) { close(); } else { openMenu(); } });
    nav.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { close(true); } });
    document.addEventListener('click', function (e) { if (open && !nav.contains(e.target)) { close(); } });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    onScroll();
    document.querySelectorAll('[data-copy]').forEach(function (c) {
      c.addEventListener('click', function () {
        var addr = c.getAttribute('data-copy'), label = c.textContent;
        var done = function () { c.textContent = 'Copied'; setTimeout(function () { c.textContent = label; }, 1600); };
        try { navigator.clipboard.writeText(addr).then(done, function () { c.textContent = addr; }); } catch (x) { c.textContent = addr; }
      });
    });
    document.querySelectorAll('[data-top]').forEach(function (b) { b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }); });
  }

  /* ---------- Cards ---------- */
  function card(id) {
    var D = window.AL, p = D.projects[id];
    if (!p) { return ''; }
    var ext = p.external ? ' target="_blank" rel="noopener"' : '';
    var tags = (p.status ? '<span class="tag"><span class="dot"></span>' + esc(p.status) + '</span>' : '') +
      p.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
    var hv = p.hover ? '<video class="hv" muted loop playsinline preload="none" data-src="' + esc(p.hover) + '"' + (p.auto ? ' data-auto' : '') + ' aria-hidden="true"></video>' : '';
    return '<article class="card"><a href="' + esc(p.href) + '"' + ext + '>' +
      '<div class="media"><img src="' + esc(p.img) + '" alt="' + esc(p.alt) + '" loading="lazy" style="object-position:' + esc(p.pos || '50% 50%') + '">' + hv + '</div>' +
      '<div class="text"><h3>' + esc(p.title) + (p.external ? '<span class="ext"> ↗</span>' : '') + '</h3><p class="sub">' + esc(p.sub) + '</p>' +
      '<div class="tags">' + tags + '</div></div></a></article>';
  }
  function gridHTML(ids) { return ids.map(card).join(''); }

  /* Hover: a muted clip fades in over the still, desktop only. */
  function initHover() {
    if (!canHover || reduce) { return; }
    var enter = function (m) {
      var v = m.querySelector('video.hv'); if (!v) { return; }
      if (!v.src) { v.src = v.getAttribute('data-src'); }
      var p = v.play(); m.classList.add('playing');
      if (p && p.catch) { p.catch(function () { m.classList.remove('playing'); }); }
    };
    var leave = function (m) { var v = m.querySelector('video.hv'); if (!v || v.hasAttribute('data-auto')) { return; } v.pause(); m.classList.remove('playing'); };
    document.addEventListener('mouseover', function (e) {
      var a = e.target.closest && e.target.closest('.card > a'); if (!a || a.contains(e.relatedTarget)) { return; }
      var m = a.querySelector('.media'); if (m) { enter(m); }
    });
    document.addEventListener('mouseout', function (e) {
      var a = e.target.closest && e.target.closest('.card > a'); if (!a || a.contains(e.relatedTarget)) { return; }
      var m = a.querySelector('.media'); if (m) { leave(m); }
    });
  }

  /* ---------- Home ---------- */
  function initHome() {
    var root = document.getElementById('home');
    if (!root || !window.AL) { return; }
    var D = window.AL, start = store.get('al-focus');
    var current = FOCI.indexOf(start) > -1 ? start : 'brand';
    var els = {
      role: document.getElementById('role'), h1: document.getElementById('intro'), bio: document.getElementById('bio'),
      btns: document.querySelectorAll('.focus .btn'), featLabel: document.getElementById('feat-label'), feat: document.getElementById('feat'),
      selLabel: document.getElementById('sel-label'), grid: document.getElementById('sel-grid'), swaps: document.querySelectorAll('[data-swap]'),
      lab: document.getElementById('lab'), labGrid: document.getElementById('lab-grid')
    };
    var render = function (animate) {
      var F = D.focus[current], fp = D.projects[F.featured];
      els.role.textContent = 'Agnes Liu — ' + F.role;
      els.h1.innerHTML = F.hero.map(function (h) { return h[1] ? '<em>' + esc(h[0]) + '</em>' : esc(h[0]); }).join('');
      els.bio.textContent = F.bio;
      els.btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-focus') === current ? 'true' : 'false'); });
      els.featLabel.textContent = F.label;
      var ext = fp.external ? ' target="_blank" rel="noopener"' : '';
      var tags = (fp.status ? '<span class="tag"><span class="dot"></span>' + esc(fp.status) + '</span>' : '') + fp.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
      var imp = F.impact ? '<div class="impact"><b>' + esc(F.impact[0]) + '</b><span>' + esc(F.impact[1]) + '</span></div>' : '';
      var hv = fp.hover ? '<video class="hv" muted loop playsinline preload="none" data-src="' + esc(fp.hover) + '" aria-hidden="true"></video>' : '';
      els.feat.innerHTML = '<a href="' + esc(fp.href) + '"' + ext + '><div class="media"><picture><source media="(max-width: 759px)" srcset="' + esc(fp.img) + '"><img src="' + esc(fp.hero || fp.img) + '" alt="' + esc(fp.alt) + '" style="object-position:' + esc(fp.pos || '50% 50%') + '"></picture>' + hv + '</div>' +
        '<div class="text"><div><h3>' + esc(fp.title) + '</h3><p class="sub">' + esc(fp.sub) + '</p><div class="tags">' + tags + '</div></div>' + imp + '</div></a>';
      els.selLabel.textContent = F.label;
      els.grid.innerHTML = gridHTML(F.selected);
      if (els.lab) {
        var lab = F.lab || [];
        els.lab.hidden = !lab.length;
        els.labGrid.innerHTML = gridHTML(lab);
      }
      if (animate) { els.swaps.forEach(function (el) { el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); }); }
    };
    els.btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-focus'); if (id === current) { return; }
        current = id; store.set('al-focus', id); render(true);
      });
    });
    window.ALHome = { pick: function (id) { if (FOCI.indexOf(id) > -1 && id !== current) { current = id; store.set('al-focus', id); render(true); } } };
    render(false);
    if (window.location.hash === '#featured') { setTimeout(function () { document.getElementById('featured').scrollIntoView(); }, 60); }
  }

  function initFocusLinks() {
    document.querySelectorAll('[data-focus-link]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('data-focus-link'); store.set('al-focus', id);
        if (window.ALHome) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); window.ALHome.pick(id); }
      });
    });
  }

  /* ---------- Work index ---------- */
  function initWork() {
    var root = document.getElementById('work-grid');
    if (!root || !window.AL) { return; }
    var D = window.AL, bar = document.getElementById('filters'), filter = 'all';
    var defs = [['all', 'All work']].concat(FOCI.map(function (f) { return [f, D.focus[f].label]; })).concat([['lab', 'Lab']]);
    var render = function () {
      bar.innerHTML = defs.map(function (d) {
        var n = d[0] === 'all' ? D.order.length : D.order.filter(function (id) { return D.projects[id].dirs.indexOf(d[0]) > -1; }).length;
        var on = d[0] === filter;
        return '<button type="button" class="btn' + (on ? '' : ' soft') + '" aria-pressed="' + on + '" data-f="' + d[0] + '">' + esc(d[1]) + ' <span>' + n + '</span></button>';
      }).join('');
      var vis = D.order.filter(function (id) { return filter === 'all' || D.projects[id].dirs.indexOf(filter) > -1; });
      root.innerHTML = gridHTML(vis);
    };
    bar.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) { return; } filter = b.getAttribute('data-f'); render(); });
    render();
  }

  /* ---------- Case pages ---------- */
  function initCase() {
    var panel = document.getElementById('project-info');
    if (!panel) { return; }
    var headBtn = document.querySelector('.about-btn'), bar = document.querySelector('.sticky-bar'), sticky = document.querySelector('.sticky-about'), closeBtn = panel.querySelector('.close');
    var tocBtn = document.querySelector('.toc-btn'), pop = document.getElementById('toc-pop');
    var isOpen = false, infoY = 0, trigger = null, popOpen = false;
    var setPop = function (on) {
      if (!pop) { return; }
      popOpen = on; pop.hidden = !on; tocBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    };
    var onScroll = function () {
      var y = window.scrollY || 0;
      if (isOpen && Math.abs(y - infoY) > 80) { close(); }
      var r = headBtn.getBoundingClientRect();
      var hide = isOpen || r.bottom > 0;
      bar.hidden = hide;
      if (hide && popOpen) { setPop(false); }
    };
    var open = function (e) {
      trigger = (e && e.currentTarget) || headBtn; infoY = window.scrollY || 0; isOpen = true; setPop(false);
      panel.classList.add('open'); document.body.classList.add('info-open'); headBtn.setAttribute('aria-expanded', 'true'); bar.hidden = true;
      setTimeout(function () { panel.focus({ preventScroll: true }); }, 60);
    };
    var close = function () {
      if (!isOpen) { return; }
      isOpen = false; panel.classList.remove('open'); document.body.classList.remove('info-open'); headBtn.setAttribute('aria-expanded', 'false'); onScroll();
      if (trigger && trigger.focus && trigger.offsetParent) { trigger.focus({ preventScroll: true }); }
    };
    headBtn.addEventListener('click', function (e) { if (isOpen) { close(); } else { open(e); } });
    sticky.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    var scrim = document.querySelector('.scrim'); if (scrim) { scrim.addEventListener('click', close); }
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); } });
    document.addEventListener('click', function (e) {
      if (isOpen && !panel.contains(e.target) && !headBtn.contains(e.target) && !bar.contains(e.target)) { close(); }
      if (popOpen && !pop.contains(e.target) && !tocBtn.contains(e.target)) { setPop(false); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && popOpen) { setPop(false); tocBtn.focus(); } });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Contents menu: one tap to any chapter, with the current chapter marked. */
    if (tocBtn && pop) {
      tocBtn.addEventListener('click', function () { setPop(!popOpen); });
      pop.addEventListener('click', function (e) { if (e.target.closest('a')) { setPop(false); } });
      var links = [].slice.call(pop.querySelectorAll('a[data-ch]'));
      var secs = links.map(function (a) { return document.getElementById(a.getAttribute('data-ch')); }).filter(Boolean);
      var cur = tocBtn.querySelector('.cur');
      var mark = function () {
        var y = window.scrollY + window.innerHeight * 0.3, idx = -1;
        secs.forEach(function (s, i) { if (s.getBoundingClientRect().top + window.scrollY <= y) { idx = i; } });
        links.forEach(function (a, i) { if (i === idx) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); } });
        cur.textContent = idx > -1 ? '· ' + links[idx].textContent.trim() : '';
      };
      window.addEventListener('scroll', mark, { passive: true });
      mark();
    }

    document.querySelectorAll('[data-toggle-table]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = document.getElementById(b.getAttribute('data-toggle-table')); var all = t.classList.toggle('all');
        b.textContent = all ? 'Show fewer' : b.getAttribute('data-label');
      });
    });
  }

  /* ---------- Slides: groups of similar boards that play themselves, with a bar per slide ---------- */
  function initSlides() {
    document.querySelectorAll('[data-slides]').forEach(function (f) {
      var track = f.querySelector('.sl-track'), slides = [].slice.call(f.querySelectorAll('.sl'));
      var n = f.querySelector('.sl-n'), capEl = f.querySelector('.sl-cap'), prev = f.querySelector('.sl-prev'), next = f.querySelector('.sl-next');
      var segs = [].slice.call(f.querySelectorAll('.seg'));
      var idx = -1, inView = false, hold = false, userUntil = 0;
      var auto = !reduce && 'IntersectionObserver' in window;
      if (!auto) { f.classList.add('still'); }
      var go = function (i) { i = (i + slides.length) % slides.length; track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: reduce ? 'auto' : 'smooth' }); };
      var paint = function () {
        segs.forEach(function (sg, k) {
          sg.classList.toggle('done', k < idx);
          sg.classList.remove('on');
        });
        if (segs[idx]) { void segs[idx].offsetWidth; segs[idx].classList.add('on'); }
      };
      var state = function () { f.classList.toggle('paused', !inView || hold || Date.now() < userUntil); };
      var sync = function () {
        var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (i === idx) { return; }
        idx = i; n.textContent = (i + 1) + ' / ' + slides.length; capEl.textContent = slides[i].getAttribute('data-cap');
        paint();
      };
      var user = function () { userUntil = Date.now() + 9000; state(); setTimeout(state, 9100); };
      prev.addEventListener('click', function () { user(); go(idx - 1); });
      next.addEventListener('click', function () { user(); go(idx + 1); });
      segs.forEach(function (sg, k) { sg.addEventListener('click', function () { user(); go(k); }); });
      track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); user(); go(idx + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); user(); go(idx - 1); } });
      track.addEventListener('pointerdown', user);
      track.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { user(); } }, { passive: true });
      f.addEventListener('mouseenter', function () { hold = true; state(); });
      f.addEventListener('mouseleave', function () { hold = false; state(); });
      f.addEventListener('focusin', function () { hold = true; state(); });
      f.addEventListener('focusout', function () { hold = false; state(); });
      segs.forEach(function (sg) {
        var b = sg.querySelector('b');
        b.addEventListener('animationend', function () { if (auto && sg.classList.contains('on')) { go(idx + 1); } });
      });
      var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 60); }, { passive: true });
      if (auto) {
        new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; state(); }); }, { threshold: 0.6 }).observe(track);
      }
      state(); sync();
    });
  }

  /* ---------- Scrollers: a tall artboard drifts down by itself; hover, touch or scroll to take over ---------- */
  function initScrollers() {
    document.querySelectorAll('[data-autoscroll]').forEach(function (f) {
      var win = f.querySelector('.sc-win');
      if (!win || reduce || !('IntersectionObserver' in window)) { return; }
      var inView = false, hold = false, until = 0, pos = 0, last = 0, rest = 0;
      var speed = 34;
      var tick = function (ts) {
        var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
        if (inView && !hold && Date.now() > until) {
          var max = win.scrollHeight - win.clientHeight;
          if (rest > 0) { rest -= dt; if (rest <= 0 && pos >= max - 1) { pos = 0; win.scrollTo({ top: 0, behavior: 'smooth' }); rest = 1.6; } }
          else {
            pos = Math.min(max, pos + speed * dt);
            win.scrollTop = pos;
            if (pos >= max - 1) { rest = 1.8; }
          }
        } else { pos = win.scrollTop; }
        requestAnimationFrame(tick);
      };
      var take = function () { until = Date.now() + 4000; pos = win.scrollTop; };
      win.addEventListener('mouseenter', function () { hold = true; });
      win.addEventListener('mouseleave', function () { hold = false; take(); });
      win.addEventListener('wheel', take, { passive: true });
      win.addEventListener('touchstart', take, { passive: true });
      win.addEventListener('keydown', take);
      new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; }); }, { threshold: 0.5 }).observe(win);
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Cards that move by themselves while on screen ---------- */
  function initAutoCards() {
    if (reduce || !('IntersectionObserver' in window)) { return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target, m = v.parentNode;
        if (e.isIntersecting) {
          if (!v.src) { v.src = v.getAttribute('data-src'); }
          var p = v.play(); m.classList.add('playing');
          if (p && p.catch) { p.catch(function () { m.classList.remove('playing'); }); }
        } else { v.pause(); }
      });
    }, { threshold: 0.35 });
    var scan = function () { document.querySelectorAll('video.hv[data-auto]:not([data-io])').forEach(function (v) { v.setAttribute('data-io', ''); v.muted = true; io.observe(v); }); };
    scan();
    ['work-grid', 'sel-grid', 'lab-grid'].forEach(function (id) {
      var g = document.getElementById(id);
      if (g && 'MutationObserver' in window) { new MutationObserver(scan).observe(g, { childList: true }); }
    });
  }

  /* ---------- Motion: loops play only while on screen ---------- */
  function initMotion() {
    var vids = document.querySelectorAll('video[data-loop]');
    if (!vids.length || reduce || !('IntersectionObserver' in window)) { return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var p = v.play(); if (p && p.catch) { p.catch(function () {}); } } else { v.pause(); }
      });
    }, { rootMargin: '120px 0px' });
    vids.forEach(function (v) { v.muted = true; io.observe(v); });
  }

  /* ---------- Images: lazy first, then fetch the rest quietly so nothing waits on scroll ---------- */
  var ready = false, busy = false;
  function fillImages() {
    if (!ready || busy) { return; }
    busy = true;
    var step = function () {
      var batch = [].slice.call(document.querySelectorAll('img[loading="lazy"]'), 0, 3);
      batch.forEach(function (img) { img.loading = 'eager'; });
      if (batch.length) { setTimeout(step, 250); } else { busy = false; }
    };
    step();
  }
  function initImages() {
    var go = function () { setTimeout(function () { ready = true; fillImages(); }, 700); };
    if (document.readyState === 'complete') { go(); } else { window.addEventListener('load', go); }
    ['work-grid', 'sel-grid', 'lab-grid'].forEach(function (id) {
      var g = document.getElementById(id);
      if (g && 'MutationObserver' in window) { new MutationObserver(fillImages).observe(g, { childList: true }); }
    });
  }

  /* New page visits start at the top; back/forward keeps the browser's own scroll restore. */
  function initTop() {
    try {
      var nt = performance.getEntriesByType('navigation')[0];
      if (nt && nt.type === 'navigate' && !window.location.hash) { window.scrollTo(0, 0); }
    } catch (e) {}
  }

  var boot = function () { initTop(); initNav(); initHome(); initFocusLinks(); initWork(); initCase(); initSlides(); initScrollers(); initMotion(); initImages(); initHover(); initAutoCards(); };
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
