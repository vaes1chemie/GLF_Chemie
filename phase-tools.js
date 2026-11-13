/* ================================================================
   Gemeinsame Funktionen für die Seiten «Struktur & Eigenschaften», Phase 2–4
   Vor dem Einbinden muss die Seite window.PAGE = { key: '…', forms: '' } setzen.
   ================================================================ */
const PAGE = window.PAGE || { key: 'unbekannt', forms: '' };
const STORE_KEY = 'glf-fortschritt-' + PAGE.key;
let store = {};
try { store = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { store = {}; }
function saveStore() { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {} }
function resetFortschritt() {
  if (!confirm('Alle Ihre Eingaben auf dieser Seite löschen?')) return;
  try { localStorage.removeItem(STORE_KEY); } catch (e) {}
  location.reload();
}
const $id = id => document.getElementById(id);

/* ---------- Fortschrittsbalken und Seitenleiste ---------- */
window.addEventListener('scroll', () => {
  const el = document.documentElement;
  const pct = el.scrollHeight > el.clientHeight ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100 : 0;
  const f = $id('progressFill'); if (f) f.style.width = pct + '%';
});
(function () {
  const sections = document.querySelectorAll('section[id]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.sidebar .nav-item').forEach(a => a.classList.remove('active'));
      const link = document.querySelector('.sidebar .nav-item[href="#' + entry.target.id + '"]');
      if (link) link.classList.add('active');
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach(s => obs.observe(s));
})();

/* ---------- Verständnischecks (Multiple Choice) ---------- */
document.querySelectorAll('.option').forEach(o => {
  const span = document.createElement('span'); span.className = 'opt-text';
  [...o.childNodes].filter(n => !(n.classList && n.classList.contains('radio'))).forEach(n => span.appendChild(n));
  o.appendChild(span);
  o.addEventListener('click', () => selectOption(o));
});
function selectOption(el) {
  const q = el.closest('.question');
  if (q.classList.contains('answered')) return;
  const qi = [...document.querySelectorAll('.question')].indexOf(q);
  store.quiz = store.quiz || {}; store.quiz[qi] = [...q.querySelectorAll('.option')].indexOf(el); saveStore();
  q.classList.add('answered');
  const options = q.querySelectorAll('.option'), fb = q.querySelectorAll('.feedback');
  options.forEach(o => o.style.pointerEvents = 'none');
  if (el.dataset.correct === 'true') { el.classList.add('correct'); fb[0].classList.add('show'); }
  else {
    el.classList.add('wrong');
    options.forEach(o => { if (o.dataset.correct === 'true') o.classList.add('correct'); });
    fb[1].classList.add('show');
  }
}

/* ---------- Lernziele als Checkliste ---------- */
document.querySelectorAll('section[id] .lernziele').forEach(box => {
  const sec = box.closest('section').id;
  box.querySelectorAll('li').forEach((li, i) => {
    const key = sec + ':' + i;
    li.innerHTML = `<label><input type="checkbox"><span>${li.innerHTML}</span></label>`;
    const cb = li.querySelector('input');
    cb.checked = !!(store.lernziele || {})[key];
    li.classList.toggle('erreicht', cb.checked);
    cb.addEventListener('change', () => {
      store.lernziele = store.lernziele || {}; store.lernziele[key] = cb.checked; saveStore();
      li.classList.toggle('erreicht', cb.checked);
    });
  });
  box.insertAdjacentHTML('beforeend', '<p class="lz-hinweis">Haken Sie ab, was Sie sicher können. Ihre Auswahl wird in diesem Browser gespeichert.</p>');
});

/* ---------- Notizfelder ---------- */
document.querySelectorAll('.notiz-box').forEach(nb => {
  const key = 'notiz:' + nb.dataset.key;
  nb.innerHTML = `<div class="gate-title">${nb.dataset.label || 'Ihre Notizen'}</div><textarea></textarea>`;
  const ta = nb.querySelector('textarea');
  ta.value = store[key] || '';
  ta.addEventListener('input', () => { store[key] = ta.value; saveStore(); });
});

/* ---------- Karten zum Aufdecken ---------- */
document.querySelectorAll('.sr-card').forEach((c, i) => {
  const key = c.dataset.key || ('karte' + i);
  const setze = auf => { c.classList.toggle('open', auf); c.setAttribute('aria-expanded', auf ? 'true' : 'false'); };
  // erneuter Klick dreht die Karte wieder zurück
  c.addEventListener('click', () => { const auf = !c.classList.contains('open'); setze(auf); store.karten = store.karten || {}; if (auf) store.karten[key] = 1; else delete store.karten[key]; saveStore(); });
  if ((store.karten || {})[key]) setze(true);
});

/* ---------- Vorhersagen (werden gespeichert, nicht bewertet) ---------- */
document.querySelectorAll('.predict').forEach(p => {
  const key = 'vorhersage:' + p.dataset.key;
  const btns = p.querySelectorAll('.tool-btn');
  p.id = p.id || 'vorhersage-' + p.dataset.key;
  // Abschnittsnummer der Vorhersage (z. B. «5.1») aus dem vorangehenden Titel
  let h = p.closest('.widget') || p; while (h && h.tagName !== 'H3') h = h.previousElementSibling;
  const nr = h ? (h.textContent.match(/^\s*(\d+\.\d+)/) || [])[1] : '';
  const link = '<a href="#' + p.id + '">Zur Vorhersage' + (nr ? ' in ' + nr : '') + ' &uarr;</a>';
  const show = v => {
    btns.forEach(b => b.classList.toggle('chosen', b.dataset.v === v));
    document.querySelectorAll('.predict-echo[data-key="' + p.dataset.key + '"]').forEach(e => {
      const b = [...btns].find(x => x.dataset.v === v);
      e.innerHTML = (b ? 'Ihre Vorhersage war: <strong>' + b.textContent + '</strong>' : 'Sie haben noch keine Vorhersage gemacht.') + ' · ' + link;
    });
  };
  btns.forEach(b => b.addEventListener('click', () => { store[key] = b.dataset.v; saveStore(); show(b.dataset.v); }));
  show(store[key]);
});

/* ---------- Auswahlfragen mit Rückmeldung (mehrere Versuche) ---------- */
function renderChoices(container, items, options) {
  if (typeof container === 'string') container = $id(container);
  container.innerHTML = items.map((it, i) => `
    <div class="tool-question">
      <div class="tool-prompt"><span class="nr">${i + 1}.</span>${it.p}</div>
      <div class="tool-options">${(it.options || options).map(o => `<button class="tool-btn" data-v="${o.v}">${o.l}</button>`).join('')}</div>
      <div class="tool-feedback correct">${it.ok}</div>
      <div class="tool-feedback wrong">${it.no}</div>
    </div>`).join('');
  container.querySelectorAll('.tool-question').forEach((q, i) => {
    const key = container.id + ':' + items[i].p.replace(/<[^>]+>/g, '');
    q.addEventListener('click', e => {
      const btn = e.target.closest('.tool-btn');
      if (!btn || q.dataset.locked) return;
      const correct = btn.dataset.v === items[i].a;
      q.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('selected-correct', 'selected-wrong'));
      btn.classList.add(correct ? 'selected-correct' : 'selected-wrong');
      q.querySelectorAll('.tool-feedback').forEach(f => f.classList.remove('show'));
      q.querySelector('.tool-feedback.' + (correct ? 'correct' : 'wrong')).classList.add('show');
      if (correct) {
        q.dataset.locked = '1'; q.querySelectorAll('.tool-btn').forEach(b => { if (b !== btn) b.style.opacity = '0.45'; });
        store.tool = store.tool || {}; store.tool[key] = btn.dataset.v; saveStore();
      }
    });
    const v = (store.tool || {})[key];
    if (v) { const b = q.querySelector('.tool-btn[data-v="' + v + '"]'); if (b) b.click(); }
  });
}

