/* Ridgeline Excavation & Sitework — shared JS (vanilla, no dependencies). Safe to load once per page. */
(function () {
  if (window.__rl) return; window.__rl = 1;
  var C = window.RL_CONFIG || {};
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function init() {
    $$('.rl').forEach(function (r) { r.classList.add('js'); });

    /* image fallback: branded placeholder instead of a broken icon */
    $$('.rl .ph img').forEach(function (im) {
      function fb() { im.parentNode.classList.add('fb'); }
      if (im.complete && im.naturalWidth === 0 && im.currentSrc) fb();
      im.addEventListener('error', fb);
    });

    /* header */
    var hdr = document.getElementById('hdr');
    function onScroll() { if (hdr) hdr.classList.toggle('scr', window.scrollY > 30); }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    /* mega menu */
    $$('.rl .nav button[aria-controls]').forEach(function (b) {
      var m = document.getElementById(b.getAttribute('aria-controls')); if (!m) return;
      function set(o) { b.setAttribute('aria-expanded', o); m.classList.toggle('open', o); }
      b.addEventListener('click', function (ev) { ev.stopPropagation(); set(b.getAttribute('aria-expanded') !== 'true'); });
      document.addEventListener('click', function (ev) { if (!m.contains(ev.target)) set(false); });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && b.getAttribute('aria-expanded') === 'true') { set(false); b.focus(); } });
    });

    /* drawer */
    var bg = document.querySelector('.rl .burger'), dr = document.getElementById('drawer');
    if (bg && dr) {
      function setD(o) { bg.setAttribute('aria-expanded', o); bg.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); dr.classList.toggle('open', o); document.documentElement.style.overflow = o ? 'hidden' : ''; if (o) { var f = dr.querySelector('a,summary'); f && f.focus(); } }
      bg.addEventListener('click', function () { setD(bg.getAttribute('aria-expanded') !== 'true'); });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && dr.classList.contains('open')) { setD(false); bg.focus(); } });
      $$('a', dr).forEach(function (a) { a.addEventListener('click', function () { setD(false); }); });
    }

    /* reveal + line draw */
    var targets = $$('.rl [data-rv], .rl .ridge, .rl .xs, .rl [data-draw]');
    if ('IntersectionObserver' in window && !RM) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
      targets.forEach(function (t) { io.observe(t); });
    } else targets.forEach(function (t) { t.classList.add('in'); });

    /* SITEWORK EXPLORER */
    $$('[data-xp]').forEach(function (xp) {
      var tabs = $$('[role=tab]', xp), svg = xp.querySelector('.xsvg'), panes = $$('[data-pane]', xp), bar = xp.querySelector('.xp-track i'), panel = xp.querySelector('[role=tabpanel]'), cur = 0, touched = false;
      function go(i, focus) {
        i = (i + 5) % 5; cur = i;
        tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
        panes.forEach(function (p, k) { p.hidden = k !== i; });
        panel.setAttribute('aria-labelledby', tabs[i].id);
        svg.setAttribute('data-s', i);
        $$('[class*=L]', svg).forEach(function (g) {
          var on = (' ' + g.getAttribute('class') + ' ').indexOf(' L' + (i + 1) + ' ') > -1;
          g.classList.toggle('on', on);
        });
        var tr = svg.querySelector('.trees'); if (tr) tr.classList.toggle('out', i > 0);
        if (bar) bar.style.width = ((i + 1) * 20) + '%';
        if (focus) tabs[i].focus();
      }
      tabs.forEach(function (t, k) {
        t.addEventListener('click', function () { touched = true; go(k); });
        t.addEventListener('keydown', function (ev) {
          var m = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
          if (m) { ev.preventDefault(); touched = true; go(cur + m, true); }
          if (ev.key === 'Home') { ev.preventDefault(); go(0, true); } if (ev.key === 'End') { ev.preventDefault(); go(4, true); }
        });
      });
      $$('.xb', xp).forEach(function (b) { b.addEventListener('click', function () { touched = true; go(cur + (+b.getAttribute('data-dir'))); }); });
      go(0);
      /* one gentle auto-advance pass when first seen (stops on any interaction) */
      if (!RM && 'IntersectionObserver' in window && xp.hasAttribute('data-auto')) {
        var o = new IntersectionObserver(function (es) {
          if (es[0].isIntersecting) { o.disconnect(); var n = 0; var iv = setInterval(function () { if (touched || ++n > 4) return clearInterval(iv); go(n); }, 2600); }
        }, { threshold: .5 }); o.observe(xp);
      }
    });

    /* PROCESS */
    $$('[data-proc]').forEach(function (pr) {
      var tabs = $$('[role=tab]', pr), panes = $$('[role=tabpanel]', pr), prog = pr.querySelector('.pcr'), cur = 0;
      function go(i, f) {
        i = (i + tabs.length) % tabs.length; cur = i;
        tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; t.classList.toggle('done', k < i); });
        panes.forEach(function (p, k) { p.hidden = k !== i; });
        if (prog) prog.style.width = ((i + 1) * 20) + 'px';
        if (f) tabs[i].focus();
      }
      tabs.forEach(function (t, k) {
        t.addEventListener('click', function () { go(k); });
        t.addEventListener('keydown', function (ev) { var m = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key]; if (m) { ev.preventDefault(); go(cur + m, true); } });
      });
      go(0);
    });

    /* GALLERY filter + lightbox */
    $$('[data-gal]').forEach(function (g) {
      var btns = $$('.chipsbar button', g), items = $$('.gal button', g), lb = g.querySelector('dialog');
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var c = b.getAttribute('data-c');
          btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
          items.forEach(function (it) { it.hidden = !(c === 'all' || (' ' + it.getAttribute('data-c') + ' ').indexOf(' ' + c + ' ') > -1); });
        });
      });
      if (lb && lb.showModal) {
        var li = lb.querySelector('img'), lp = lb.querySelector('p'), last;
        items.forEach(function (it) {
          it.addEventListener('click', function () {
            var im = it.querySelector('img'); last = it;
            li.src = im.currentSrc || im.src; li.alt = im.alt; lp.textContent = it.getAttribute('data-t') + ' — illustrative photograph';
            lb.showModal();
          });
        });
        lb.querySelector('.x').addEventListener('click', function () { lb.close(); });
        lb.addEventListener('click', function (ev) { if (ev.target === lb) lb.close(); });
        lb.addEventListener('close', function () { last && last.focus(); });
      }
    });

    /* FORMS — validation, multi-step, honest submission */
    $$('.rl form.rf').forEach(function (f) {
      var steps = $$('.step', f), nav = $$('.snav li', f), meter = f.querySelector('.fmeter i'), st = 0;
      var bNext = f.querySelector('[data-next]'), bPrev = f.querySelector('[data-prev]'), bSub = f.querySelector('[type=submit]'), stat = f.querySelector('.fstat');
      function fieldsOf(scope) { return $$('input[required],select[required],textarea[required]', scope); }
      function okField(el) {
        var box = el.closest('.f'); var ok;
        if (el.type === 'radio') ok = !!f.querySelector('input[name="' + el.name + '"]:checked');
        else if (el.type === 'checkbox') ok = el.checked;
        else if (el.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        else if (el.type === 'tel') ok = el.value.replace(/\D/g, '').length >= 10;
        else if (el.name === 'zip') ok = /^\d{5}(-\d{4})?$/.test(el.value.trim());
        else ok = el.value.trim() !== '';
        if (box) { box.classList.toggle('bad', !ok); }
        $$('input,select,textarea', box || el.parentNode).forEach(function (x) { x.setAttribute('aria-invalid', !ok); });
        return ok;
      }
      function check(scope) {
        var bad = fieldsOf(scope).filter(function (el) { return !okField(el); });
        if (bad.length) { bad[0].focus(); stat.textContent = 'Please check the highlighted fields.'; stat.className = 'fstat bad'; return false; }
        stat.textContent = ''; stat.className = 'fstat'; return true;
      }
      fieldsOf(f).forEach(function (el) { el.addEventListener(el.type === 'radio' || el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () { if (el.closest('.f.bad')) okField(el); progress(); }); });
      function progress() {
        if (!meter) return; var all = fieldsOf(f), done = all.filter(function (el) { return el.type === 'radio' ? !!f.querySelector('input[name="' + el.name + '"]:checked') : el.type === 'checkbox' ? el.checked : el.value.trim() !== ''; });
        meter.style.width = (all.length ? done.length / all.length * 100 : 0) + '%';
      }
      function show(i) {
        st = i; steps.forEach(function (s, k) { s.hidden = k !== i; });
        nav.forEach(function (n, k) { n.classList.toggle('on', k === i); n.classList.toggle('done', k < i); });
        if (bPrev) bPrev.hidden = i === 0; if (bNext) bNext.hidden = i === steps.length - 1; if (bSub) bSub.hidden = i !== steps.length - 1;
        var first = steps[i] && steps[i].querySelector('input,select,textarea'); first && first.focus({ preventScroll: true });
        f.scrollIntoView && f.getBoundingClientRect().top < 60 && f.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      }
      if (steps.length) {
        show(0);
        bNext && bNext.addEventListener('click', function () { if (check(steps[st])) show(st + 1); });
        bPrev && bPrev.addEventListener('click', function () { show(st - 1); });
      }
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (steps.length && !check(steps[st])) return;
        if (!check(f)) return;
        var hp = f.querySelector('[name=company_website]'); if (hp && hp.value) return;
        var ep = (C.formEndpoint || '').trim();
        /* No backend by choice: show the thank-you state; nothing is sent or stored. */
        if (!ep) { f.classList.add('sent'); var dn = f.querySelector('.fdone'); dn && dn.focus(); return; }
        var fd = new FormData(f); fd.append('form_name', f.getAttribute('data-form')); fd.append('page', location.href);
        stat.textContent = 'Sending…'; stat.className = 'fstat';
        if (bSub) bSub.disabled = true;
        fetch(ep, { method: 'POST', body: fd }).then(function (r) {
          if (!r.ok) throw new Error(r.status);
          f.classList.add('sent'); var d = f.querySelector('.fdone'); d && d.focus();
        }).catch(function () {
          stat.textContent = 'Something went wrong and your details were not sent. Please try again or contact the team directly.'; stat.className = 'fstat bad';
        }).then(function () { if (bSub) bSub.disabled = false; });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
