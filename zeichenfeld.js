/* ================================================================
   Zeichenfeld: freihand zeichnen (feiner bis dicker Strich) und
   Teilchen per Klick einsetzen (Kugeln, Ionen, Elektronen, Wasser).
   Aufruf: Zeichenfeld(element, { laden(), speichern(dataUrl), loeschen(), titelKlasse, knopfKlasse })
   ================================================================ */
window.Zeichenfeld = function (zb, opt) {
  const H = +(zb.dataset.hoehe || 460);
  const kn = opt.knopfKlasse || 'btn';
  const FARBEN = [['#222222', 'Schwarz'], ['#3d6fb0', 'Blau'], ['#c05050', 'Rot'], ['#3f9a4f', 'Grün'], ['#e67e22', 'Orange'], ['#7d5ab5', 'Violett'], ['#8a8f99', 'Grau']];
  const TEILCHEN = [
    ['', 'Stift (freihand)'],
    ['k1', 'Teilchen klein'], ['k2', 'Teilchen mittel'], ['k3', 'Teilchen gross'],
    ['p1', 'Kation + (klein)'], ['p2', 'Kation + (gross)'], ['p2b', 'Kation 2+ (gross)'],
    ['m1', 'Anion − (klein)'], ['m2', 'Anion − (gross)'], ['m2b', 'Anion 2− (gross)'],
    ['e', 'Elektron e⁻'],
    ['w', 'Wassermolekül'], ['wd', 'Wassermolekül mit δ+ / δ−']];
  zb.innerHTML = `<div class="${opt.titelKlasse || 'gate-title'}">${zb.dataset.label || 'Ihre Zeichnung'}</div>
    <canvas width="1000" height="${H}" style="aspect-ratio:1000/${H}"></canvas>
    <div class="zb-tools">
      ${FARBEN.map(([c, t], i) => `<button type="button" class="zb-farbe${i ? '' : ' aktiv'}" data-c="${c}" title="${t}" style="--c:${c}"></button>`).join('')}
      <label class="zb-label">Strich <select class="zb-dicke"><option value="1.5">fein</option><option value="3.5" selected>mittel</option><option value="7">dick</option></select></label>
      <button type="button" class="${kn} zb-radier">Radierer</button>
      <button type="button" class="${kn} zb-undo">Rückgängig</button>
      <button type="button" class="${kn} zb-clear">Alles löschen</button>
    </div>
    <div class="zb-tools zb-teilchen">
      <label class="zb-label">Teilchen einsetzen <select class="zb-typ">${TEILCHEN.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      <label class="zb-label zb-drehung-l" hidden>Drehung <select class="zb-drehung">${[0, 45, 90, 135, 180, 225, 270, 315].map(d => `<option value="${d}">${d}°</option>`).join('')}</select></label>
      <span class="zb-hinweis">Teilchen auswählen, dann in die Zeichenfläche klicken. Die Farbe kommt von der Farbauswahl.</span>
    </div>`;
  const cv = zb.querySelector('canvas'), ctx = cv.getContext('2d');
  const dickeSel = zb.querySelector('.zb-dicke'), typSel = zb.querySelector('.zb-typ'), drehSel = zb.querySelector('.zb-drehung');
  let farbe = '#222222', radier = false, zug = null;
  const verlauf = [];
  const speichern = () => { try { opt.speichern(cv.toDataURL('image/png')); } catch (e) {} };
  const weiss = () => { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, cv.width, cv.height); };
  weiss();
  const alt = opt.laden && opt.laden();
  if (alt) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = alt; }
  const punkt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
  const merke = () => { verlauf.push(ctx.getImageData(0, 0, cv.width, cv.height)); if (verlauf.length > 30) verlauf.shift(); };

  /* ---- Teilchen ---- */
  function mische(hex, f) { // f > 0 heller, f < 0 dunkler
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    return 'rgb(' + c.map(v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f))).join(',') + ')';
  }
  function kugel(x, y, r, col, zeichen) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, mische(col, 0.55)); g.addColorStop(1, col);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = mische(col, -0.35); ctx.stroke();
    if (zeichen) {
      ctx.fillStyle = col === '#f1f3f5' ? '#495057' : 'white';
      ctx.font = `700 ${Math.round(r * (zeichen.length > 1 ? 0.85 : 1.15))}px DM Sans, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(zeichen, x, y + r * 0.04);
    }
  }
  function setzeTeilchen(x, y, typ) {
    const schwarz = farbe === '#222222';
    const f = std => schwarz ? std : farbe;
    ctx.globalCompositeOperation = 'source-over';
    if (typ[0] === 'k') kugel(x, y, { k1: 14, k2: 22, k3: 32 }[typ], f('#8a8f99'));
    else if (typ[0] === 'p') kugel(x, y, typ === 'p1' ? 16 : 30, f('#7d5ab5'), typ === 'p2b' ? '2+' : '+');
    else if (typ[0] === 'm') kugel(x, y, typ === 'm1' ? 16 : 30, f('#3f9a4f'), typ === 'm2b' ? '2−' : '−');
    else if (typ === 'e') kugel(x, y, 11, f('#3d6fb0'), '−');
    else if (typ === 'w' || typ === 'wd') {
      const a = (+drehSel.value) * Math.PI / 180, d = 27, half = 52 * Math.PI / 180;
      const hs = [-half, half].map(w => [x + d * Math.sin(a + w), y + d * Math.cos(a + w)]);
      hs.forEach(([hx, hy]) => kugel(hx, hy, 13, '#f1f3f5'));
      kugel(x, y, 22, '#d6453d');
      if (typ === 'wd') {
        ctx.font = '600 15px DM Sans, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#c0392b'; ctx.fillText('δ−', x - 38 * Math.sin(a), y - 38 * Math.cos(a));
        ctx.fillStyle = '#3d6fb0';
        hs.forEach(([hx, hy]) => ctx.fillText('δ+', hx + (hx - x) * 0.85, hy + (hy - y) * 0.85));
      }
    }
  }

  /* ---- Zeichnen ---- */
  const dicke = () => +dickeSel.value;
  cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    const p = punkt(e);
    if (typSel.value && !radier) { merke(); setzeTeilchen(p[0], p[1], typSel.value); speichern(); return; }
    cv.setPointerCapture(e.pointerId); merke();
    zug = p;
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = radier ? 'white' : farbe;
    ctx.lineWidth = radier ? 28 : (e.pointerType === 'pen' ? dicke() * (0.6 + 0.8 * (e.pressure || 0.5)) : dicke());
    ctx.beginPath(); ctx.moveTo(zug[0], zug[1]); ctx.lineTo(zug[0] + 0.1, zug[1] + 0.1); ctx.stroke();
  });
  cv.addEventListener('pointermove', e => {
    if (!zug) return;
    const p = punkt(e);
    if (!radier && e.pointerType === 'pen') ctx.lineWidth = dicke() * (0.6 + 0.8 * (e.pressure || 0.5));
    ctx.beginPath(); ctx.moveTo(zug[0], zug[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); zug = p;
  });
  const ende = () => { if (zug) { zug = null; speichern(); } };
  cv.addEventListener('pointerup', ende); cv.addEventListener('pointercancel', ende); cv.addEventListener('pointerleave', ende);

  /* ---- Werkzeuge ---- */
  const radierBtn = zb.querySelector('.zb-radier');
  const modus = () => {
    cv.style.cursor = typSel.value && !radier ? 'copy' : 'crosshair';
    zb.querySelector('.zb-drehung-l').hidden = !typSel.value.startsWith('w');
  };
  zb.querySelectorAll('.zb-farbe').forEach(b => b.addEventListener('click', () => {
    farbe = b.dataset.c; radier = false; radierBtn.classList.remove('aktiv');
    zb.querySelectorAll('.zb-farbe').forEach(x => x.classList.remove('aktiv')); b.classList.add('aktiv'); modus();
  }));
  radierBtn.addEventListener('click', () => {
    radier = !radier; radierBtn.classList.toggle('aktiv', radier);
    if (radier) typSel.value = '';
    modus();
  });
  typSel.addEventListener('change', () => { if (typSel.value) { radier = false; radierBtn.classList.remove('aktiv'); } modus(); });
  dickeSel.addEventListener('change', () => { if (typSel.value) { typSel.value = ''; modus(); } });
  zb.querySelector('.zb-undo').addEventListener('click', () => { if (verlauf.length) { ctx.putImageData(verlauf.pop(), 0, 0); speichern(); } });
  zb.querySelector('.zb-clear').addEventListener('click', () => { merke(); weiss(); if (opt.loeschen) opt.loeschen(); });
  modus();
};
