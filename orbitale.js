/* ================================================================
   Orbitale in 3D: kleine drehende Vorschaubilder (canvas.orb-mini)
   und ein grosser Viewer (div.orb-viewer) mit Auswahl und Drehen.
   ================================================================ */
(function () {
  const O = {
    '1s':  { g: 's', kugel: [[0.38, 0, 1]], info: '1s: kugelförmig. Ein Orbital, max. 2 Elektronen.' },
    '2s':  { g: 's', kugel: [[0.85, 0, 0.8], [0.22, 1, 0.2]], info: '2s: ebenfalls kugelförmig, aber grösser als 1s. Innen liegt eine zweite, kleine Kugelschale.' },
    '2px': { g: 'p', f: (x, y, z, r) => x / r, rad: r => r * Math.exp(-r / 2), R: 10, info: '2p<sub>x</sub>: Hantel entlang der x-Achse.' },
    '2py': { g: 'p', f: (x, y, z, r) => y / r, rad: r => r * Math.exp(-r / 2), R: 10, info: '2p<sub>y</sub>: Hantel entlang der y-Achse.' },
    '2pz': { g: 'p', f: (x, y, z, r) => z / r, rad: r => r * Math.exp(-r / 2), R: 10, info: '2p<sub>z</sub>: Hantel entlang der z-Achse.' },
    'alle 2p': { g: 'p', alle: ['2px', '2py', '2pz'], R: 10, info: 'Die drei p-Orbitale stehen senkrecht aufeinander. Zusammen fassen sie 6 Elektronen.' },
    '3dxy': { g: 'd', f: (x, y, z, r) => x * y / (r * r), rad: r => r * r * Math.exp(-r / 3), R: 20, info: '3d<sub>xy</sub>: vier Keulen zwischen der x- und der y-Achse («Kleeblatt»).' },
    '3dxz': { g: 'd', f: (x, y, z, r) => x * z / (r * r), rad: r => r * r * Math.exp(-r / 3), R: 20, info: '3d<sub>xz</sub>: vier Keulen zwischen der x- und der z-Achse.' },
    '3dyz': { g: 'd', f: (x, y, z, r) => y * z / (r * r), rad: r => r * r * Math.exp(-r / 3), R: 20, info: '3d<sub>yz</sub>: vier Keulen zwischen der y- und der z-Achse.' },
    '3dx²−y²': { g: 'd', f: (x, y, z, r) => (x * x - y * y) / (r * r), rad: r => r * r * Math.exp(-r / 3), R: 20, info: '3d<sub>x²−y²</sub>: vier Keulen direkt auf der x- und der y-Achse.' },
    '3dz²': { g: 'd', f: (x, y, z, r) => (3 * z * z - r * r) / (r * r), rad: r => r * r * Math.exp(-r / 3), R: 20, info: '3d<sub>z²</sub>: Hantel entlang z mit einem Ring in der Mitte. Zusammen fassen die fünf d-Orbitale 10 Elektronen.' } };
  const cache = {};
  function wolke(key, n, form) {
    const ck = key + n + form; if (cache[ck]) return cache[ck];
    const o = O[key], pts = [];
    if (o.alle) {
      o.alle.forEach((kk, i) => wolke(kk, Math.round(n / 3), form).forEach(p => pts.push([p[0] * O[kk].R / o.R, p[1] * O[kk].R / o.R, p[2] * O[kk].R / o.R, p[3] + 2 * i])));
      return (cache[ck] = pts);
    }
    if (form && o.kugel) {
      o.kugel.forEach(([rr, sign, anteil]) => { for (let i = 0; i < n * anteil; i++) { const u = Math.random() * 2 - 1, t = Math.random() * 6.283, q = Math.sqrt(1 - u * u); pts.push([rr * q * Math.cos(t), rr * q * Math.sin(t), rr * u, sign]); } });
      return (cache[ck] = pts);
    }
    if (o.kugel) { // Punktwolke für s: radiale Dichte
      const rad = key === '1s' ? r => Math.exp(-r / 0.16) : r => Math.abs(1 - r / 0.33) * Math.exp(-r / 0.33);
      while (pts.length < n) { const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1, z = Math.random() * 2 - 1, r = Math.hypot(x, y, z); if (r > 1) continue; const w = rad(r) / (key === '1s' ? 1 : 1); if (Math.random() < w * w) pts.push([x, y, z, key === '2s' && r < 0.33 ? 1 : 0]); }
      return (cache[ck] = pts);
    }
    const psi = (x, y, z) => { const r = Math.hypot(x, y, z) || 1e-6; return o.rad(r) * o.f(x, y, z, r); };
    let maxp = 0;
    for (let i = 0; i < 30000; i++) { const v = Math.abs(psi((Math.random() * 2 - 1) * o.R, (Math.random() * 2 - 1) * o.R, (Math.random() * 2 - 1) * o.R)); if (v > maxp) maxp = v; }
    let tries = 0;
    while (pts.length < n && tries < 2500000) {
      tries++;
      const x = (Math.random() * 2 - 1) * o.R, y = (Math.random() * 2 - 1) * o.R, z = (Math.random() * 2 - 1) * o.R;
      if (Math.hypot(x, y, z) > o.R) continue;
      const v = psi(x, y, z), w = Math.abs(v) / maxp;
      if (form ? (w > 0.26 && w < 0.31) : Math.random() < w * w * 1.6) pts.push([x / o.R, y / o.R, z / o.R, v >= 0 ? 0 : 1]);
    }
    return (cache[ck] = pts);
  }
  const FARBEN = [[[250, 204, 21], [249, 115, 22]], [[96, 165, 250], [52, 211, 153]], [[244, 114, 182], [167, 139, 250]]];
  function farbe(i, tiefe, a) { const c = FARBEN[Math.floor(i / 2) % 3][i % 2], k = 0.62 + 0.38 * (tiefe + 1) / 2; return 'rgba(' + c.map(v => Math.round(v * k)).join(',') + ',' + a + ')'; }
  function szene(cv, opt) {
    const ctx = cv.getContext('2d');
    const st = { ax: -0.45, ay: 0.6, pts: [], form: true, auto: true, drag: null };
    function rot(p) {
      const [x, y, z] = p;
      const X = x * Math.cos(st.ay) - y * Math.sin(st.ay), Y = x * Math.sin(st.ay) + y * Math.cos(st.ay);
      return [X, Y * Math.sin(st.ax) + z * Math.cos(st.ax), Y * Math.cos(st.ax) - z * Math.sin(st.ax)];
    }
    function zeichne() {
      const W = cv.width, S = W * 0.42, C = W / 2;
      ctx.fillStyle = opt.hell ? '#ffffff' : '#0f172a'; ctx.fillRect(0, 0, W, W);
      [[1, 0, 0, 'x'], [0, 1, 0, 'y'], [0, 0, 1, 'z']].forEach(a => {
        const p = rot(a), m = rot([-a[0], -a[1], -a[2]]);
        ctx.strokeStyle = opt.hell ? 'rgba(100,116,139,0.45)' : 'rgba(203,213,225,0.45)'; ctx.lineWidth = W / 400;
        ctx.beginPath(); ctx.moveTo(C + m[0] * S * 1.1, C - m[1] * S * 1.1); ctx.lineTo(C + p[0] * S * 1.1, C - p[1] * S * 1.1); ctx.stroke();
        ctx.fillStyle = opt.hell ? '#64748b' : '#e2e8f0'; ctx.font = '600 ' + Math.round(W / 28) + 'px DM Sans, sans-serif';
        ctx.fillText(a[3], C + p[0] * S * 1.17 - W / 90, C - p[1] * S * 1.17 + W / 80);
      });
      const pr = st.pts.map(p => { const r = rot(p); return [r[0], r[1], r[2], p[3]]; }).sort((a, b) => b[2] - a[2]);
      const pr0 = W / (opt.hell ? 190 : (st.form ? 260 : 300));
      pr.forEach(p => {
        const x = C + p[0] * S, y = C - p[1] * S;
        ctx.fillStyle = farbe(p[3], -p[2], st.form ? 0.85 : 0.7);
        if (st.form) { ctx.beginPath(); ctx.arc(x, y, pr0, 0, 6.283); ctx.fill(); } else ctx.fillRect(x - pr0, y - pr0, 2 * pr0, 2 * pr0);
      });
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(C, C, W / 120, 0, 6.283); ctx.fill();
    }
    cv.style.touchAction = 'none'; cv.style.cursor = 'grab';
    cv.addEventListener('pointerdown', e => { st.drag = [e.clientX, e.clientY]; st.auto = false; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
    cv.addEventListener('pointermove', e => { if (!st.drag) return; st.ay += (e.clientX - st.drag[0]) * 0.01; st.ax = Math.max(-1.5, Math.min(1.5, st.ax + (e.clientY - st.drag[1]) * 0.01)); st.drag = [e.clientX, e.clientY]; });
    const up = () => { st.drag = null; cv.style.cursor = 'grab'; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    let sichtbar = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { sichtbar = es[0].isIntersecting; }).observe(cv);
    (function loop() { if (sichtbar) { if (st.auto) st.ay += 0.005; zeichne(); } requestAnimationFrame(loop); })();
    return st;
  }
  function init() {
    document.querySelectorAll('canvas.orb-mini').forEach(cv => { const st = szene(cv, { hell: true }); st.pts = wolke(cv.dataset.orb, 3000, true); });
    document.querySelectorAll('.orb-viewer').forEach(box => {
      box.innerHTML = '<div class="ov-wrap"><canvas width="640" height="640"></canvas><div class="ov-side">'
        + '<h4>s-Orbitale</h4><div class="grp" data-g="s"></div><h4>p-Orbitale</h4><div class="grp" data-g="p"></div><h4>d-Orbitale</h4><div class="grp" data-g="d"></div>'
        + '<h4>Darstellung</h4><div class="grp"><button class="tool-btn chosen" data-m="form">Form</button><button class="tool-btn" data-m="wolke">Punktwolke</button></div>'
        + '<div class="ov-info"></div></div></div>';
      const cv = box.querySelector('canvas'), st = szene(cv, {}), info = box.querySelector('.ov-info');
      let akt = '2pz';
      const lade = k => { akt = k; st.pts = wolke(k, 6000, st.form); box.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('chosen', b.dataset.k === k)); info.innerHTML = O[k].info; };
      Object.keys(O).forEach(k => { const b = document.createElement('button'); b.className = 'tool-btn'; b.dataset.k = k; b.innerHTML = k.replace(/(\d)([spd])(.+)?/, (m, n, l, r) => n + l + (r ? '<sub>' + r + '</sub>' : '')); b.onclick = () => lade(k); box.querySelector('.grp[data-g="' + O[k].g + '"]').appendChild(b); });
      box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { st.form = b.dataset.m === 'form'; box.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('chosen', x === b)); lade(akt); });
      lade('2pz');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
