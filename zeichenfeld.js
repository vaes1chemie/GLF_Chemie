/* ================================================================
   Zeichenfeld: freihand zeichnen (feiner bis dicker Strich) und
   Teilchen per Klick einsetzen (Kugeln, Ionen, Elektronen, Wasser).
   Eingesetzte Teilchen lassen sich verschieben, Wassermoleküle drehen.
   Aufruf: Zeichenfeld(element, { laden(), speichern(dataUrl), laden2(), speichern2(obj), loeschen(), titelKlasse, knopfKlasse })
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
  if ((zb.dataset.extra || '').includes('ethanol')) TEILCHEN.push(['et', 'Ethanolmolekül'], ['etd', 'Ethanolmolekül mit δ+ / δ−']);
  zb.innerHTML = `<div class="${opt.titelKlasse || 'gate-title'}">${zb.dataset.label || 'Ihre Zeichnung'}</div>
    <canvas width="1000" height="${H}" style="aspect-ratio:1000/${H}" tabindex="0"></canvas>
    <div class="zb-tools">
      ${FARBEN.map(([c, t], i) => `<button type="button" class="zb-farbe${i ? '' : ' aktiv'}" data-c="${c}" title="${t}" style="--c:${c}"></button>`).join('')}
      <label class="zb-label">Strich <select class="zb-dicke"><option value="1.5">fein</option><option value="3.5" selected>mittel</option><option value="7">dick</option></select></label>
      <button type="button" class="${kn} zb-radier">Radierer</button>
      <button type="button" class="${kn} zb-undo">Rückgängig</button>
      <button type="button" class="${kn} zb-clear">Alles löschen</button>
    </div>
    <div class="zb-tools zb-teilchen">
      <label class="zb-label">Teilchen einsetzen <select class="zb-typ">${TEILCHEN.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      <button type="button" class="${kn} zb-del" disabled>Teilchen entfernen</button>
      <span class="zb-hinweis">Teilchen auswählen und in die Fläche klicken. Eingesetzte Teilchen anklicken und ziehen zum Verschieben; Moleküle am runden Griff ↻ drehen.</span>
    </div>`;
  const cv = zb.querySelector('canvas'), ctx = cv.getContext('2d');
  const base = document.createElement('canvas'); base.width = cv.width; base.height = cv.height;
  const bx = base.getContext('2d');
  const dickeSel = zb.querySelector('.zb-dicke'), typSel = zb.querySelector('.zb-typ'), delBtn = zb.querySelector('.zb-del');
  let farbe = '#222222', radier = false, zug = null, objs = [], sel = -1, aktion = null;
  const verlauf = [];
  const weiss = () => { bx.globalCompositeOperation = 'source-over'; bx.fillStyle = 'white'; bx.fillRect(0, 0, base.width, base.height); };
  weiss();

  /* ---- Teilchen zeichnen ---- */
  function mische(hex, f) {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    return 'rgb(' + c.map(v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f))).join(',') + ')';
  }
  function kugel(x, y, r, col, zeichen) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, mische(col, 0.55)); g.addColorStop(1, col);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = mische(col, -0.35); ctx.stroke();
    if (zeichen) {
      ctx.fillStyle = 'white';
      ctx.font = `700 ${Math.round(r * (zeichen.length > 1 ? 0.85 : 1.15))}px DM Sans, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(zeichen, x, y + r * 0.04);
    }
  }
  const radius = o => ({ k1: 14, k2: 22, k3: 32, p1: 16, p2: 30, p2b: 30, m1: 16, m2: 30, m2b: 30, e: 11, w: 34, wd: 34, et: 50, etd: 50 })[o.t];
  const drehbar = o => o && (o.t[0] === 'w' || o.t === 'et' || o.t === 'etd');
  const rot = (o, u, v) => [o.x + u * Math.cos(o.a) + v * Math.sin(o.a), o.y - u * Math.sin(o.a) + v * Math.cos(o.a)];
  const wasserH = o => { const d = 27, half = 52 * Math.PI / 180; return [-half, half].map(w => [o.x + d * Math.sin(o.a + w), o.y + d * Math.cos(o.a + w)]); };
  const griff = o => rot(o, 0, o.t[0] === 'w' ? -58 : -72);
  function zeichneObj(o) {
    const t = o.t, f = o.c;
    if (t[0] === 'k') kugel(o.x, o.y, radius(o), f);
    else if (t[0] === 'p') kugel(o.x, o.y, radius(o), f, t === 'p2b' ? '2+' : '+');
    else if (t[0] === 'm') kugel(o.x, o.y, radius(o), f, t === 'm2b' ? '2−' : '−');
    else if (t === 'e') kugel(o.x, o.y, 11, f, '−');
    else if (t === 'et' || t === 'etd') {
      const P = (u, v) => rot(o, u, v);
      [[-60, 2], [-46, 26], [-46, -22], [4, -30], [-2, 26], [54, -18]].forEach(([u, v]) => { const [hx, hy] = P(u, v); kugel(hx, hy, 11, '#f1f3f5'); });
      [[-38, 2], [0, -4]].forEach(([u, v]) => { const [cx2, cy2] = P(u, v); kugel(cx2, cy2, 18, '#495057'); });
      const [ox, oy] = P(36, 4); kugel(ox, oy, 19, '#d6453d');
      if (t === 'etd') {
        ctx.font = '600 15px DM Sans, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#c0392b'; const [a1, b1] = P(42, 34); ctx.fillText('δ−', a1, b1);
        ctx.fillStyle = '#3d6fb0'; const [a2, b2] = P(70, -32); ctx.fillText('δ+', a2, b2);
      }
    }
    else {
      const hs = wasserH(o);
      hs.forEach(([hx, hy]) => kugel(hx, hy, 13, '#f1f3f5'));
      kugel(o.x, o.y, 22, '#d6453d');
      if (t === 'wd') {
        ctx.font = '600 15px DM Sans, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#c0392b'; ctx.fillText('δ−', o.x - 38 * Math.sin(o.a), o.y - 38 * Math.cos(o.a));
        ctx.fillStyle = '#3d6fb0'; hs.forEach(([hx, hy]) => ctx.fillText('δ+', hx + (hx - o.x) * 0.85, hy + (hy - o.y) * 0.85));
      }
    }
  }
  function zeichne(mitAuswahl = true) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(base, 0, 0);
    objs.forEach(zeichneObj);
    if (mitAuswahl && sel >= 0 && objs[sel]) {
      const o = objs[sel], r = radius(o) + 6;
      ctx.setLineDash([5, 4]); ctx.strokeStyle = '#4a7ab5'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      if (drehbar(o)) {
        const [gx, gy] = griff(o), [sx, sy] = rot(o, 0, o.t[0] === 'w' ? -40 : -48);
        ctx.strokeStyle = '#4a7ab5'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(gx, gy); ctx.stroke();
        ctx.beginPath(); ctx.arc(gx, gy, 11, 0, 2 * Math.PI); ctx.fillStyle = '#4a7ab5'; ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = '700 14px DM Sans, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('↻', gx, gy + 1);
      }
    }
    delBtn.disabled = sel < 0;
  }

  /* ---- Speichern / Laden ---- */
  const speichern = () => {
    try {
      zeichne(false); const bild = cv.toDataURL('image/png'); zeichne();
      opt.speichern(bild);
      if (opt.speichern2) opt.speichern2({ base: base.toDataURL('image/png'), objs });
    } catch (e) {}
  };
  const zustand = () => ({ img: bx.getImageData(0, 0, base.width, base.height), objs: JSON.parse(JSON.stringify(objs)) });
  const merke = () => { verlauf.push(zustand()); if (verlauf.length > 30) verlauf.shift(); };
  const gespeichert = opt.laden2 && opt.laden2();
  const altBild = gespeichert ? gespeichert.base : (opt.laden && opt.laden());
  if (gespeichert && Array.isArray(gespeichert.objs)) objs = gespeichert.objs;
  if (altBild) { const img = new Image(); img.onload = () => { bx.drawImage(img, 0, 0); zeichne(); }; img.src = altBild; }
  zeichne();

  /* ---- Maus, Finger, Stift ---- */
  const punkt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
  const treffer = (x, y) => { for (let i = objs.length - 1; i >= 0; i--) { const o = objs[i]; if (Math.hypot(x - o.x, y - o.y) <= radius(o)) return i; } return -1; };
  const aufGriff = (x, y) => sel >= 0 && drehbar(objs[sel]) && Math.hypot(x - griff(objs[sel])[0], y - griff(objs[sel])[1]) < 16;
  const dicke = () => +dickeSel.value;
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); cv.focus({ preventScroll: true });
    const [x, y] = punkt(e);
    cv.setPointerCapture(e.pointerId);
    if (aufGriff(x, y)) { merke(); aktion = { art: 'drehen' }; return; }
    if (!radier) {
      const i = treffer(x, y);
      if (i >= 0) { merke(); sel = i; aktion = { art: 'ziehen', dx: x - objs[i].x, dy: y - objs[i].y }; zeichne(); return; }
    }
    if (typSel.value && !radier) {
      merke();
      const t = typSel.value, schwarz = farbe === '#222222';
      const std = t[0] === 'p' ? '#7d5ab5' : t[0] === 'm' ? '#3f9a4f' : t === 'e' ? '#3d6fb0' : '#8a8f99';
      objs.push({ t, x, y, a: 0, c: schwarz ? std : farbe });
      sel = objs.length - 1; aktion = { art: 'ziehen', dx: 0, dy: 0 };
      zeichne(); return;
    }
    sel = -1; merke();
    zug = [x, y];
    bx.globalCompositeOperation = 'source-over';
    bx.lineCap = 'round'; bx.lineJoin = 'round';
    bx.strokeStyle = radier ? 'white' : farbe;
    bx.lineWidth = radier ? 28 : (e.pointerType === 'pen' ? dicke() * (0.6 + 0.8 * (e.pressure || 0.5)) : dicke());
    bx.beginPath(); bx.moveTo(x, y); bx.lineTo(x + 0.1, y + 0.1); bx.stroke();
    zeichne();
  });
  cv.addEventListener('pointermove', e => {
    const [x, y] = punkt(e);
    if (aktion && sel >= 0) {
      const o = objs[sel];
      if (aktion.art === 'drehen') o.a = Math.atan2(-(x - o.x), -(y - o.y));
      else { o.x = x - aktion.dx; o.y = y - aktion.dy; }
      zeichne(); return;
    }
    if (!zug) {
      const ueber = !radier && (treffer(x, y) >= 0 || aufGriff(x, y));
      cv.style.cursor = ueber ? (aufGriff(x, y) ? 'grab' : 'move') : (typSel.value && !radier ? 'copy' : 'crosshair');
      return;
    }
    if (!radier && e.pointerType === 'pen') bx.lineWidth = dicke() * (0.6 + 0.8 * (e.pressure || 0.5));
    bx.beginPath(); bx.moveTo(zug[0], zug[1]); bx.lineTo(x, y); bx.stroke(); zug = [x, y];
    zeichne();
  });
  const ende = () => { if (zug || aktion) { zug = null; aktion = null; speichern(); } };
  cv.addEventListener('pointerup', ende); cv.addEventListener('pointercancel', ende);
  const entferne = () => { if (sel < 0) return; merke(); objs.splice(sel, 1); sel = -1; zeichne(); speichern(); };
  cv.addEventListener('keydown', e => { if ((e.key === 'Delete' || e.key === 'Backspace') && sel >= 0) { e.preventDefault(); entferne(); } });

  /* ---- Werkzeuge ---- */
  const radierBtn = zb.querySelector('.zb-radier');
  zb.querySelectorAll('.zb-farbe').forEach(b => b.addEventListener('click', () => {
    farbe = b.dataset.c; radier = false; radierBtn.classList.remove('aktiv');
    zb.querySelectorAll('.zb-farbe').forEach(x => x.classList.remove('aktiv')); b.classList.add('aktiv');
  }));
  radierBtn.addEventListener('click', () => { radier = !radier; radierBtn.classList.toggle('aktiv', radier); if (radier) { typSel.value = ''; sel = -1; zeichne(); } });
  typSel.addEventListener('change', () => { if (typSel.value) { radier = false; radierBtn.classList.remove('aktiv'); } });
  dickeSel.addEventListener('change', () => { typSel.value = ''; });
  delBtn.addEventListener('click', entferne);
  zb.querySelector('.zb-undo').addEventListener('click', () => {
    if (!verlauf.length) return; const z = verlauf.pop();
    bx.putImageData(z.img, 0, 0); objs = z.objs; sel = -1; zeichne(); speichern();
  });
  zb.querySelector('.zb-clear').addEventListener('click', () => { merke(); weiss(); objs = []; sel = -1; zeichne(); if (opt.loeschen) opt.loeschen(); });
};
