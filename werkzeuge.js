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

    /* ---------- Zeichenfelder (Maus, Finger oder Stift) ---------- */
    document.querySelectorAll('.zeichen-box').forEach(zb => {
      const key = 'zeichnung:' + zb.dataset.key;
      const h = +(zb.dataset.hoehe || 460);
      zb.innerHTML = `<div class="wz-title">${zb.dataset.label || 'Ihre Zeichnung'}</div>
        <canvas width="1000" height="${h}" style="aspect-ratio:1000/${h}"></canvas>
        <div class="zb-tools">
          <button type="button" class="zb-farbe aktiv" data-c="#222222" title="Schwarz" style="--c:#222222"></button>
          <button type="button" class="zb-farbe" data-c="#3d6fb0" title="Blau" style="--c:#3d6fb0"></button>
          <button type="button" class="zb-farbe" data-c="#c05050" title="Rot" style="--c:#c05050"></button>
          <button type="button" class="zb-farbe" data-c="#3f9a4f" title="Grün" style="--c:#3f9a4f"></button>
          <button type="button" class="wz-btn zb-radier">Radierer</button>
          <button type="button" class="wz-btn zb-undo">Rückgängig</button>
          <button type="button" class="wz-btn zb-clear">Alles löschen</button>
        </div>`;
      const cv = zb.querySelector('canvas'), ctx = cv.getContext('2d');
      let farbe = '#222222', radier = false, zug = null;
      const verlauf = [];
      const speichern = () => { try { store[key] = cv.toDataURL('image/png'); save(); } catch (e) {} };
      const weiss = () => { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, cv.width, cv.height); };
      weiss();
      if (store[key]) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = store[key]; }
      const punkt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
      cv.addEventListener('pointerdown', e => {
        e.preventDefault(); cv.setPointerCapture(e.pointerId);
        verlauf.push(ctx.getImageData(0, 0, cv.width, cv.height)); if (verlauf.length > 20) verlauf.shift();
        zug = punkt(e);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = radier ? 'white' : farbe;
        ctx.lineWidth = radier ? 28 : (e.pointerType === 'pen' ? 2 + 4 * (e.pressure || 0.5) : 4);
        ctx.beginPath(); ctx.moveTo(zug[0], zug[1]); ctx.lineTo(zug[0] + 0.1, zug[1] + 0.1); ctx.stroke();
      });
      cv.addEventListener('pointermove', e => {
        if (!zug) return;
        const p = punkt(e);
        if (!radier && e.pointerType === 'pen') ctx.lineWidth = 2 + 4 * (e.pressure || 0.5);
        ctx.beginPath(); ctx.moveTo(zug[0], zug[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); zug = p;
      });
      const ende = () => { if (zug) { zug = null; speichern(); } };
      cv.addEventListener('pointerup', ende); cv.addEventListener('pointercancel', ende); cv.addEventListener('pointerleave', ende);
      zb.querySelectorAll('.zb-farbe').forEach(b => b.addEventListener('click', () => {
        farbe = b.dataset.c; radier = false;
        zb.querySelectorAll('.zb-farbe, .zb-radier').forEach(x => x.classList.remove('aktiv')); b.classList.add('aktiv');
      }));
      zb.querySelector('.zb-radier').addEventListener('click', e => {
        radier = true; zb.querySelectorAll('.zb-farbe').forEach(x => x.classList.remove('aktiv')); e.target.classList.add('aktiv');
      });
      zb.querySelector('.zb-undo').addEventListener('click', () => { if (verlauf.length) { ctx.putImageData(verlauf.pop(), 0, 0); speichern(); } });
      zb.querySelector('.zb-clear').addEventListener('click', () => {
        verlauf.push(ctx.getImageData(0, 0, cv.width, cv.height)); weiss(); delete store[key]; save();
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