/* ---------- Tabellen mit Auswahlfeldern zum Prüfen ---------- */
document.querySelectorAll('.check-table').forEach(wrap => {
  const key = 'tabelle:' + wrap.dataset.key;
  const sels = [...wrap.querySelectorAll('select')];
  const saved = store[key] || {};
  sels.forEach((s, i) => {
    s.insertAdjacentHTML('afterbegin', '<option value="">– wählen –</option>');
    s.value = (saved.vals || [])[i] || '';
    s.addEventListener('change', () => {
      s.classList.remove('ok', 'bad');
      const st = store[key] = store[key] || {}; st.vals = sels.map(x => x.value); saveStore();
    });
  });
  const msg = wrap.querySelector('.ct-msg'), solveBtn = wrap.querySelector('.ct-solve');
  function check() {
    let ok = 0;
    sels.forEach(s => {
      const good = s.value === s.dataset.answer;
      s.classList.toggle('ok', good); s.classList.toggle('bad', !good);
      if (good) ok++;
    });
    const min = Math.ceil(sels.length * 0.7);
    if (solveBtn && ok >= min) { solveBtn.disabled = false; solveBtn.textContent = 'Lösung zeigen'; }
    msg.textContent = ok === sels.length ? 'Perfekt – alles richtig!' : ok + ' von ' + sels.length + ' richtig. Verbessern Sie die rot markierten Felder.' + (solveBtn && ok < min ? ' Ab ' + min + ' richtigen können Sie die Lösung anzeigen.' : '');
    const st = store[key] = store[key] || {}; st.checked = true; saveStore();
  }
  wrap.querySelector('.ct-check').addEventListener('click', check);
  if (solveBtn) solveBtn.addEventListener('click', () => {
    if (solveBtn.disabled) return;
    sels.forEach(s => { s.value = s.dataset.answer; s.classList.add('ok'); s.classList.remove('bad'); });
    const st = store[key] = store[key] || {}; st.vals = sels.map(x => x.value); saveStore();
    msg.textContent = '';
  });
  if (saved.checked) check();
});

