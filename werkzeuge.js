/* ================================================================
   Werkzeuge für Lernseiten (Atombau): Notizfelder, Zeichenfelder,
   Vorhersagen, Karten zum Aufdecken. Eingaben werden im Browser gespeichert.
   Optional vor dem Einbinden: window.WZ_KEY = 'atombau-p1'
   ================================================================ */
(function () {
  const KEY = 'glf-werkzeuge-' + (window.WZ_KEY || (location.pathname.split('/').pop() || 'seite').replace(/\.html$/, ''));
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
  window.WZ = { store, save };

  function init() {
    /* ---------- Notizfelder ---------- */
    document.querySelectorAll('.notiz-box').forEach(nb => {
      const key = 'notiz:' + nb.dataset.key;
      const lab = nb.hasAttribute('data-label') ? nb.dataset.label : 'Ihre Notizen';
      nb.innerHTML = (lab ? `<div class="wz-title">${lab}</div>` : '') + '<textarea></textarea>';
      const ta = nb.querySelector('textarea');
      if (nb.dataset.rows) ta.style.minHeight = (+nb.dataset.rows * 24) + 'px';
      ta.value = store[key] || '';
      ta.addEventListener('input', () => { store[key] = ta.value; save(); });
    });

    /* ---------- Karten zum Aufdecken (zweiter Klick dreht zurück) ---------- */
    document.querySelectorAll('.sr-card').forEach((c, i) => {
      const key = c.dataset.key || ('karte' + i);
      const setze = auf => { c.classList.toggle('open', auf); c.setAttribute('aria-expanded', auf ? 'true' : 'false'); };
      c.addEventListener('click', () => {
        const auf = !c.classList.contains('open'); setze(auf);
        store.karten = store.karten || {}; if (auf) store.karten[key] = 1; else delete store.karten[key]; save();
      });
      if ((store.karten || {})[key]) setze(true);
    });

    /* ---------- Vorhersagen (gespeichert, nicht bewertet) ---------- */
    document.querySelectorAll('.predict').forEach(p => {
      const key = 'vorhersage:' + p.dataset.key;
      const btns = p.querySelectorAll('.tool-btn');
      p.id = p.id || 'vorhersage-' + p.dataset.key;
      const show = v => {
        btns.forEach(b => b.classList.toggle('chosen', b.dataset.v === v));
        document.querySelectorAll('.predict-echo[data-key="' + p.dataset.key + '"]').forEach(e => {
          const b = [...btns].find(x => x.dataset.v === v);
          e.innerHTML = (b ? 'Ihre Vorhersage war: <strong>' + b.textContent + '</strong>' : 'Sie haben noch keine Vorhersage gemacht.') + ' · <a href="#' + p.id + '">Zur Vorhersage &uarr;</a>';
        });
      };
      btns.forEach(b => b.addEventListener('click', () => { store[key] = b.dataset.v; save(); show(b.dataset.v); }));
      show(store[key]);
    });

    /* ---------- Zeichenfelder (siehe zeichenfeld.js) ---------- */
    document.querySelectorAll('.zeichen-box').forEach(zb => {
      const key = 'zeichnung:' + zb.dataset.key;
      Zeichenfeld(zb, { laden: () => store[key], speichern: d => { store[key] = d; save(); }, laden2: () => store[key + ':ebenen'], speichern2: o => { store[key + ':ebenen'] = o; save(); }, loeschen: () => { delete store[key]; delete store[key + ':ebenen']; save(); }, titelKlasse: 'wz-title', knopfKlasse: 'wz-btn' });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
