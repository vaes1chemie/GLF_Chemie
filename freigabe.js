/* ================================================================
   Freigabe pro Klasse
   Liest <klasse>/freigabe.json und schaltet Phasen frei oder sperrt sie.
   Die Klasse kommt aus dem Link (?k=2029e) und wird im Browser gemerkt.
   ================================================================ */
(function () {
  const FILE_RE = /([a-z0-9]+?)(?:-phase(\d+))?\.html$/i;
  const here = location.pathname.split('/').pop() || 'index.html';
  const m = here.match(FILE_RE);
  const thema = m ? m[1] : null, phase = m ? (m[2] ? +m[2] : 1) : null;

  const params = new URLSearchParams(location.search);
  let klasse = (params.get('k') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  try {
    if (klasse) localStorage.setItem('glf-klasse', klasse);
    else klasse = localStorage.getItem('glf-klasse') || '';
  } catch (e) {}

  function bereit(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function heute() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function istFrei(wert) {
    if (wert === true || wert === 'frei') return true;
    if (typeof wert === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(wert)) return heute() >= wert;
    return false;
  }
  function mitKlasse(href) {
    const [pfad, hash] = href.split('#');
    return pfad + (klasse ? '?k=' + klasse : '') + (hash ? '#' + hash : '');
  }
  function dateiFuer(t, n) { return n === 1 ? t + '.html' : t + '-phase' + n + '.html'; }

  function overlay(titel, text) {
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;z-index:999;background:rgba(250,249,247,0.97);display:flex;align-items:center;justify-content:center;padding:24px;font-family:DM Sans,sans-serif;';
    o.innerHTML = '<div style="max-width:440px;text-align:center;background:white;border:1px solid #e5e2dd;border-radius:14px;padding:32px 28px;box-shadow:0 8px 24px rgba(0,0,0,0.06)">'
      + '<div style="font-size:34px;margin-bottom:8px">&#x1F512;</div>'
      + '<div style="font-family:DM Serif Display,Georgia,serif;font-size:1.5rem;margin-bottom:8px">' + titel + '</div>'
      + '<p style="color:#6b6560;font-size:0.95rem;line-height:1.6;margin-bottom:18px">' + text + '</p>'
      + (klasse ? '<a href="' + klasse + '/" style="color:#2b7f7a;font-weight:600;text-decoration:none">&larr; Zur Themenübersicht Ihrer Klasse</a>' : '')
      + '</div>';
    document.body.appendChild(o);
  }

  function anwenden(cfg) {
    const themen = (cfg && cfg.themen) || {};
    const frei = (t, n) => istFrei((themen[t] || {})[String(n)]);

    // Aktuelle Seite gesperrt?
    if (thema && !frei(thema, phase)) {
      overlay('Noch nicht freigeschaltet', 'Diese Phase ist für Ihre Klasse noch nicht freigegeben. Ihre Lehrperson schaltet sie frei, sobald Sie im Unterricht so weit sind.');
    }

    // Links zur Themenübersicht → Seite der Klasse
    document.querySelectorAll('a[href="index.html"]').forEach(a => { a.href = klasse ? klasse + '/' : 'index.html'; });

    // Seitenleiste
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      const href = item.getAttribute('href');
      let t, n, ziel;
      if (href && FILE_RE.test(href.split('#')[0])) {
        const mm = href.split('#')[0].match(FILE_RE); t = mm[1]; n = mm[2] ? +mm[2] : 1; ziel = href;
      } else if (!href && item.dataset.phase) {
        t = thema; n = +item.dataset.phase; ziel = dateiFuer(t, n);
      } else return; // Anker auf derselben Seite
      if (frei(t, n)) {
        item.classList.remove('locked');
        item.setAttribute('href', mitKlasse(ziel));
        const lock = item.querySelector('.lock-icon'); if (lock) lock.remove();
      } else {
        item.classList.add('locked'); item.classList.remove('done', 'active');
        item.removeAttribute('href');
        if (!item.querySelector('.lock-icon')) item.insertAdjacentHTML('beforeend', ' <span class="lock-icon">&#x1F512;</span>');
      }
    });

    // «Weiter zu Phase X» am Seitenende
    document.querySelectorAll('[id$="-teaser"]').forEach(el => {
      const mm = el.id.match(/^phase(\d+)-teaser$/); if (!mm || !thema) return;
      const n = +mm[1];
      if (frei(thema, n) && !el.querySelector('a')) {
        el.innerHTML = '<a href="' + mitKlasse(dateiFuer(thema, n)) + '" style="color:var(--accent); text-decoration:none; font-weight:600;">&rarr; ' + el.innerHTML + '</a>';
      }
    });
  }

  if (!klasse) {
    bereit(() => overlay('Bitte den Link Ihrer Klasse verwenden', 'Öffnen Sie die Seite über den Link, den Sie von Ihrer Lehrperson erhalten haben. Danach merkt sich Ihr Browser Ihre Klasse.'));
    return;
  }
  fetch(klasse + '/freigabe.json', { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('keine Freigabe'); return r.json(); })
    .then(cfg => bereit(() => anwenden(cfg)))
    .catch(() => {
      try { localStorage.removeItem('glf-klasse'); } catch (e) {}
      bereit(() => overlay('Klasse nicht gefunden', 'Für die Klasse «' + klasse + '» gibt es keine Freigabe. Bitte verwenden Sie den Link Ihrer Lehrperson.'));
    });
})();