/* ---------- Reihenfolge-Aufgaben ---------- */
document.querySelectorAll('.order-task').forEach(t => {
  const key = 'reihe:' + t.dataset.key;
  const correct = t.dataset.order.split(',');
  const pool = t.querySelector('.ot-pool'), line = t.querySelector('.ot-line'), msg = t.querySelector('.ot-msg');
  let seq = (store[key] || []).slice();
  function render() {
    pool.querySelectorAll('.ot-item').forEach(b => { b.disabled = seq.includes(b.dataset.v); });
    line.innerHTML = seq.length ? seq.map((v, i) => `<span class="ot-chip">${i + 1}. ${pool.querySelector('[data-v="' + v + '"]').innerHTML}</span>`).join('<span class="ot-arrow">&lt;</span>') : '<span class="empty">Klicken Sie die Stoffe in der richtigen Reihenfolge an.</span>';
  }
  pool.addEventListener('click', e => {
    const b = e.target.closest('.ot-item'); if (!b || b.disabled) return;
    seq.push(b.dataset.v); store[key] = seq; saveStore(); msg.textContent = ''; render();
  });
  t.querySelector('.ot-reset').addEventListener('click', () => { seq = []; store[key] = seq; saveStore(); msg.textContent = ''; msg.className = 'ot-msg'; render(); });
  t.querySelector('.ot-check').addEventListener('click', () => {
    if (seq.length < correct.length) { msg.className = 'ot-msg bad'; msg.textContent = 'Ordnen Sie zuerst alle Stoffe ein.'; return; }
    const ok = seq.every((v, i) => v === correct[i]);
    msg.className = 'ot-msg ' + (ok ? 'ok' : 'bad');
    msg.innerHTML = ok ? '✓ ' + t.dataset.ok : '✗ ' + t.dataset.no;
  });
  render();
});

/* ---------- Lernkontrolle (MS Forms) ---------- */
if (PAGE.forms && $id('formsBlock')) { $id('formsLink').href = PAGE.forms; $id('formsBlock').style.display = 'block'; }

/* ---------- Quizantworten wiederherstellen ---------- */
window.addEventListener('DOMContentLoaded', () => {
  Object.entries(store.quiz || {}).forEach(([qi, oi]) => {
    const q = document.querySelectorAll('.question')[qi];
    const o = q && q.querySelectorAll('.option')[oi];
    if (o && !q.classList.contains('answered')) selectOption(o);
  });
});

/* ---------- Zeichenfelder (mit Maus, Finger oder Stift) ---------- */
document.querySelectorAll('.zeichen-box').forEach(zb => {
  const key = 'zeichnung:' + zb.dataset.key;
  zb.innerHTML = `<div class="gate-title">${zb.dataset.label || 'Ihre Zeichnung'}</div>
    <canvas width="1000" height="460"></canvas>
    <div class="zb-tools">
      <button type="button" class="zb-farbe aktiv" data-c="#222222" title="Schwarz" style="--c:#222222"></button>
      <button type="button" class="zb-farbe" data-c="#3d6fb0" title="Blau" style="--c:#3d6fb0"></button>
      <button type="button" class="zb-farbe" data-c="#c05050" title="Rot" style="--c:#c05050"></button>
      <button type="button" class="zb-farbe" data-c="#3f9a4f" title="Grün" style="--c:#3f9a4f"></button>
      <button type="button" class="btn zb-radier">Radierer</button>
      <button type="button" class="btn zb-undo">Rückgängig</button>
      <button type="button" class="btn zb-clear">Alles löschen</button>
    </div>`;
  const cv = zb.querySelector('canvas'), ctx = cv.getContext('2d');
  let farbe = '#222222', radier = false, zug = null;
  const verlauf = [];
  const speichern = () => { try { store[key] = cv.toDataURL('image/png'); saveStore(); } catch (e) {} };
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
    verlauf.push(ctx.getImageData(0, 0, cv.width, cv.height)); weiss(); delete store[key]; saveStore();
  });
});
