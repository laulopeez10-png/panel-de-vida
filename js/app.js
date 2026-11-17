// Mis hábitos · inspirado en Hábitos Atómicos (James Clear). Todo se guarda en el celu; nada sale a internet.
(function () {
  'use strict';
  const CLAVE = 'hab:estado';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ── Guardado ─────────────────────────────────────────────────────────
  let S = null;
  try { const t = localStorage.getItem(CLAVE); if (t) S = JSON.parse(t); } catch (e) {}
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) { avisar('No se pudo guardar'); } };
  const VACIO = () => ({
    version: 2, persona: { nombre: '' }, identidades: [], habitos: [],
    malos: { celu: { pregunta: '¿Anoche soltaste el celu a tiempo?', registro: {}, plan: [] }, fumar: { registro: {}, plan: [], oculto: true }, postergar: { lista: [], plan: [] } },
    facu: [], salud: { sueno: [], suenoMin: 6, suenoMeta: 7.5, peso: [], pesoInicio: null, pesoMeta: null }, nota: '',
  });
  // Trae fechas de la facu, sueño y peso de la versión anterior (Panel de vida), si existe en este celu
  function migrarViejo() {
    try {
      const v = JSON.parse(localStorage.getItem('pdv:estado') || 'null');
      if (!v || S.migrado) return;
      if (Array.isArray(v.facu) && v.facu.length) { const ids = new Set(v.facu.map((f) => f.id)); S.facu = [...v.facu, ...S.facu.filter((f) => !ids.has(f.id))]; }
      if (v.salud) { if (v.salud.sueno && v.salud.sueno.length) S.salud.sueno = v.salud.sueno; if (v.salud.peso && v.salud.peso.length > S.salud.peso.length) S.salud.peso = v.salud.peso; }
      S.migrado = true;
    } catch (e) {}
  }

  // ── Fechas y formatos ────────────────────────────────────────────────
  const nf1 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DIAS_C = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const hoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const desdeIso = (s) => { const [a, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(a, m - 1, d); };
  const masDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const diasEntre = (a, b) => Math.round((desdeIso(iso(b)) - desdeIso(iso(a))) / 864e5);
  const lunesDe = (d) => masDias(d, -((d.getDay() + 6) % 7));
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const fechaCorta = (d) => d.getDate() + ' ' + MC[d.getMonth()];
  const fechaLarga = (d) => cap(DIAS[d.getDay()]) + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()];
  const cuando = (n) => n === 0 ? 'hoy' : n === 1 ? 'mañana' : n === -1 ? 'ayer' : n > 1 && n < 7 ? 'el ' + DIAS[masDias(hoy(), n).getDay()] : n > 0 ? 'en ' + n + ' días' : 'hace ' + -n + ' días';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const colorVar = (c) => (c && c.startsWith('#') ? c : `var(--${c || 'acento'})`);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const numero = (v) => { const s = String(v ?? '').trim().replace(',', '.'); return s === '' ? NaN : parseFloat(s); };

  // ── Íconos ───────────────────────────────────────────────────────────
  const I = {
    hoy: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    habitos: '<path d="M4 19V5M4 19h16"/><path d="m7.5 14.5 3.5-4 3 2.5 5-6"/>',
    birrete: '<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z"/><path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5M22 9.5V15"/>',
    yo: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    mas: '<path d="M12 5v14M5 12h14"/>', menos: '<path d="M5 12h14"/>',
    luna: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
    sol: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>',
    gota: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/>',
    pesa: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    libro: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
    taza: '<path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2.5v2.5M12 2.5v2.5"/>',
    aviso: '<path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4M12 17h.01"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    objetivos: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    celu: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    humo: '<path d="M3 16h14v3H3zM19 16v3M21.5 16v3"/><path d="M18 13c0-2 2-2 2-4s-2-2-2-4"/>',
    flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    izq: '<path d="m15 6-6 6 6 6"/>', der: '<path d="m9 6 6 6-6 6"/>',
    corazon: '<path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.3 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>',
  };
  const ico = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || I.check}</svg>`;
  const cabeza = (icono, titulo, extra = '') => `<header class="t-cabeza"><h2>${ico(icono)}<span>${titulo}</span></h2>${extra}</header>`;
  const chip = (t, c = '') => `<span class="chip ${c}">${t}</span>`;

  let tAviso;
  function avisar(t) { const a = $('#aviso'); a.textContent = t; a.classList.add('ver'); clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove('ver'), 2400); }

  // ── Ventana con formulario ───────────────────────────────────────────
  function formulario({ titulo, campos = [], ok = 'Guardar', alGuardar, borrar, texto }) {
    const m = $('#modal'), f = $('#modal-form');
    const campo = (c) => {
      const v = c.v ?? '';
      if (c.tipo === 'check') return `<label class="check-label"><input type="checkbox" name="${c.n}" ${v ? 'checked' : ''}>${esc(c.et)}</label>`;
      if (c.tipo === 'select') return `<label>${esc(c.et)}<select name="${c.n}">${c.ops.map(([val, t]) => `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
      if (c.tipo === 'textarea') return `<label>${esc(c.et)}<textarea name="${c.n}" placeholder="${esc(c.ph || '')}">${esc(v)}</textarea>${c.ayuda ? `<span class="ayuda">${esc(c.ayuda)}</span>` : ''}</label>`;
      if (c.tipo === 'dos') return `<div class="dos">${c.campos.map(campo).join('')}</div>`;
      const num = c.tipo === 'num';
      return `<label>${esc(c.et)}<input type="${num ? 'text' : c.tipo || 'text'}" ${num ? 'inputmode="decimal"' : ''} name="${c.n}" value="${esc(v)}" placeholder="${esc(c.ph || '')}" ${c.req ? 'required' : ''} autocomplete="off">${c.ayuda ? `<span class="ayuda">${esc(c.ayuda)}</span>` : ''}</label>`;
    };
    f.innerHTML = `<h3>${esc(titulo)}</h3>${texto ? `<p class="sub">${texto}</p>` : ''}${campos.map(campo).join('')}
      <div class="modal-botones">${borrar ? '<button type="button" class="boton boton-peligro" data-m="borrar">Borrar</button>' : ''}
      <button type="button" class="boton" data-m="cerrar">${alGuardar ? 'Cancelar' : 'Cerrar'}</button>${alGuardar ? `<button type="submit" class="boton boton-fuerte">${esc(ok)}</button>` : ''}</div>`;
    f.onsubmit = (ev) => {
      ev.preventDefault();
      const vals = {}, todos = [];
      campos.forEach((c) => (c.tipo === 'dos' ? todos.push(...c.campos) : todos.push(c)));
      todos.forEach((c) => { const el = f.elements[c.n]; vals[c.n] = c.tipo === 'check' ? el.checked : c.tipo === 'num' ? numero(el.value) : el.value.trim(); });
      if (alGuardar(vals) === false) return;
      m.close(); guardar(); pintar();
    };
    $('[data-m="cerrar"]', f).onclick = () => m.close();
    if (borrar) $('[data-m="borrar"]', f).onclick = (e) => {
      const b = e.currentTarget;
      if (!b.dataset.seguro) { b.dataset.seguro = 1; b.textContent = '¿Seguro? Tocá de nuevo'; return; }
      borrar(); m.close(); guardar(); pintar(); avisar('Borrado');
    };
    m.showModal();
  }

  // ── Temporizador (regla de los 2 minutos / ganas de fumar) ───────────
  let tTimer = null;
  function temporizador(titulo, minutos, texto) {
    const m = $('#modal'), f = $('#modal-form');
    let resta = minutos * 60;
    const fmt = () => `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
    f.innerHTML = `<h3>${esc(titulo)}</h3><p class="sub">${texto}</p><div class="timer" id="timer">${fmt()}</div>
      <div class="modal-botones"><button type="button" class="boton boton-fuerte" data-m="cerrar">Listo</button></div>`;
    f.onsubmit = (e) => e.preventDefault();
    clearInterval(tTimer);
    tTimer = setInterval(() => {
      resta--; const el = $('#timer'); if (!el) return clearInterval(tTimer);
      el.textContent = fmt();
      if (resta <= 0) { clearInterval(tTimer); el.textContent = '¡Listo!'; el.classList.add('fin'); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} }
    }, 1000);
    $('[data-m="cerrar"]', f).onclick = () => { clearInterval(tTimer); m.close(); };
    m.showModal();
  }

  // ══ Lógica de hábitos ═════════════════════════════════════════════════
  const MOMENTOS = [['manana', 'Mañana', 'sol'], ['mediodia', 'Mediodía', 'taza'], ['tarde', 'Tarde', 'pesa'], ['noche', 'Noche', 'luna']];
  const habito = (id) => S.habitos.find((h) => h.id === id);
  const suenoDe = (k) => (S.salud.sueno.find((s) => s.fecha === k) || {}).horas;
  // Devuelve 1 (hecho), 0.5 (versión mínima) o 0
  function valor(h, d) {
    const k = iso(d);
    if (h.tipo === 'sueno') { const v = suenoDe(k); return v == null ? 0 : v >= S.salud.suenoMin ? 1 : 0.5; }
    const v = h.dias[k];
    if (h.tipo === 'cantidad') return !v ? 0 : v >= h.meta ? 1 : v >= h.meta / 2 ? 0.5 : 0;
    return v || 0;
  }
  const aplica = (h, d) => { if (h.desde && iso(d) < h.desde) return false; if (h.tipo === 'segun') { const p = habito(h.segun); return p ? valor(p, d) > 0 : true; } return true; };
  const semanal = (h) => h.frec === 'semana';
  const cuentaSemana = (h, d) => { const l = lunesDe(d); let n = 0; for (let i = 0; i < 7; i++) if (valor(h, masDias(l, i)) > 0) n++; return n; };
  function racha(h) {
    let n = 0;
    if (semanal(h)) {
      let l = masDias(lunesDe(hoy()), -7);
      while (cuentaSemana(h, l) >= h.veces && l >= masDias(desdeIso(h.desde || '2000-01-01'), -7)) { n++; l = masDias(l, -7); }
      if (cuentaSemana(h, hoy()) >= h.veces) n++;
      return n ? `${n} ${n === 1 ? 'semana seguida' : 'semanas seguidas'}` : '';
    }
    let d = hoy(); if (valor(h, d) === 0) d = masDias(d, -1);
    for (let i = 0; i < 400; i++) { if (!aplica(h, d)) { if (h.tipo === 'segun' && (!h.desde || iso(d) >= h.desde)) { d = masDias(d, -1); continue; } break; } if (valor(h, d) > 0) { n++; d = masDias(d, -1); } else break; }
    return n ? `${n} ${n === 1 ? 'día seguido' : 'días seguidos'}` : '';
  }
  // "Nunca fallar dos veces": ¿ayer no salió y hoy todavía no?
  function enRiesgo(h) {
    const d = hoy(), ay = masDias(d, -1);
    if (semanal(h)) { const falta = h.veces - cuentaSemana(h, d); const quedan = 7 - ((d.getDay() + 6) % 7); return valor(h, d) === 0 && falta > 0 && falta >= quedan ? 'hoy sí o sí' : ''; }
    if (h.tipo === 'segun') return '';
    return aplica(h, ay) && valor(h, ay) === 0 && valor(h, d) === 0 ? 'no faltes dos veces' : '';
  }
  const visibleHoy = (h) => h.tipo !== 'segun' || aplica(h, hoy());
  function votosSemana(identId) { const l = lunesDe(hoy()); let n = 0; S.habitos.filter((h) => h.ident === identId).forEach((h) => { for (let i = 0; i < 7; i++) if (valor(h, masDias(l, i)) > 0) n++; }); return n; }

  function marcar(h, v) {
    const k = iso(hoy());
    if (h.tipo === 'sueno') return editarSueno();
    if (h.dias[k] === v) delete h.dias[k]; else h.dias[k] = v;
    guardar();
    if (h.dias[k]) { const id = S.identidades.find((i) => i.id === h.ident); avisar(v === 1 ? `+1 voto${id ? ': ' + id.texto.replace(/^Soy alguien que /, '').slice(0, 40) : ''}` : 'Versión mínima: igual cuenta'); }
    pintar();
  }

  // ── Facu ─────────────────────────────────────────────────────────────
  const facuPend = () => S.facu.filter((f) => !f.hecho && f.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const nombreFacu = (f) => `${f.titulo || cap(f.tipo)} de ${f.materia}`;
  // Plan de estudio: cada fecha arranca con anticipación y reparte los temas hasta el día anterior
  const ANTICIPO = { final: 21, parcial: 7, coloquio: 7, entrega: 4, otro: 5 };
  const temasDe = (f) => f.temas && f.temas.length ? f.temas : f.tipo === 'entrega' ? ['Leer la consigna y juntar el material', 'Escribir el borrador', 'Revisar y entregar'] : ['Eje 1', 'Eje 2', 'Eje 3', 'Repaso general y modelo de examen'];
  const inicioDe = (f) => f.inicio ? desdeIso(f.inicio) : masDias(desdeIso(f.fecha), -(ANTICIPO[f.tipo] || 5));
  function plan(f, d = hoy()) {
    const temas = temasDe(f), hechos = new Set(f.temasHechos || []), n = temas.length;
    const ini = inicioDe(f), base = S.planDesde && iso(ini) < S.planDesde ? desdeIso(S.planDesde) : ini;
    const dias = Math.max(1, diasEntre(base, desdeIso(f.fecha)));
    const pasados = Math.min(dias, Math.max(0, diasEntre(base, d)));
    const esperado = Math.min(n, Math.ceil((n * pasados) / dias));
    const listos = temas.filter((_, i) => hechos.has(i)).length;
    const sig = temas.findIndex((_, i) => !hechos.has(i));
    return { temas, hechos, n, ini, listos, sig, atraso: esperado - listos, empezo: d >= ini, faltan: diasEntre(d, desdeIso(f.fecha)) };
  }
  const activos = (d = hoy()) => facuPend().filter((f) => f.fecha >= iso(d)).map((f) => ({ f, p: plan(f, d) })).filter((x) => x.p.empezo && x.p.sig >= 0);
  const estadoPlan = (p) => p.atraso > 1 ? chip(`atrasado ${p.atraso} temas`, 'chip-mal') : p.atraso === 1 ? chip('1 tema atrás', 'chip-aviso') : chip('vas al día', 'chip-bien');
  function tarjetaEstudio() {
    const a = activos(); if (!a.length) return '';
    return `<section class="tarjeta estudio">${cabeza('birrete', 'Hoy estudiás', chip(a.length === 1 ? '1 materia' : a.length + ' materias'))}
      <ul class="lista">${a.map(({ f, p }, i) => `<li class="item"><div class="item-cuerpo item-click" data-plan-f="${f.id}"><b>${esc(p.temas[p.sig])}</b><span>${esc(f.materia)} · ${esc(f.titulo || cap(f.tipo))} ${cuando(p.faltan)} · ${p.listos}/${p.n}</span><span>${estadoPlan(p)}${i === 0 ? ' <span class="etiqueta">PRIMERO ESTO</span>' : ''}</span></div>
        <button class="check" data-tema="${f.id}|${p.sig}" aria-label="Tema terminado">${ico('check')}</button></li>`).join('')}</ul>
      ${a.length > 1 ? `<p class="mini" style="margin-top:8px">Con ${a.length} materias en paralelo, una hora no alcanza: empezá por la de arriba y, si podés, sumá otro bloque corto.</p>` : ''}</section>`;
  }
  const cajaDias = (n) => `<div class="dias-box ${n <= 2 ? 'urgente' : n <= 7 ? 'pronto' : ''}"><strong>${n < 0 ? '!' : n}</strong><small>${n < 0 ? 'pasó' : n === 1 ? 'día' : 'días'}</small></div>`;

  // ══ Pantallas ═════════════════════════════════════════════════════════
  const TABS = [['hoy', 'Hoy', 'hoy'], ['habitos', 'Hábitos', 'habitos'], ['facu', 'Facu', 'birrete'], ['yo', 'Yo', 'yo']];
  const seccion = () => { const h = location.hash.slice(1); return TABS.some((t) => t[0] === h) ? h : 'hoy'; };

  function filaHabito(h) {
    const d = hoy(), v = valor(h, d), k = iso(d), riesgo = enRiesgo(h);
    let ctrl;
    if (h.tipo === 'cantidad') { const n = h.dias[k] || 0; ctrl = `<div class="contador"><button class="boton-icono" data-cant="${h.id}|-1" aria-label="Uno menos">${ico('menos')}</button><b>${n}<small>/${h.meta}</small></b><button class="boton-icono ${v === 1 ? 'si' : ''}" data-cant="${h.id}|1" aria-label="Uno más">${ico('mas')}</button></div>`; }
    else if (h.tipo === 'sueno') { const hs = suenoDe(k); ctrl = `<button class="boton boton-chico ${hs != null ? '' : 'boton-fuerte'}" data-a="sueno">${hs != null ? nf1.format(hs) + ' h' : 'Anotar'}</button>`; }
    else ctrl = `${h.minima ? `<button class="mini-btn ${v === 0.5 ? 'si' : ''}" data-min="${h.id}" aria-label="Versión mínima">2'</button>` : ''}<button class="check ${v === 1 ? 'si' : v === 0.5 ? 'medio' : ''}" data-hab="${h.id}" aria-label="Marcar ${esc(h.nombre)}">${ico('check')}</button>`;
    const sem = semanal(h) ? chip(`${cuentaSemana(h, d)}/${h.veces} semana`, cuentaSemana(h, d) >= h.veces ? 'chip-bien' : '') : '';
    return `<li class="hab ${v === 1 ? 'hecho' : ''}" style="--c:${colorVar(h.color)}">
      <span class="hab-ico">${ico(h.icono)}</span>
      <div class="hab-cuerpo item-click" data-ed="${h.id}"><b>${esc(h.nombre)} ${sem}${riesgo ? chip(riesgo, 'chip-aviso') : ''}</b>
        <span><i>${esc(h.ancla)}</i>, ${esc(h.accion)}.</span>${v !== 1 && h.minima ? `<span class="minima">Día difícil: ${esc(h.minima)}</span>` : ''}${h.nota ? `<span class="minima">${esc(h.nota)}</span>` : ''}</div>
      <div class="hab-ctrl">${ctrl}</div></li>`;
  }

  function pintarHoy() {
    const d = hoy(), hr = new Date().getHours();
    const vis = S.habitos.filter(visibleHoy);
    const hechos = vis.filter((h) => valor(h, d) > 0).length;
    const riesgos = vis.filter((h) => enRiesgo(h));
    const prox = facuPend().find((f) => f.fecha >= iso(d));
    const saludo = hr < 6 ? 'Buenas noches' : hr < 13 ? 'Buen día' : hr < 20 ? 'Buenas tardes' : 'Buenas noches';
    const ident = S.identidades.length ? S.identidades[d.getDate() % S.identidades.length] : null;
    const lineas = [];
    if (riesgos.length) lineas.push(`${ico('aviso')}<span><b>No faltes dos veces:</b> ${riesgos.map((h) => esc(h.nombre)).join(', ')}. Aunque sea la versión mínima.</span>`);
    if (prox) { const n = diasEntre(d, desdeIso(prox.fecha)); lineas.push(`${ico('birrete')}<span><b>${esc(nombreFacu(prox))}</b> ${n === 0 ? '<b>es hoy</b>' : `en <b>${n} ${n === 1 ? 'día' : 'días'}</b>`}.</span>`); }
    if (hr >= 0 && hr < 4) lineas.push(`${ico('celu')}<span>Ya es tarde. Celu a cargar fuera de la pieza y libro: <b>2 minutos y a dormir</b>.</span>`);
    const M = S.malos, k = iso(d);
    const celuHoy = M.celu.registro[k];
    const pucho = M.fumar.registro[k] || 0;
    const post = M.postergar.lista.filter((p) => !p.hecho);

    return `
    <section class="tarjeta hero">
      <p class="hero-fecha">${fechaLarga(d)}</p>
      <h1>${saludo},<br><em>${esc(S.persona.nombre || 'vos')}</em></h1>
      ${ident ? `<p class="identidad" style="--c:${colorVar(ident.color)}">${esc(ident.texto)}.</p>` : ''}
      <div class="progreso"><div class="barra"><span style="--p:${vis.length ? hechos / vis.length : 0}"></span></div><b>${hechos} de ${vis.length}</b></div>
      ${lineas.length ? `<ul class="resumen">${lineas.map((l) => `<li>${l}</li>`).join('')}</ul>` : ''}
    </section>
    ${tarjetaEstudio()}
    ${MOMENTOS.map(([id, nombre, ic]) => { const hs = S.habitos.filter((h) => h.momento === id && visibleHoy(h)); return hs.length ? `<section class="tarjeta">${cabeza(ic, nombre)}<ul class="habs">${hs.map(filaHabito).join('')}</ul></section>` : ''; }).join('')}
    ${S.habitos.some((h) => h.tipo === 'segun' && !visibleHoy(h)) ? `<p class="mini centro">La proteína aparece cuando marcás el gym.</p>` : ''}
    <section class="tarjeta">${cabeza('objetivos', 'Lo que quiero dejar')}
      <div class="malo"><div class="malo-cab">${ico('celu')}<b>Celu de noche</b></div><p class="sub">${esc(M.celu.pregunta)}</p>
        <div class="fila-botones"><button class="boton boton-chico ${celuHoy === 1 ? 'boton-bien' : ''}" data-celu="1">Sí 💪</button><button class="boton boton-chico ${celuHoy === 0 ? 'boton-mal' : ''}" data-celu="0">No</button></div></div>
      ${M.fumar.oculto ? '' : `<div class="malo"><div class="malo-cab">${ico('humo')}<b>Cigarrillos hoy</b></div>
        <div class="contador grande"><button class="boton-icono" data-pucho="-1" aria-label="Uno menos">${ico('menos')}</button><b>${pucho}</b><button class="boton-icono" data-pucho="1" aria-label="Uno más">${ico('mas')}</button>
        <button class="boton boton-chico" data-a="ganas">Me dieron ganas</button></div><p class="mini">${resumenPucho()}</p></div>`}
      <div class="malo"><div class="malo-cab">${ico('reloj')}<b>Lo que vengo postergando</b><button class="boton boton-chico" data-a="postergo" style="margin-left:auto">${ico('mas')}Agregar</button></div>
        ${post.length ? `<ul class="lista">${post.map((p) => { const n = diasEntre(desdeIso(p.desde), d); return `<li class="item"><div class="item-cuerpo item-click" data-post-ed="${p.id}"><b>${esc(p.t)}</b><span>${n === 0 ? 'Desde hoy' : `Hace ${n} ${n === 1 ? 'día' : 'días'}`}${n >= 3 ? ' · <b style="color:var(--ambar)">prioridad de mañana</b>' : ''}</span></div>
          <button class="boton boton-chico boton-fuerte" data-dos="${p.id}">2 min</button><button class="check" data-post="${p.id}" aria-label="Hecho">${ico('check')}</button></li>`; }).join('')}</ul>` : '<p class="mini">Nada pendiente. Si algo te da vueltas, anotalo y arrancalo 2 minutos.</p>'}
      </div>
    </section>
    <section class="tarjeta">${cabeza('libro', 'Nota rápida')}<textarea class="nota" id="nota" placeholder="Algo que no te querés olvidar…">${esc(S.nota)}</textarea></section>`;
  }
  function resumenPucho() {
    const R = S.malos.fumar.registro, d = hoy();
    const suma = (a, b) => { let n = 0, c = 0; for (let i = a; i < b; i++) { const k = iso(masDias(d, -i)); if (R[k] != null) { n += R[k]; c++; } } return c ? n / c : null; };
    const esta = suma(1, 8), antes = suma(8, 15);
    if (esta == null) return 'Anotá cada uno. Primero se mide, después se baja.';
    let t = `Promedio de la última semana: ${nf1.format(esta)} por día.`;
    if (antes != null) t += esta < antes ? ` Bajaste de ${nf1.format(antes)} 👏` : esta > antes ? ` La semana anterior: ${nf1.format(antes)}.` : '';
    return t;
  }

  function pintarHabitos() {
    const d = hoy(), l = lunesDe(d);
    const celdas = (h) => { let out = ''; const ini = masDias(l, -21); for (let i = 0; i < 28; i++) { const x = masDias(ini, i); const fut = x > d; const no = !fut && h.desde && iso(x) < h.desde; const v = fut || no || !aplica(h, x) ? null : valor(h, x); out += `<span class="cel ${fut || no ? 'fut' : ''} ${v === 1 ? 'si' : v === 0.5 ? 'medio' : ''} ${iso(x) === iso(d) ? 'hoy' : ''}" title="${fechaCorta(x)}"></span>`; } return out; };
    const M = S.malos;
    const celuSemana = (() => { let si = 0, c = 0; for (let i = 0; i < 7; i++) { const v = M.celu.registro[iso(masDias(d, -i))]; if (v != null) { c++; si += v; } } return c ? `${si} de ${c} noches lo soltaste a tiempo esta semana` : 'Todavía sin registros'; })();
    return `
    <section class="tarjeta">${cabeza('objetivos', 'Quién quiero ser', `<button class="boton boton-chico" data-a="nueva-ident">${ico('mas')}</button>`)}
      <p class="mini" style="margin-bottom:8px">Cada vez que marcás un hábito, es un voto a favor de esta persona. No hace falta ganar todos los días, solo sumar más votos que en contra.</p>
      ${S.identidades.map((i) => `<div class="ident item-click" data-ident="${i.id}" style="--c:${colorVar(i.color)}"><b>${esc(i.texto)}</b><span>${votosSemana(i.id)} ${votosSemana(i.id) === 1 ? 'voto' : 'votos'} esta semana</span></div>`).join('') || '<div class="vacio">Agregá quién querés ser.</div>'}
    </section>
    <section class="tarjeta">${cabeza('habitos', 'Mis hábitos', `<button class="boton boton-chico boton-fuerte" data-a="nuevo-hab">${ico('mas')}Hábito</button>`)}
      <p class="mini" style="margin-bottom:6px">Últimas 4 semanas. Lleno = hecho, a medias = versión mínima. Tocá un hábito para cambiarlo.</p>
      <div class="cal-cab">${[1, 2, 3, 4, 5, 6, 0].map((x) => `<span>${DIAS_C[x]}</span>`).join('')}</div>
      ${S.habitos.map((h) => `<div class="hab-hist item-click" data-ed="${h.id}" style="--c:${colorVar(h.color)}">
        <div class="hab-hist-cab"><span class="hab-ico">${ico(h.icono)}</span><b>${esc(h.nombre)}</b><span class="mini">${racha(h) ? '🔥 ' + racha(h) : semanal(h) ? h.veces + ' por semana' : ''}</span></div>
        <div class="cal">${celdas(h)}</div></div>`).join('')}
    </section>
    <section class="tarjeta">${cabeza('objetivos', 'Lo que quiero dejar')}
      <div class="malo"><div class="malo-cab">${ico('celu')}<b>Celu de noche</b></div><p class="mini">${celuSemana}</p>${planHtml('celu')}</div>
      <div class="malo"><div class="malo-cab">${ico('humo')}<b>Fumar</b>${M.fumar.oculto ? `<button class="boton boton-chico" data-a="mostrar-pucho" style="margin-left:auto">Llevar la cuenta</button>` : ''}</div>${M.fumar.oculto ? '' : graficoPucho()}${planHtml('fumar')}</div>
      <div class="malo"><div class="malo-cab">${ico('reloj')}<b>Postergar</b></div><p class="mini">${M.postergar.lista.filter((p) => p.hecho).length} cosas destrabadas en total</p>${planHtml('postergar')}</div>
    </section>
    <section class="tarjeta">${cabeza('libro', 'Las 4 leyes, en corto')}
      <ul class="leyes"><li><b>Que sea obvio.</b> Atalo a algo que ya hacés: "Después de X, hago Y".</li><li><b>Que sea atractivo.</b> Juntalo con algo que te gusta (música en el gym, mate mientras estudiás).</li>
      <li><b>Que sea fácil.</b> Si cuesta, achicalo: la versión de 2 minutos.</li><li><b>Que sea satisfactorio.</b> Marcarlo acá. Y nunca fallar dos veces seguidas.</li></ul>
      <p class="mini" style="margin-top:8px">Para los malos hábitos, al revés: invisible, poco atractivo, difícil, insatisfactorio.</p></section>`;
  }
  const planHtml = (k) => `<div class="plan">${(S.malos[k].plan || []).map((p) => `<span>• ${esc(p)}</span>`).join('')}<button class="enlace" data-plan="${k}">Editar mi plan</button></div>`;
  function graficoPucho() {
    const R = S.malos.fumar.registro, d = hoy(), dias = [];
    for (let i = 13; i >= 0; i--) { const x = masDias(d, -i); dias.push({ x, v: R[iso(x)] }); }
    const max = Math.max(5, ...dias.map((x) => x.v || 0));
    return `<div class="barras-p">${dias.map((x) => `<div><span style="height:${x.v == null ? 0 : Math.max(4, (x.v / max) * 100)}%" class="${x.v === 0 ? 'cero' : ''}"></span><small>${x.x.getDate()}</small></div>`).join('')}</div><p class="mini">${resumenPucho()}</p>`;
  }

  function pintarFacu() {
    const d = hoy(), pend = facuPend(), sin = S.facu.filter((f) => !f.hecho && !f.fecha), hechas = S.facu.filter((f) => f.hecho);
    const est = habito('h-estudio') || S.habitos.find((h) => h.ident === 'i-estudio');
    const fila = (f) => { const n = f.fecha ? diasEntre(d, desdeIso(f.fecha)) : null; return `<li class="item item-click ${f.hecho ? 'hecho' : ''}" data-facu="${f.id}">${n !== null && !f.hecho ? cajaDias(n) : `<div class="dias-box"><strong>${f.hecho ? '✓' : '?'}</strong><small>${f.hecho ? 'listo' : 'fecha'}</small></div>`}
      <div class="item-cuerpo"><b>${esc(f.materia)}</b><span>${esc(f.titulo || cap(f.tipo))}${f.fecha ? ' · ' + fechaLarga(desdeIso(f.fecha)) + (f.hora ? ' · ' + f.hora : '') : ' · fecha a confirmar'}${f.nota ? ' · ' + esc(f.nota) : ''}</span>${f.fecha && !f.hecho ? (() => { const p = plan(f, d); return `<div class="plan-barra"><div class="barra"><span style="--p:${p.listos / p.n};--c:var(--violeta)"></span></div><span class="mini">${p.listos}/${p.n} temas · ${p.empezo ? (p.sig < 0 ? chip('¡todo estudiado!', 'chip-bien') : estadoPlan(p)) : 'empezás el ' + fechaCorta(p.ini)}</span></div>`; })() : ''}</div>
      <button class="check ${f.hecho ? 'si' : ''}" data-facu-hecho="${f.id}" aria-label="Marcar como hecho">${ico('check')}</button></li>`; };
    const sig = pend.find((f) => f.fecha >= iso(d));
    return `
    <section class="tarjeta hero"><p class="hero-fecha">Lic. en Psicología · Cuenca del Plata</p><h1>Facu</h1>
      <ul class="resumen">${sig ? `<li>${ico('birrete')}<span>Lo que viene: <b>${esc(nombreFacu(sig))}</b> ${cuando(diasEntre(d, desdeIso(sig.fecha)))}. El plan de cada fecha arranca solo con tiempo: 3 semanas antes de un final, 1 semana antes de un coloquio.</span></li>` : ''}
      ${est ? `<li>${ico('habitos')}<span>Estudio esta semana: <b>${cuentaSemana(est, d)} de 7 días</b>${racha(est) ? ' · 🔥 ' + racha(est) : ''}.</span></li>` : ''}
      ${sin.length ? `<li>${ico('aviso')}<span><b>${sin.length}</b> ${sin.length === 1 ? 'fecha' : 'fechas'} sin confirmar.</span></li>` : ''}</ul></section>
    <section class="tarjeta">${cabeza('reloj', 'Próximas fechas', `<button class="boton boton-fuerte boton-chico" data-a="nueva-facu">${ico('mas')}Fecha</button>`)}<ul class="lista">${pend.map(fila).join('') || '<div class="vacio">Sin fechas pendientes.</div>'}</ul></section>
    ${sin.length ? `<section class="tarjeta">${cabeza('aviso', 'Fecha a confirmar')}<ul class="lista">${sin.map(fila).join('')}</ul></section>` : ''}
    ${hechas.length ? `<section class="tarjeta">${cabeza('check', 'Hechas', chip(hechas.length + ''))}<ul class="lista">${hechas.map(fila).join('')}</ul></section>` : ''}`;
  }

  function pintarYo() {
    const d = hoy(), Sa = S.salud;
    const ps = Sa.peso.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)), ult = ps[ps.length - 1];
    const sue = []; for (let i = 13; i >= 0; i--) { const x = masDias(d, -i); sue.push({ x, v: suenoDe(iso(x)) }); }
    const con = sue.filter((s) => s.v != null).slice(-7), prom = con.length ? con.reduce((s, x) => s + x.v, 0) / con.length : null;
    const W = 320, H = 120, bw = W / 14, y = (v) => H - 16 - (v / 10) * (H - 24);
    const graS = `<svg class="graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><rect x="0" y="${y(Sa.suenoMeta)}" width="${W}" height="${y(Sa.suenoMin) - y(Sa.suenoMeta)}" fill="var(--verde)" opacity=".12"/>
      ${sue.map((s, i) => s.v == null ? '' : `<rect x="${i * bw + 3}" y="${y(s.v)}" width="${bw - 6}" height="${H - 16 - y(s.v)}" rx="3" fill="${s.v >= Sa.suenoMin ? 'var(--azul)' : 'var(--coral)'}"/>`).join('')}
      ${sue.map((s, i) => i % 2 ? '' : `<text x="${i * bw + bw / 2}" y="${H - 3}" text-anchor="middle">${s.x.getDate()}</text>`).join('')}</svg>`;
    let graP = '';
    if (ps.length >= 2) {
      const lo = Math.min(...ps.map((p) => p.kg)) - 1, hi = Math.max(...ps.map((p) => p.kg), Sa.pesoMeta || 0) + 1;
      const px = (i) => 10 + (i / (ps.length - 1)) * (W - 20), py = (v) => H - 18 - ((v - lo) / (hi - lo)) * (H - 30);
      graP = `<svg class="graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${Sa.pesoMeta ? `<line x1="0" x2="${W}" y1="${py(Sa.pesoMeta)}" y2="${py(Sa.pesoMeta)}" stroke="var(--verde)" stroke-dasharray="4 4"/>` : ''}
        <polyline fill="none" stroke="var(--coral)" stroke-width="2.5" points="${ps.map((p, i) => `${px(i)},${py(p.kg)}`).join(' ')}" vector-effect="non-scaling-stroke"/>${ps.map((p, i) => `<circle cx="${px(i)}" cy="${py(p.kg)}" r="3" fill="var(--coral)"/>`).join('')}</svg>`;
    }
    return `
    <section class="tarjeta">${cabeza('luna', 'Sueño · 14 días', `<button class="boton boton-chico" data-a="sueno">${ico('mas')}Anotar</button>`)}
      <div class="salud-cima"><div><strong>${prom ? nf1.format(prom) + ' h' : '—'}</strong><p class="mini">Promedio de la semana</p></div><div style="text-align:right"><p class="mini">Meta</p><b>${nf1.format(Sa.suenoMin)}–${nf1.format(Sa.suenoMeta)} h</b></div></div>
      ${con.length ? graS : '<p class="mini">Cada mañana, anotá lo que marcó tu Galaxy Watch.</p>'}</section>
    <section class="tarjeta">${cabeza('pesa', 'Peso', `<button class="boton boton-chico" data-a="peso">${ico('mas')}Me pesé</button>`)}
      <div class="salud-cima"><div><strong>${ult ? nf1.format(ult.kg) + ' kg' : '—'}</strong><p class="mini">${ult ? 'Última vez ' + cuando(diasEntre(d, desdeIso(ult.fecha))) : ''}</p></div>
      <div style="text-align:right"><p class="mini">Meta</p><b>${Sa.pesoMeta ? nf1.format(Sa.pesoMeta) + (Sa.pesoMetaMax ? '–' + nf1.format(Sa.pesoMetaMax) : '') + ' kg' : '—'}</b>${ult && Sa.pesoMeta ? `<p class="mini">Faltan ${nf1.format(Math.max(0, Sa.pesoMeta - ult.kg))} kg</p>` : ''}</div></div>
      ${graP || '<p class="mini">Pesate una vez por semana, mismo día y en ayunas.</p>'}</section>
    <section class="tarjeta">${cabeza('ajustes', 'Copia de seguridad')}
      <p class="sub" style="margin-bottom:10px">Tus datos viven solo en este celu. Hacé una copia cada tanto y guardala en Drive o mandátela por WhatsApp.</p>
      <div class="fila-botones"><button class="boton boton-fuerte" data-a="exportar">Guardar copia</button><button class="boton" data-a="importar">Cargar copia</button><button class="boton" data-a="nombre">Mi nombre</button><button class="boton boton-peligro" data-a="borrar-todo">Borrar todo</button></div>
      <input type="file" id="archivo" accept=".json,application/json" hidden></section>`;
  }

  function pintarBienvenida() {
    $('#tabs').hidden = true;
    $('#vista').innerHTML = `<section class="tarjeta bienvenida"><span class="marca-logo" style="width:46px;height:46px;gap:5px" aria-hidden="true"><i></i><i></i><i></i></span>
      <h1>Tus <em>hábitos</em></h1><p class="sub">Para arrancar, cargá el archivo con tus datos (<b>mis-datos-habitos.json</b>). Se guardan solo en este celu.</p>
      <button class="boton boton-fuerte" data-a="importar" style="height:46px;padding:0 22px">Cargar mis datos</button><button class="boton" data-a="vacio">Empezar de cero</button>
      <input type="file" id="archivo" accept=".json,application/json" hidden></section>`;
  }

  function pintar() {
    if (!S) return pintarBienvenida();
    $('#tabs').hidden = false;
    const sec = seccion();
    $('#tabs').innerHTML = TABS.map(([id, t, ic]) => `<a href="#${id}" class="${id === sec ? 'activo' : ''}">${ico(ic)}<span>${t}</span></a>`).join('');
    $('#vista').innerHTML = { hoy: pintarHoy, habitos: pintarHabitos, facu: pintarFacu, yo: pintarYo }[sec]();
    const n = $('#nota'); if (n) n.addEventListener('input', () => { S.nota = n.value; guardar(); });
  }

  // ── Editores ─────────────────────────────────────────────────────────
  function editarHabito(h) {
    const nuevo = !h;
    h = h || { nombre: '', ident: (S.identidades[0] || {}).id, momento: 'manana', ancla: '', accion: '', minima: '', icono: 'check', color: 'verde', dias: {}, desde: iso(hoy()) };
    formulario({
      titulo: nuevo ? 'Nuevo hábito' : h.nombre,
      texto: 'La fórmula: <b>"Después de [algo que ya hacés], [el hábito]"</b>.',
      campos: [
        { n: 'nombre', et: 'Nombre corto', v: h.nombre, req: true, ph: 'Estirar' },
        { n: 'ancla', et: 'Después de… (algo que pasa siempre)', v: h.ancla, req: true, ph: 'Después de cepillarme los dientes' },
        { n: 'accion', et: 'Hago…', v: h.accion, req: true, ph: 'estiro 5 minutos' },
        { n: 'minima', et: 'Versión de 2 minutos (día difícil)', v: h.minima, ph: 'estiro 1 minuto' },
        { tipo: 'dos', campos: [{ n: 'momento', et: 'Momento', tipo: 'select', v: h.momento, ops: MOMENTOS.map(([a, b]) => [a, b]) }, { n: 'ident', et: 'Vota por', tipo: 'select', v: h.ident, ops: [...S.identidades.map((i) => [i.id, i.texto.replace(/^Soy alguien que /, '')]), ['', '—']] }] },
        ...(h.tipo === 'sueno' || h.tipo === 'cantidad' || h.tipo === 'segun' ? [] : [{ n: 'veces', et: 'Veces por semana (7 = todos los días)', tipo: 'num', v: semanal(h) ? h.veces : 7 }]),
        ...(h.tipo === 'cantidad' ? [{ n: 'meta', et: `Meta por día (${h.unidad || 'veces'})`, tipo: 'num', v: h.meta }] : []),
        { tipo: 'dos', campos: [{ n: 'color', et: 'Color', tipo: 'select', v: h.color, ops: [['verde', 'Verde'], ['azul', 'Azul'], ['violeta', 'Violeta'], ['ambar', 'Ámbar'], ['coral', 'Coral'], ['rosa', 'Rosa'], ['cian', 'Celeste']] },
          { n: 'icono', et: 'Ícono', tipo: 'select', v: h.icono, ops: [['check', 'Tilde'], ['pesa', 'Pesa'], ['gota', 'Gota'], ['libro', 'Libro'], ['birrete', 'Facu'], ['luna', 'Luna'], ['sol', 'Sol'], ['taza', 'Taza'], ['corazon', 'Corazón']] }] },
        { n: 'nota', et: 'Nota (opcional)', v: h.nota || '' },
      ],
      alGuardar: (v) => {
        Object.assign(h, { nombre: v.nombre, ancla: v.ancla, accion: v.accion, minima: v.minima, momento: v.momento, ident: v.ident, color: v.color, icono: v.icono, nota: v.nota });
        if (v.veces !== undefined) { const n = Math.min(7, Math.max(1, Math.round(v.veces) || 7)); if (n < 7) { h.frec = 'semana'; h.veces = n; } else { delete h.frec; delete h.veces; } }
        if (v.meta > 0) h.meta = Math.round(v.meta);
        if (nuevo) { h.id = uid(); S.habitos.push(h); avisar('Hábito creado. Empezá chiquito'); }
      },
      borrar: nuevo ? null : () => { S.habitos = S.habitos.filter((x) => x !== h); },
    });
  }
  function editarIdent(i) {
    const nuevo = !i; i = i || { texto: 'Soy alguien que ', color: 'verde' };
    formulario({ titulo: nuevo ? 'Quién quiero ser' : 'Identidad', texto: 'Escribilo como si ya lo fueras.', campos: [{ n: 'texto', et: 'Frase', v: i.texto, req: true }, { n: 'color', et: 'Color', tipo: 'select', v: i.color, ops: [['verde', 'Verde'], ['azul', 'Azul'], ['violeta', 'Violeta'], ['ambar', 'Ámbar'], ['coral', 'Coral'], ['rosa', 'Rosa']] }],
      alGuardar: (v) => { Object.assign(i, v); if (nuevo) { i.id = uid(); S.identidades.push(i); } }, borrar: nuevo ? null : () => { S.identidades = S.identidades.filter((x) => x !== i); } });
  }
  function editarSueno() {
    formulario({ titulo: '¿Cuánto dormiste?', texto: 'Lo que marcó tu Galaxy Watch.', campos: [{ n: 'fecha', et: 'Noche que terminó el', tipo: 'date', v: iso(hoy()) }, { n: 'horas', et: 'Horas', tipo: 'num', ph: '6,5', req: true }],
      alGuardar: (v) => { if (!(v.horas > 0 && v.horas < 16)) { avisar('Poné las horas, por ejemplo 6,5'); return false; } S.salud.sueno = S.salud.sueno.filter((s) => s.fecha !== v.fecha); S.salud.sueno.push({ fecha: v.fecha, horas: v.horas }); S.salud.sueno = S.salud.sueno.slice(-180); avisar(v.horas >= S.salud.suenoMin ? 'Anotado. Bien ahí' : 'Anotado. Hoy, celu afuera y a dormir más temprano'); } });
  }
  function editarFacu(f) {
    const nuevo = !f; f = f || { materia: '', tipo: 'coloquio', titulo: '', fecha: '', hora: '', nota: '', hecho: false };
    const mats = [...new Set(S.facu.map((x) => x.materia))];
    formulario({ titulo: nuevo ? 'Nueva fecha de la facu' : f.materia, campos: [
      { n: 'materia', et: 'Materia', v: f.materia, req: true, ayuda: mats.length ? 'Tus materias: ' + mats.join(' · ') : '' },
      { n: 'tipo', et: 'Tipo', tipo: 'select', v: f.tipo, ops: [['entrega', 'Entrega (AE, TP, foro)'], ['coloquio', 'Coloquio'], ['parcial', 'Parcial'], ['final', 'Final'], ['otro', 'Otro']] },
      { n: 'titulo', et: 'Nombre corto', v: f.titulo, ph: 'AE4, Coloquio, Final…' },
      { tipo: 'dos', campos: [{ n: 'fecha', et: 'Día', tipo: 'date', v: f.fecha || '' }, { n: 'hora', et: 'Hora (opcional)', tipo: 'time', v: f.hora || '' }] },
      { n: 'temas', et: 'Plan: temas a estudiar (uno por renglón)', tipo: 'textarea', v: temasDe(f).join('\n'), ayuda: 'Ejes, unidades o autores. El último puede ser el repaso.' },
      { n: 'inicio', et: 'Empiezo a estudiar el', tipo: 'date', v: f.inicio || (f.fecha ? iso(inicioDe(f)) : ''), ayuda: 'Por defecto: 3 semanas antes de un final, 1 de un coloquio o parcial, 4 días de una entrega.' },
      { n: 'nota', et: 'Nota', v: f.nota || '' }, { n: 'hecho', et: 'Ya está hecho / aprobado', tipo: 'check', v: f.hecho }],
      alGuardar: (v) => { const temas = v.temas.split('\n').map((x) => x.trim()).filter(Boolean); delete v.temas; if (temas.join('|') !== temasDe(f).join('|')) { f.temas = temas; f.temasHechos = []; }
        if (!v.inicio || (f.fecha && !f.inicio && v.inicio === iso(inicioDe(f)))) delete v.inicio; Object.assign(f, v, { fecha: v.fecha || null }); if (nuevo) { f.id = uid(); S.facu.push(f); } avisar('Guardado'); },
      borrar: nuevo ? null : () => { S.facu = S.facu.filter((x) => x !== f); } });
  }

  function exportar() {
    const txt = JSON.stringify(S, null, 1), nombre = `habitos-copia-${iso(hoy())}.json`;
    try { const f = new File([txt], nombre, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: 'Copia de mis hábitos' }).catch(() => {}); return; } } catch (e) {}
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); avisar('Copia guardada en Descargas');
  }
  function importar() {
    const inp = $('#archivo'); inp.value = '';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      try { const d = JSON.parse(await f.text()); if (!d || d.version !== 2 || !Array.isArray(d.habitos)) throw 0; S = Object.assign(VACIO(), d); migrarViejo(); S.mig2 = false; migrar2(); location.hash = '#hoy'; pintar(); avisar('¡Listo! Datos cargados'); }
      catch (e) { avisar('Ese archivo no es una copia de esta app'); }
    };
    inp.click();
  }

  // ── Toques ──────────────────────────────────────────────────────────
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('button, [data-ed], [data-ident], [data-facu], [data-post-ed], [data-plan-f]');
    if (!t || t.closest('#modal')) return;
    const d = t.dataset, k = iso(hoy());
    if (d.hab) return marcar(habito(d.hab), 1);
    if (d.min) return marcar(habito(d.min), 0.5);
    if (d.cant) { const [id, s] = d.cant.split('|'); const h = habito(id); h.dias[k] = Math.max(0, (h.dias[k] || 0) + Number(s)); if (!h.dias[k]) delete h.dias[k]; guardar(); if (h.dias[k] === h.meta) avisar('¡Meta del día! +1 voto'); return pintar(); }
    if (d.ed && t.tagName !== 'BUTTON') return editarHabito(habito(d.ed));
    if (d.ident) return editarIdent(S.identidades.find((i) => i.id === d.ident));
    if (d.celu) { const v = Number(d.celu); const R = S.malos.celu.registro; if (R[k] === v) delete R[k]; else R[k] = v; guardar(); if (v === 1 && R[k] === 1) avisar('¡Eso! Un voto por dormir mejor'); return pintar(); }
    if (d.pucho) { const R = S.malos.fumar.registro; R[k] = Math.max(0, (R[k] || 0) + Number(d.pucho)); guardar(); return pintar(); }
    if (d.dos) { const p = S.malos.postergar.lista.find((x) => x.id === d.dos); return temporizador(p.t, 2, 'Solo 2 minutos. No hace falta terminarlo: arrancalo. Si después querés seguir, seguí.'); }
    if (d.post) { const p = S.malos.postergar.lista.find((x) => x.id === d.post); p.hecho = true; p.cuando = k; guardar(); avisar('¡Destrabado!'); return pintar(); }
    if (d.postEd) { const p = S.malos.postergar.lista.find((x) => x.id === d.postEd); return formulario({ titulo: 'Lo que postergo', campos: [{ n: 't', et: 'Qué', v: p.t, req: true }], alGuardar: (v) => { p.t = v.t; }, borrar: () => { S.malos.postergar.lista = S.malos.postergar.lista.filter((x) => x !== p); } }); }
    if (d.plan) { const m = S.malos[d.plan]; return formulario({ titulo: 'Mi plan', texto: 'Un renglón por idea. Que sea difícil, invisible o poco atractivo.', campos: [{ n: 'p', et: 'Ideas', tipo: 'textarea', v: (m.plan || []).join('\n') }], alGuardar: (v) => { m.plan = v.p.split('\n').map((x) => x.trim()).filter(Boolean); } }); }
    if (d.tema) { const [id, i] = d.tema.split('|'); const f = S.facu.find((x) => x.id === id); f.temasHechos = [...new Set([...(f.temasHechos || []), Number(i)])]; guardar(); const p = plan(f); avisar(p.sig < 0 ? '¡Todo estudiado! Ahora, repasar tranqui' : `Tema listo · ${p.listos}/${p.n}`); return pintar(); }
    if (d.planF) return editarFacu(S.facu.find((x) => x.id === d.planF));
    if (d.facuHecho) { ev.stopPropagation(); const f = S.facu.find((x) => x.id === d.facuHecho); f.hecho = !f.hecho; guardar(); if (f.hecho) avisar('¡Vamos! Una menos'); return pintar(); }
    if (d.facu && t.tagName !== 'BUTTON') return editarFacu(S.facu.find((f) => f.id === d.facu));
    switch (d.a) {
      case 'sueno': return editarSueno();
      case 'ganas': return temporizador('Esperá 5 minutos', 5, 'Las ganas suben y bajan como una ola. Tomá un vaso de agua y esperá a que pase. Si después igual querés, decidís vos.');
      case 'postergo': return formulario({ titulo: '¿Qué venís postergando?', campos: [{ n: 't', et: 'Qué', req: true, ph: 'Actualizar el CV' }], alGuardar: (v) => { S.malos.postergar.lista.push({ id: uid(), t: v.t, desde: k, hecho: false }); } });
      case 'mostrar-pucho': S.malos.fumar.oculto = false; guardar(); return pintar();
      case 'nuevo-hab': return editarHabito(null);
      case 'nueva-ident': return editarIdent(null);
      case 'nueva-facu': return editarFacu(null);
      case 'peso': return formulario({ titulo: 'Me pesé', campos: [{ n: 'fecha', et: 'Día', tipo: 'date', v: k }, { n: 'kg', et: 'Kilos', tipo: 'num', ph: '69,4', req: true }], alGuardar: (v) => { if (!(v.kg > 20)) { avisar('Poné los kilos, por ejemplo 69,4'); return false; } S.salud.peso = S.salud.peso.filter((p) => p.fecha !== v.fecha); S.salud.peso.push({ fecha: v.fecha, kg: v.kg }); } });
      case 'nombre': return formulario({ titulo: 'Tu nombre', campos: [{ n: 'n', et: 'Nombre', v: S.persona.nombre }], alGuardar: (v) => { S.persona.nombre = v.n; } });
      case 'exportar': return exportar();
      case 'importar': return importar();
      case 'vacio': S = VACIO(); migrarViejo(); guardar(); return pintar();
      case 'borrar-todo': return formulario({ titulo: '¿Borrar todo?', texto: 'Se borran todos tus datos de este celu. Hacé antes una copia.', ok: 'Sí, borrar todo', alGuardar: () => { S = null; try { localStorage.removeItem(CLAVE); } catch (e) {} } });
    }
    if (t.id === 'boton-tema') { const r = document.documentElement; const n = r.dataset.theme === 'light' ? 'dark' : 'light'; r.dataset.theme = n; try { localStorage.setItem('pdv:tema', n); } catch (e) {} pintarTema(); }
  });

  function pintarTema() { $('#boton-tema').innerHTML = ico(document.documentElement.dataset.theme === 'light' ? 'luna' : 'sol'); }

  function migrar2() {
    if (!S || S.mig2) return;
    const h = S.habitos.find((x) => x.id === 'h-minox');
    if (h && h.momento === 'manana') { h.momento = 'noche'; h.ancla = 'Después de bañarme (tipo 21)'; }
    if (!S.planDesde) S.planDesde = iso(hoy());
    S.mig2 = true; guardar();
  }
  // ── Arranque ─────────────────────────────────────────────────────────
  if (!S && window.DATOS_INICIALES) { S = Object.assign(VACIO(), JSON.parse(JSON.stringify(window.DATOS_INICIALES))); migrarViejo(); guardar(); }
  migrar2(); pintarTema(); pintar();
  window.addEventListener('hashchange', () => { window.scrollTo(0, 0); pintar(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('#modal').open) pintar(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:' && location.hostname.endsWith('github.io')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
