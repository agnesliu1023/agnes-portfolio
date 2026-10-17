/* Cargo adapter for the approved Agnes Liu portfolio. Original design stays in its own shadow root. */
(function () {
  'use strict';
  if (window.self !== window.top || /[?&]cargo(?:[=&]|$)/.test(location.search) || window.__alV4Booted) return;
  var script = document.currentScript;
  var BASE = new URL('../', script.src).href;
  var canonical = {
    'index.html': '/', 'work.html': '/work_all', 'about.html': '/about',
    'honor.html': '/honor', 'tcl-olympics.html': '/milan-2026-winter-olympics-tcl',
    'shenzhen.html': '/amazing-shenzhen', 'goomi.html': '/goomi',
    'tcl-social.html': '/tcl-set-1', 'involution.html': '/involution-set',
    'chatez.html': '/%E8%81%8A%E6%98%93-1', 'rainnet.html': '/rainnet-set',
    'risd.html': '/risd-m-set', 'echoes.html': '/echoes-pattern-path-set',
    'radiant.html': '/radiant-set', 'still-i-rise.html': '/still-i-rise-set',
    'art.html': '/work_artpainting',
    'floats.html': '/work_all?project=shanghai-tourism-festival-floats',
    'chatez-brand.html': '/work_all?project=chatez-identity'
  };
  var aliases = {
    '': ['index.html'], 'work_campaign': ['index.html', 'brand'], 'work_branding': ['index.html', 'brand'],
    'work_digital-product': ['index.html', 'product'], 'work_digital-product-1': ['index.html', 'product'],
    'work_printillustration': ['index.html', 'print'], 'work_printillustration-1': ['index.html', 'print'],
    'honor-set': ['honor.html'], 'honor-set-1': ['honor.html'],
    'tcl-set': ['tcl-olympics.html'], 'tcl-set-2': ['tcl-olympics.html'],
    'amazing-shenzhen-set': ['shenzhen.html'], 'amazing-shenzhen-set-1': ['shenzhen.html'],
    'goomi-set': ['goomi.html'], 'goomi-set-1': ['goomi.html'],
    'tcl-social': ['tcl-social.html'], 'involution': ['involution.html'],
    'chatez': ['chatez.html'], '聊易': ['chatez.html'], 'rainnet': ['rainnet.html'],
    'risd': ['risd.html'], 'echoes': ['echoes.html'], 'radiant': ['radiant.html'],
    'still-i-rise': ['still-i-rise.html'],
    'art': ['art.html'], 'art-and-painting': ['art.html'], 'art-and-painting-descriptions': ['art.html'],
    '?shanghai-tourism-festival-floats': ['floats.html'],
    '?chatez-identity': ['chatez-brand.html']
  };
  function slug(s) { try { return decodeURIComponent(s.replace(/^\/+|\/+$/g, '')).toLowerCase(); } catch (e) { return s; } }
  Object.keys(canonical).forEach(function (file) { aliases[slug(canonical[file])] = [file]; aliases[file] = [file]; });
  /* Pages without their own Cargo page live at an existing Cargo URL with ?project=<name>. */
  var project = new URLSearchParams(location.search).get('project');
  var route = (project && aliases['?' + project.toLowerCase()]) || aliases[slug(location.pathname)];
  if (!route) return;
  window.__alV4Booted = true;
  if (route[1]) { try { sessionStorage.setItem('al-focus', route[1]); } catch (e) {} }
  var host, globalStyle;
  async function read(name) {
    var response = await fetch(new URL(name, BASE), { mode: 'cors', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('Portfolio file ' + name + ': HTTP ' + response.status);
    return response.text();
  }
  function asset(raw, file) {
    if (!raw || /^(?:data:|blob:|mailto:|tel:|#)/i.test(raw)) return raw;
    return new URL(raw, new URL(file, BASE)).href;
  }
  function link(raw, file) {
    if (!raw || raw[0] === '#' || /^(?:mailto:|tel:)/i.test(raw)) return raw;
    var url = new URL(raw, new URL(file, BASE));
    if (url.href.startsWith(BASE)) {
      var name = decodeURIComponent(url.pathname.slice(new URL(BASE).pathname.length));
      if (canonical[name]) return canonical[name] + url.search + url.hash;
    }
    return url.href;
  }
  function meta(name, content) {
    if (!content) return;
    var el = document.querySelector('meta[name="' + name + '"]');
    if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
    el.content = content;
  }
  (async function () {
    var results = await Promise.all([read(route[0]), read('assets/site.css'), read('assets/site.js'), read('assets/data.js')]);
    var parsed = new DOMParser().parseFromString(results[0], 'text/html');
    var data = JSON.parse(results[3].replace(/^\s*window\.AL\s*=\s*/, '').replace(/;\s*$/, ''));
    Object.keys(data.projects).forEach(function (id) {
      var p = data.projects[id];
      p.href = link(p.href, 'index.html');
      ['img', 'hero', 'hover'].forEach(function (key) { if (p[key]) p[key] = asset(p[key], 'index.html'); });
    });
    parsed.querySelectorAll('script').forEach(function (s) { s.remove(); });
    parsed.body.querySelectorAll('[src],[poster],[data-src],[srcset],[href]').forEach(function (el) {
      ['src', 'poster', 'data-src'].forEach(function (attr) { if (el.hasAttribute(attr)) el.setAttribute(attr, asset(el.getAttribute(attr), route[0])); });
      if (el.hasAttribute('srcset')) el.setAttribute('srcset', el.getAttribute('srcset').split(',').map(function (item) {
        var parts = item.trim().split(/\s+/); parts[0] = asset(parts[0], route[0]); return parts.join(' ');
      }).join(', '));
      if (el.hasAttribute('href')) el.setAttribute('href', link(el.getAttribute('href'), route[0]));
    });
    if (!document.body) await new Promise(function (resolve) { document.addEventListener('DOMContentLoaded', resolve, { once: true }); });
    host = document.createElement('div'); host.id = 'al-portfolio-v4';
    var root = host.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = ':host { all: initial; display: block; width: 100%; isolation: isolate; }\n' + results[1]
      .replace(/:root\b/g, ':host').replace(/\bhtml\b/g, ':host').replace(/(^|[\s,{>+~])body(?=[\s.#:{>+~,]|$)/g, '$1#al-page');
    root.appendChild(style);
    var page = document.createElement('div'); page.id = 'al-page'; page.className = parsed.body.className;
    while (parsed.body.firstChild) page.appendChild(parsed.body.firstChild);
    root.appendChild(page);
    parsed.head.querySelectorAll('link').forEach(function (el) {
      var href = el.getAttribute('href');
      if (href && /^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//.test(href)) {
        var copy = el.cloneNode(true); copy.setAttribute('data-al-font', ''); document.head.appendChild(copy);
      }
    });
    document.body.appendChild(host);
    var scopedDocument = {
      body: page, readyState: 'complete',
      querySelector: root.querySelector.bind(root), querySelectorAll: root.querySelectorAll.bind(root),
      getElementById: root.getElementById.bind(root),
      addEventListener: root.addEventListener.bind(root), removeEventListener: root.removeEventListener.bind(root)
    };
    window.AL = data;
    window.__AL_DOCUMENT = scopedDocument;
    window.__AL_V4_SUCCESS = false;
    var runtime = document.createElement('script');
    runtime.textContent = '(function(document) {\n' + results[2] + '\nwindow.__AL_V4_SUCCESS=true;\n})(window.__AL_DOCUMENT);';
    document.head.appendChild(runtime);
    runtime.remove();
    if (!window.__AL_V4_SUCCESS) throw new Error('Portfolio interactions failed to initialize');
    root.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      e.stopPropagation();
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
      var raw = a.getAttribute('href');
      if (/^(?:mailto:|tel:)/i.test(raw)) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      e.preventDefault();
      if (url.pathname === location.pathname && url.hash) {
        var target = root.getElementById(decodeURIComponent(url.hash.slice(1)));
        if (target) { history.replaceState(null, '', url.pathname + url.search + url.hash); target.scrollIntoView({ behavior: 'smooth' }); }
      } else { location.assign(url.href); }
    });
    globalStyle = document.createElement('style');
    globalStyle.textContent = 'html.al-v4-on .content, html.al-v4-on .backdrop { display:none!important; } html.al-v4-on,html.al-v4-on body {margin:0!important;padding:0!important;background:#fff!important;min-height:100vh!important;height:auto!important;} #al-portfolio-v4 {display:block!important;position:relative!important;width:100%!important;margin:0!important;padding:0!important;}';
    document.head.appendChild(globalStyle);
    document.documentElement.classList.add('al-v4-on');
    document.title = parsed.title;
    meta('description', parsed.querySelector('meta[name="description"]') && parsed.querySelector('meta[name="description"]').content);
    var canon = document.querySelector('link[rel="canonical"]');
    if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
    canon.href = location.origin + canonical[route[0]];
    if (location.hash) {
      var target = root.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (!target && route[0] === 'index.html') target = root.getElementById('featured');
      if (target) requestAnimationFrame(function () { target.scrollIntoView({ block: 'start' }); });
    }
    window.__alV4Status = { ready: true, page: route[0], resources: BASE };
  })().catch(function (error) {
    if (host) host.remove(); if (globalStyle) globalStyle.remove();
    document.documentElement.classList.remove('al-v4-on');
    window.__alV4Status = { ready: false, error: String(error) };
    console.error('[Agnes portfolio]', error);
  });
})();
