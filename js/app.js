// Panel de vida · Lautaro. Todo se guarda en el celu (localStorage). Nada sale a internet salvo la ciudad, para el clima.
(function () {
  'use strict';
  const CLAVE = 'pdv:estado';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ── Guardado ─────────────────────────────────────────────────────────
  let S = null;
  try { const t = localStorage.getItem(CLAVE); if (t) S = JSON.parse(t); } catch (e) {}
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(S)); } catch (e) { avisar('No se pudo guardar en este navegador'); } };
  const VACIO = () => ({
    version: 1, persona: { nombre: '', ciudad: 'San Salvador de Jujuy', lat: -24.1858, lon: -65.2995, foco: '' },
    calendarios: [{ id: 'personal', nombre: 'Personal', color: 'ambar' }], rutina: [], eventos: [], facu: [],
    sueldo: { concepto: 'Sueldo', monto: 0 }, ingresos: [], gastos: [], categorias: [{ id: 'otros', nombre: 'Otros', color: 'gris' }],
    pagos: [], tarjetas: [], cuotas: [], pagados: {}, montosMes: {}, dolar: null, ahorro: [], vence: [],
    habitos: [], salud: { peso: [], pesoInicio: null, pesoMeta: null, sueno: [], suenoMin: 6.5, suenoMeta: 7.5 }, objetivos: [], gente: [], nota: '',
  });

  // ── Fechas y formatos (Argentina) ────────────────────────────────────
  const nf0 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pesos = (n) => '$' + nf0.format(Math.round(n || 0));
  const plata = (n, mon) => mon === 'USD' ? 'US$ ' + nf2.format(n).replace(/,00$/, '') : pesos(n);
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DIAS_C = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const AHORA = () => new Date();
  const hoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const desdeIso = (s) => { const [a, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(a, m - 1, d); };
  const conHora = (d, hm) => { const x = new Date(d); const [h, m] = hm.split(':').map(Number); x.setHours(h, m, 0, 0); return x; };
  const masDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const diasEntre = (a, b) => Math.round((desdeIso(iso(b)) - desdeIso(iso(a))) / 864e5);
  const mesDe = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const mesMas = (m, n) => { const [a, mm] = m.split('-').map(Number); return mesDe(new Date(a, mm - 1 + n, 1)); };
  const difMeses = (a, b) => { const [a1, m1] = a.split('-').map(Number); const [a2, m2] = b.split('-').map(Number); return (a2 - a1) * 12 + (m2 - m1); };
  const nombreMes = (m) => { const [a, mm] = m.split('-').map(Number); return cap(MESES[mm - 1]) + ' ' + a; };
  const fechaCorta = (d) => d.getDate() + ' ' + MC[d.getMonth()];
  const fechaLarga = (d) => cap(DIAS[d.getDay()]) + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()];
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const hm = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const duracion = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h && m ? `${h} h ${m} min` : h ? `${h} h` : `${m} min`; };
  const cuando = (n) => n === 0 ? 'hoy' : n === 1 ? 'mañana' : n === -1 ? 'ayer' : n > 1 && n < 7 ? 'el ' + DIAS[masDias(hoy(), n).getDay()] : n > 0 ? 'en ' + n + ' días' : 'hace ' + -n + ' días';
  const lunesDe = (d) => masDias(d, -((d.getDay() + 6) % 7));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const colorVar = (c) => (c && c.startsWith('#') ? c : `var(--${c || 'acento'})`);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const numero = (v) => { if (typeof v === 'number') return v; const s = String(v || '').trim().replace(/\$|\s/g, ''); if (!s) return NaN; const t = /,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.'); return parseFloat(t); };

  // ── Íconos ───────────────────────────────────────────────────────────
  const I = {
    hoy: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    calendario: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    birrete: '<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z"/><path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5M22 9.5V15"/>',
    dinero: '<rect x="2.5" y="6" width="19" height="13" rx="3"/><path d="M2.5 10h19M16.5 14.5h2"/>',
    yo: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    aviso: '<path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4M12 17h.01"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    luna: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
    sol: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/>',
    nube: '<path d="M7 18.5h10a4.5 4.5 0 0 0 .4-9A6 6 0 0 0 6 9.8a4.4 4.4 0 0 0 1 8.7Z"/>',
    solnube: '<path d="M8.5 4.2v1.3M3.7 9H2.4M4.8 5.3l.9.9M12.3 6.2l.9-.9"/><path d="M5.6 11.7A3.6 3.6 0 0 1 11.5 8"/><path d="M9 19.5h8.5a3.8 3.8 0 0 0 .3-7.6 5 5 0 0 0-9.6 1.2A3.2 3.2 0 0 0 9 19.5Z"/>',
    lluvia: '<path d="M7 15.5h10a4.5 4.5 0 0 0 .4-9A6 6 0 0 0 6 6.8a4.4 4.4 0 0 0 1 8.7Z"/><path d="m8 18-1 2.5M12.5 18l-1 2.5M17 18l-1 2.5"/>',
    tormenta: '<path d="M7 15.5h10a4.5 4.5 0 0 0 .4-9A6 6 0 0 0 6 6.8a4.4 4.4 0 0 0 1 8.7Z"/><path d="m12.5 15-2 3.5h3l-2 3.5"/>',
    paraguas: '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z"/><path d="M12 12v6.5a2 2 0 0 1-4 0"/>',
    libro: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
    gota: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/>',
    pesa: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    corazon: '<path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.3 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>',
    objetivos: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    gente: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
    ahorro: '<path d="M5 11a7 6 0 0 1 13.5-1.5H20v4h-1.7A7 6 0 0 1 15 17v2.5h-3V18h-2v1.5H7V17A6 6 0 0 1 5 11Z"/><path d="M15 10h.01"/>',
    tarjeta: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 9.5h19M6 15h4"/>',
    nota: '<path d="M15.5 4.5 19.5 8.5 9 19H5v-4L15.5 4.5Z"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    izq: '<path d="m15 6-6 6 6 6"/>', der: '<path d="m9 6 6 6-6 6"/>',
    lapiz: '<path d="M15.5 4.5 19.5 8.5 9 19H5v-4L15.5 4.5Z"/>',
    telefono: '<path d="M5 3.5h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.6 6.6l1.4-2.3 4.5 1.8V19a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2Z"/>',
    subida: '<path d="M7 17 17 7M9 7h8v8"/>',
  };
  const ico = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;
  const cabeza = (icono, titulo, extra = '') => `<header class="t-cabeza"><h2>${ico(icono)}<span>${titulo}</span></h2>${extra}</header>`;
  const chip = (t, c = '') => `<span class="chip ${c}">${t}</span>`;

  // ── Aviso corto ──────────────────────────────────────────────────────
  let tAviso;
  function avisar(t) { const a = $('#aviso'); a.textContent = t; a.classList.add('ver'); clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove('ver'), 2400); }

  // ── Formulario genérico (ventana) ────────────────────────────────────
  // campos: [{n, et, tipo, v, ops:[[valor, texto]], ph, req, ayuda}]
  function formulario({ titulo, campos, ok = 'Guardar', alGuardar, borrar, texto }) {
    const m = $('#modal'), f = $('#modal-form');
    const campo = (c) => {
      const v = c.v ?? '';
      if (c.tipo === 'check') return `<label class="check-label"><input type="checkbox" name="${c.n}" ${v ? 'checked' : ''}>${esc(c.et)}</label>`;
      if (c.tipo === 'dias') return `<div><label>${esc(c.et)}</label><div class="dias-sel">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<label><input type="checkbox" name="${c.n}" value="${d}" ${(v || []).includes(d) ? 'checked' : ''}>${DIAS[d].slice(0, 2)}</label>`).join('')}</div></div>`;
      if (c.tipo === 'select') return `<label>${esc(c.et)}<select name="${c.n}">${c.ops.map(([val, t]) => `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
      if (c.tipo === 'textarea') return `<label>${esc(c.et)}<textarea name="${c.n}" placeholder="${esc(c.ph || '')}">${esc(v)}</textarea></label>`;
      if (c.tipo === 'dos') return `<div class="dos">${c.campos.map(campo).join('')}</div>`;
      const tipo = c.tipo === 'plata' || c.tipo === 'num' ? 'text' : c.tipo || 'text';
      const modo = c.tipo === 'plata' || c.tipo === 'num' ? 'inputmode="decimal"' : '';
      return `<label>${esc(c.et)}<input type="${tipo}" ${modo} name="${c.n}" value="${esc(v)}" placeholder="${esc(c.ph || '')}" ${c.req ? 'required' : ''} autocomplete="off">${c.ayuda ? `<span class="ayuda">${esc(c.ayuda)}</span>` : ''}</label>`;
    };
    f.innerHTML = `<h3>${esc(titulo)}</h3>${texto ? `<p class="sub">${texto}</p>` : ''}${(campos || []).map(campo).join('')}
      <div class="modal-botones">${borrar ? '<button type="button" class="boton boton-peligro" data-a="borrar">Borrar</button>' : ''}
      <button type="button" class="boton" data-a="cerrar">Cancelar</button>${alGuardar ? `<button type="submit" class="boton boton-fuerte">${esc(ok)}</button>` : ''}</div>`;
    f.onsubmit = (ev) => {
      ev.preventDefault();
      const vals = {};
      const todos = [];
      (campos || []).forEach((c) => (c.tipo === 'dos' ? todos.push(...c.campos) : todos.push(c)));
      todos.forEach((c) => {
        if (c.tipo === 'check') vals[c.n] = f.elements[c.n].checked;
        else if (c.tipo === 'dias') vals[c.n] = $$(`input[name="${c.n}"]:checked`, f).map((x) => Number(x.value));
        else if (c.tipo === 'plata' || c.tipo === 'num') vals[c.n] = numero(f.elements[c.n].value);
        else vals[c.n] = f.elements[c.n].value.trim();
      });
      if (alGuardar(vals) === false) return;
      m.close(); guardar(); pintar();
    };
    $('[data-a="cerrar"]', f).onclick = () => m.close();
    if (borrar) $('[data-a="borrar"]', f).onclick = () => {
      const b = $('[data-a="borrar"]', f);
      if (!b.dataset.seguro) { b.dataset.seguro = 1; b.textContent = '¿Seguro? Tocá de nuevo'; return; }
      borrar(); m.close(); guardar(); pintar(); avisar('Borrado');
    };
    m.showModal();
  }
  const opsCal = () => S.calendarios.map((c) => [c.id, c.nombre]);
  const opsCat = () => S.categorias.map((c) => [c.id, c.nombre]);

  // ── Agenda: rutina + eventos + fechas de la facu ─────────────────────
  const calDe = (id) => S.calendarios.find((c) => c.id === id) || { color: 'gris', nombre: '' };
  const facuPendientes = () => S.facu.filter((f) => !f.hecho && f.fecha).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const nombreFacu = (f) => `${f.titulo || cap(f.tipo)} de ${f.materia}`;
  function aQueEstudiar(d) {
    const prox = facuPendientes().filter((f) => f.fecha >= iso(d));
    return prox[0] || null;
  }
  function eventosDe(d) {
    const dia = d.getDay(), k = iso(d);
    const out = [];
    S.rutina.forEach((r) => {
      if (!r.dias.includes(dia)) return;
      if (r.desde && k < r.desde) return;
      if ((r.saltar || []).includes(k)) return;
      let titulo = r.titulo, detalle = r.lugar || '';
      if (r.estudio) { const f = aQueEstudiar(d); if (f) { titulo = 'Estudiar ' + f.materia; detalle = `${f.titulo || cap(f.tipo)} ${cuando(diasEntre(d, desdeIso(f.fecha)))}`.replace(' hoy', ' es hoy'); } }
      out.push({ id: r.id, rutina: true, titulo, detalle, cal: r.cal, ini: conHora(d, r.ini), fin: conHora(d, r.fin) });
    });
    S.eventos.filter((e) => e.fecha === k).forEach((e) => out.push(e.todoElDia || !e.ini
      ? { id: e.id, titulo: e.titulo, detalle: e.lugar || '', cal: e.cal, todo: true }
      : { id: e.id, titulo: e.titulo, detalle: e.lugar || '', cal: e.cal, ini: conHora(d, e.ini), fin: conHora(d, e.fin || e.ini) }));
    S.facu.filter((f) => f.fecha === k).forEach((f) => out.push(f.hora
      ? { id: f.id, facu: true, titulo: nombreFacu(f), cal: 'facultad', ini: conHora(d, f.hora), fin: conHora(d, f.hora), detalle: f.hecho ? 'Hecho' : '' }
      : { id: f.id, facu: true, titulo: nombreFacu(f), cal: 'facultad', todo: true, detalle: f.hecho ? 'Hecho' : '' }));
    return out.sort((a, b) => (a.todo ? -1 : b.todo ? 1 : a.ini - b.ini));
  }
  function filaEvento(e, ahora) {
    const c = colorVar(calDe(e.cal).color);
    if (e.todo) return `<div class="ev todo ev-click" style="--c:${c}" data-ev="${e.id}" data-facu="${e.facu ? 1 : ''}"><div><b>${e.facu ? ico('birrete') + ' ' : ''}${esc(e.titulo)}</b>${e.detalle ? `<span>${esc(e.detalle)}</span>` : ''}</div></div>`;
    const pasado = ahora && e.fin <= ahora, enCurso = ahora && e.ini <= ahora && e.fin > ahora;
    return `<div class="ev ev-click ${pasado ? 'pasado' : ''} ${enCurso ? 'ahora' : ''}" style="--c:${c}" data-ev="${e.id}" data-rutina="${e.rutina ? 1 : ''}" data-facu="${e.facu ? 1 : ''}">
      <time>${hm(e.ini)}${e.fin > e.ini ? `<small>${hm(e.fin)}</small>` : ''}</time>
      <div><b>${esc(e.titulo)}</b>${e.detalle ? `<span>${esc(e.detalle)}</span>` : ''}</div></div>`;
  }
  function listaDia(d, conLibres) {
    const evs = eventosDe(d);
    if (!evs.length) return '<div class="vacio">Día libre</div>';
    const ahora = iso(d) === iso(hoy()) ? AHORA() : d < hoy() ? masDias(d, 2) : null;
    let html = '', ult = conHora(d, '08:00');
    evs.forEach((e) => {
      if (conLibres && !e.todo && e.ini - ult >= 60 * 6e4 && (!ahora || e.ini > ahora)) html += `<div class="libre">Libre ${duracion((e.ini - ult) / 6e4)}</div>`;
      html += filaEvento(e, ahora);
      if (!e.todo && e.fin > ult) ult = e.fin;
    });
    return `<div class="agenda-dia">${html}</div>`;
  }
  function tocarEvento(el) {
    const id = el.dataset.ev;
    if (el.dataset.facu) return editarFacu(S.facu.find((f) => f.id === id));
    if (el.dataset.rutina) return editarRutina(S.rutina.find((r) => r.id === id));
    editarEvento(S.eventos.find((e) => e.id === id));
  }
  function editarEvento(e, fecha) {
    const nuevo = !e;
    e = e || { titulo: '', cal: 'personal', fecha: fecha || iso(hoy()), ini: '', fin: '', lugar: '' };
    formulario({
      titulo: nuevo ? 'Nuevo evento' : 'Editar evento',
      campos: [
        { n: 'titulo', et: 'Qué', v: e.titulo, req: true, ph: 'Evento en Casa Antropo' },
        { n: 'cal', et: 'Calendario', tipo: 'select', ops: opsCal(), v: e.cal },
        { n: 'fecha', et: 'Día', tipo: 'date', v: e.fecha, req: true },
        { tipo: 'dos', campos: [{ n: 'ini', et: 'Desde', tipo: 'time', v: e.ini }, { n: 'fin', et: 'Hasta', tipo: 'time', v: e.fin }] },
        { n: 'lugar', et: 'Dónde o detalle', v: e.lugar },
      ],
      texto: 'Sin hora, queda como evento de todo el día.',
      alGuardar: (v) => { Object.assign(e, v, { todoElDia: !v.ini }); if (nuevo) { e.id = uid(); S.eventos.push(e); } avisar('Guardado en la agenda'); },
      borrar: nuevo ? null : () => { S.eventos = S.eventos.filter((x) => x !== e); },
    });
  }
  function editarRutina(r) {
    const nuevo = !r;
    r = r || { titulo: '', cal: 'personal', dias: [1, 2, 3, 4, 5], ini: '09:00', fin: '10:00' };
    formulario({
      titulo: nuevo ? 'Nuevo bloque de rutina' : 'Bloque de rutina',
      texto: r.estudio ? 'Es un bloque de estudio: el panel pone solo la materia que vence antes.' : 'Se repite todas las semanas.',
      campos: [
        { n: 'titulo', et: 'Qué', v: r.titulo, req: true },
        { n: 'cal', et: 'Calendario', tipo: 'select', ops: opsCal(), v: r.cal },
        { n: 'dias', et: 'Días', tipo: 'dias', v: r.dias },
        { tipo: 'dos', campos: [{ n: 'ini', et: 'Desde', tipo: 'time', v: r.ini, req: true }, { n: 'fin', et: 'Hasta', tipo: 'time', v: r.fin, req: true }] },
        { n: 'lugar', et: 'Dónde (opcional)', v: r.lugar },
        { n: 'estudio', et: 'Es bloque de estudio', tipo: 'check', v: r.estudio },
        ...(nuevo ? [] : [{ n: 'saltarHoy', et: 'Solo saltear el de hoy', tipo: 'check', v: false }]),
      ],
      alGuardar: (v) => {
        if (v.saltarHoy) { r.saltar = [...(r.saltar || []), iso(hoy())]; avisar('Salteado por hoy'); return; }
        delete v.saltarHoy; Object.assign(r, v); if (nuevo) { r.id = uid(); S.rutina.push(r); }
      },
      borrar: nuevo ? null : () => { S.rutina = S.rutina.filter((x) => x !== r); },
    });
  }

  // ── Plata: cálculos ──────────────────────────────────────────────────
  const clave = (id, m) => id + '|' + m;
  const montoPago = (p, m) => S.montosMes[clave(p.id, m)] ?? p.monto;
  const enPesos = (n, mon) => mon === 'USD' ? (S.dolar ? n * S.dolar : null) : n;
  const miParte = (n, comp) => comp ? n / 2 : n;
  function cuotasDelMes(tarjeta, m) {
    return S.cuotas.filter((c) => c.tarjeta === tarjeta).map((c) => ({ ...c, n: c.cuota + difMeses(c.mes, m) })).filter((c) => c.n >= 1 && c.n <= c.total);
  }
  function pagosDelMes(m) {
    const lista = S.pagos.map((p) => {
      const total = montoPago(p, m);
      return { tipo: 'pago', id: p.id, concepto: p.concepto, dia: p.dia, mon: p.moneda, total, mio: miParte(total, p.compartido), p, nota: p.nota, recordatorio: p.recordatorio, pagado: !!S.pagados[clave(p.id, m)] };
    });
    S.tarjetas.forEach((t) => {
      const cs = cuotasDelMes(t.id, m);
      if (!cs.length) return;
      const total = cs.reduce((s, c) => s + c.monto, 0), mio = cs.reduce((s, c) => s + miParte(c.monto, c.compartido), 0);
      lista.push({ tipo: 'tarjeta', id: t.id, concepto: t.nombre, dia: t.dia, total, mio, cuotas: cs, pagado: !!S.pagados[clave(t.id, m)] });
    });
    return lista.sort((a, b) => a.dia - b.dia);
  }
  const ingresosDelMes = (m) => (S.sueldo.monto || 0) + S.ingresos.filter((i) => i.fecha.startsWith(m)).reduce((s, i) => s + i.monto, 0);
  const gastosDelMes = (m) => S.gastos.filter((g) => g.fecha.startsWith(m));
  function fijosDelMes(m) {
    let pesosMio = 0; const usd = [];
    pagosDelMes(m).forEach((x) => { if (x.recordatorio) return; const v = enPesos(x.mio, x.mon); if (v === null) usd.push(x); else pesosMio += v; });
    return { pesosMio, usd };
  }
  // Lo que se libera cuando terminan las cuotas
  function liberaciones(desde) {
    const out = [];
    S.cuotas.forEach((c) => {
      const ultimo = mesMas(c.mes, c.total - c.cuota);
      if (difMeses(desde, ultimo) >= 0) out.push({ mes: mesMas(ultimo, 1), concepto: c.concepto, monto: miParte(c.monto, c.compartido) });
    });
    const porMes = {};
    out.forEach((o) => { (porMes[o.mes] = porMes[o.mes] || { mes: o.mes, monto: 0, cosas: [] }); porMes[o.mes].monto += o.monto; porMes[o.mes].cosas.push(o.concepto); });
    return Object.values(porMes).sort((a, b) => a.mes.localeCompare(b.mes));
  }

  // ── Lo que se viene (pagos, facu, trámites) ──────────────────────────
  function seViene(dias = 10) {
    const h = hoy(), lim = masDias(h, dias), out = [];
    [mesDe(h), mesMas(mesDe(h), 1)].forEach((m) => {
      const [a, mm] = m.split('-').map(Number);
      pagosDelMes(m).forEach((x) => {
        if (x.pagado) return;
        const f = new Date(a, mm - 1, Math.min(x.dia, new Date(a, mm, 0).getDate()));
        if (f >= masDias(h, -3) && f <= lim) out.push({ fecha: f, titulo: x.concepto, detalle: x.recordatorio ? (x.nota || 'Recordatorio') : `Tu parte: ${plata(x.mio, x.mon)}`, tipo: 'plata', ref: x, mes: m });
      });
    });
    facuPendientes().forEach((f) => { const d = desdeIso(f.fecha); if (d >= h && d <= masDias(h, 14)) out.push({ fecha: d, titulo: nombreFacu(f), detalle: f.nota || '', tipo: 'facu', ref: f }); });
    S.vence.filter((v) => !v.hecho).forEach((v) => { const d = desdeIso(v.fecha); if (d <= masDias(h, 30)) out.push({ fecha: d, titulo: v.que, detalle: v.detalle || '', tipo: 'vence', ref: v }); });
    return out.sort((a, b) => a.fecha - b.fecha);
  }
  const cajaDias = (n) => `<div class="dias-box ${n <= 2 ? 'urgente' : n <= 7 ? 'pronto' : ''}"><strong>${n < 0 ? '!' : n}</strong><small>${n < 0 ? 'vencido' : n === 1 ? 'día' : 'días'}</small></div>`;

  // ── Hábitos ──────────────────────────────────────────────────────────
  const hecho = (h, d) => !!h.dias[iso(d)];
  const semanaCuenta = (h, d) => { const l = lunesDe(d); let n = 0; for (let i = 0; i < 7; i++) if (hecho(h, masDias(l, i))) n++; return n; };
  function racha(h) {
    let n = 0, d = hoy();
    if (h.porSemana >= 7) { if (!hecho(h, d)) d = masDias(d, -1); while (hecho(h, d)) { n++; d = masDias(d, -1); } return n ? `${n} días seguidos` : ''; }
    let l = masDias(lunesDe(hoy()), -7);
    while (semanaCuenta(h, l) >= h.porSemana) { n++; l = masDias(l, -7); }
    if (semanaCuenta(h, hoy()) >= h.porSemana) n++;
    return n ? `${n} ${n === 1 ? 'semana' : 'semanas'} cumpliendo` : '';
  }

  // ── Clima (Open-Meteo, sin cuenta) ───────────────────────────────────
  let TIEMPO = null;
  try { const c = JSON.parse(localStorage.getItem('pdv:tiempo') || 'null'); if (c && Date.now() - c.t < 3 * 36e5) TIEMPO = c.d; } catch (e) {}
  const iconoTiempo = (c) => c === 0 ? 'sol' : c <= 2 ? 'solnube' : c <= 48 ? 'nube' : c <= 82 ? 'lluvia' : 'tormenta';
  const textoTiempo = (c) => c === 0 ? 'Despejado' : c <= 2 ? 'Algo nublado' : c === 3 ? 'Nublado' : c <= 48 ? 'Niebla' : c <= 57 ? 'Llovizna' : c <= 67 ? 'Lluvia' : c <= 77 ? 'Nieve' : c <= 82 ? 'Chaparrones' : 'Tormenta';
  async function cargarTiempo() {
    if (TIEMPO || !S || !S.persona.lat) return;
    try {
      const u = `https://api.open-meteo.com/v1/forecast?latitude=${S.persona.lat}&longitude=${S.persona.lon}&current=temperature_2m,weather_code&hourly=precipitation_probability&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
      const ctl = new AbortController(); setTimeout(() => ctl.abort(), 4000);
      const j = await (await fetch(u, { signal: ctl.signal })).json();
      const hA = new Date().getHours();
      let lluvia = null;
      for (let h = hA; h <= 23; h++) if (j.hourly.precipitation_probability[h] >= 50) { lluvia = h; break; }
      TIEMPO = { temp: Math.round(j.current.temperature_2m), cod: j.current.weather_code, max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]), lluvia };
      try { localStorage.setItem('pdv:tiempo', JSON.stringify({ t: Date.now(), d: TIEMPO })); } catch (e) {}
      if (seccion() === 'hoy') pintar();
    } catch (e) { /* sin internet: no se muestra */ }
  }

  // ══ Secciones ═════════════════════════════════════════════════════════
  const TABS = [['hoy', 'Hoy', 'hoy'], ['agenda', 'Agenda', 'calendario'], ['facu', 'Facu', 'birrete'], ['plata', 'Plata', 'dinero'], ['yo', 'Yo', 'yo']];
  const seccion = () => { const h = location.hash.slice(1); return TABS.some((t) => t[0] === h) ? h : 'hoy'; };
  const UI = { semana: 0, vistaAgenda: 'semana', diaSel: null, mesPlata: 0 };

  function pintarHoy() {
    const h = hoy(), ahora = AHORA(), evs = eventosDe(h);
    const conHoraEv = evs.filter((e) => !e.todo);
    const enCurso = conHoraEv.find((e) => e.ini <= ahora && e.fin > ahora);
    const sig = conHoraEv.find((e) => e.ini > ahora);
    const lineas = [];
    if (enCurso) lineas.push(`${ico('reloj')}<span>Ahora: <b>${esc(enCurso.titulo)}</b> hasta las ${hm(enCurso.fin)}.</span>`);
    if (sig) { const m = Math.round((sig.ini - ahora) / 6e4); lineas.push(`${ico('reloj')}<span>Lo que sigue: <b>${esc(sig.titulo)}</b> ${m < 90 ? `en <b>${m} min</b>` : `a las <b>${hm(sig.ini)}</b>`}.</span>`); }
    else if (!enCurso) lineas.push(`${ico('reloj')}<span>No te queda nada más en la agenda de hoy.</span>`);
    const prox = facuPendientes().find((f) => f.fecha >= iso(h));
    if (prox) { const n = diasEntre(h, desdeIso(prox.fecha)); lineas.push(`${ico('birrete')}<span><b>${esc(nombreFacu(prox))}</b> ${n === 0 ? '<b>es hoy</b>' : `en <b>${n} ${n === 1 ? 'día' : 'días'}</b>`}.</span>`); }
    if (TIEMPO && TIEMPO.lluvia !== null) lineas.push(`${ico('paraguas')}<span><b>Puede llover desde las ${TIEMPO.lluvia}:00</b>: llevá paraguas.</span>`);
    const hr = ahora.getHours();
    if (hr >= 23 || hr < 4) lineas.push(`${ico('luna')}<span>Ya es tarde: para levantarte 07:30 con 7 h de sueño, <b>a la cama antes de las 00:30</b>.</span>`);
    const saludo = hr < 6 ? 'Buenas noches' : hr < 13 ? 'Buen día' : hr < 20 ? 'Buenas tardes' : 'Buenas noches';
    const tiempo = TIEMPO ? `<div class="hero-tiempo"><strong>${ico(iconoTiempo(TIEMPO.cod))}${TIEMPO.temp}°</strong><small>${textoTiempo(TIEMPO.cod)}</small><small>${TIEMPO.max}° / ${TIEMPO.min}°</small></div>` : '';

    const viene = seViene();
    const hab = S.habitos;
    const suenoHoy = S.salud.sueno.find((s) => s.fecha === iso(h));

    return `
    <section class="tarjeta hero">${tiempo}
      <p class="hero-fecha">${fechaLarga(h)}</p>
      <h1>${saludo},<br><em>${esc(S.persona.nombre || 'vos')}</em></h1>
      <ul class="resumen">${lineas.map((l) => `<li>${l}</li>`).join('')}</ul>
      ${S.persona.foco ? `<div class="foco" data-a="foco">${ico('objetivos')}<span>Foco: <b>${esc(S.persona.foco)}</b></span></div>` : ''}
    </section>
    <section class="tarjeta">${cabeza('calendario', 'Tu día', `<button class="boton boton-chico" data-a="nuevo-evento">${ico('mas')}Evento</button>`)}${listaDia(h, true)}</section>
    <section class="tarjeta">${cabeza('aviso', 'Se viene', viene.length ? chip(viene.length + '') : '')}
      ${viene.length ? `<ul class="lista">${viene.map((v, i) => {
        const n = diasEntre(h, v.fecha);
        return `<li class="item item-click" data-viene="${i}">${cajaDias(n)}<div class="item-cuerpo"><b>${v.tipo === 'facu' ? ico('birrete') + ' ' : ''}${esc(v.titulo)}</b><span>${cap(cuando(n))} · ${fechaCorta(v.fecha)}${v.detalle ? ' · ' + esc(v.detalle) : ''}</span></div>
          ${v.tipo !== 'facu' ? `<button class="check" data-hecho="${i}" aria-label="Marcar como pagado o hecho">${ico('check')}</button>` : ''}</li>`;
      }).join('')}</ul>` : '<div class="vacio">Nada en los próximos 10 días. Tranqui.</div>'}
      <div class="fila-botones" style="margin-top:10px"><button class="boton boton-chico" data-a="nuevo-vence">${ico('mas')}Trámite o vencimiento</button></div>
    </section>
    <section class="tarjeta">${cabeza('check', 'Hábitos de hoy')}
      <ul class="lista">${hab.map((x) => `<li class="item"><span class="punto" style="--c:${colorVar(x.color)}"></span><div class="item-cuerpo"><b>${esc(x.nombre)}</b><span>${x.porSemana < 7 ? `${semanaCuenta(x, h)} de ${x.porSemana} esta semana` : racha(x) || 'Todos los días'}</span></div>
        <button class="check ${hecho(x, h) ? 'si' : ''}" data-habito="${x.id}" aria-label="Marcar ${esc(x.nombre)}">${ico('check')}</button></li>`).join('') || '<div class="vacio">Sin hábitos todavía.</div>'}</ul>
    </section>
    <section class="tarjeta">${cabeza('luna', 'Sueño de anoche')}
      ${suenoHoy ? `<p class="sub">Dormiste <b>${nf1.format(suenoHoy.horas)} h</b>. ${suenoHoy.horas >= S.salud.suenoMin ? 'Bien ahí.' : 'Hoy, a la cama más temprano.'}</p>`
        : `<p class="sub">Mirá cuánto marcó tu Galaxy Watch y anotalo.</p><div class="fila-botones" style="margin-top:10px">${[5.5, 6, 6.5, 7, 7.5, 8].map((x) => `<button class="boton boton-chico" data-sueno="${x}">${nf1.format(x)} h</button>`).join('')}<button class="boton boton-chico" data-a="sueno">Otro</button></div>`}
    </section>
    <section class="tarjeta">${cabeza('nota', 'Nota rápida')}<textarea class="nota" id="nota" placeholder="Algo que no te querés olvidar…">${esc(S.nota)}</textarea></section>`;
  }

  function pintarAgenda() {
    const h = hoy();
    const vista = UI.vistaAgenda;
    let cuerpo = '';
    if (vista === 'semana') {
      const l = masDias(lunesDe(h), UI.semana * 7);
      cuerpo = `<div class="semana-nav"><button class="boton-icono" data-sem="-1" aria-label="Semana anterior">${ico('izq')}</button>
        <strong>${fechaCorta(l)} – ${fechaCorta(masDias(l, 6))}</strong><button class="boton-icono" data-sem="1" aria-label="Semana siguiente">${ico('der')}</button></div>` +
        [0, 1, 2, 3, 4, 5, 6].map((i) => { const d = masDias(l, i); const k = iso(d); return `<div class="dia-bloque ${k === iso(h) ? 'hoy' : ''} ${d < h ? 'pasado' : ''}"><h3>${cap(DIAS[d.getDay()])} ${d.getDate()}${k === iso(h) ? ' · hoy' : ''}</h3>${listaDia(d, false)}</div>`; }).join('');
    } else {
      const base = new Date(h.getFullYear(), h.getMonth() + UI.semana, 1);
      const ini = lunesDe(base);
      const celdas = [];
      for (let i = 0; i < 42; i++) {
        const d = masDias(ini, i);
        if (i >= 35 && d.getMonth() !== base.getMonth()) break;
        const evs = eventosDe(d), facu = evs.some((e) => e.facu);
        celdas.push(`<button class="mes-dia ${d.getMonth() !== base.getMonth() ? 'fuera' : ''} ${iso(d) === iso(h) ? 'hoy' : ''} ${UI.diaSel === iso(d) ? 'sel' : ''}" data-dia="${iso(d)}">
          <strong>${d.getDate()}</strong>${facu ? '<span class="marca-facu">FACU</span>' : ''}<span class="mes-puntos">${[...new Set(evs.filter((e) => !e.facu).map((e) => e.cal))].map((c) => `<i style="background:${colorVar(calDe(c).color)}"></i>`).join('')}</span></button>`);
      }
      const sel = UI.diaSel ? desdeIso(UI.diaSel) : null;
      cuerpo = `<div class="semana-nav"><button class="boton-icono" data-sem="-1" aria-label="Mes anterior">${ico('izq')}</button><strong>${cap(MESES[base.getMonth()])} ${base.getFullYear()}</strong><button class="boton-icono" data-sem="1" aria-label="Mes siguiente">${ico('der')}</button></div>
        <div class="mes-cab">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x) => `<span>${x}</span>`).join('')}</div><div class="mes-rejilla">${celdas.join('')}</div>
        ${sel ? `<div class="dia-bloque" style="margin-top:12px;border:0"><h3>${fechaLarga(sel)}</h3>${listaDia(sel, false)}</div>` : '<p class="mini" style="margin-top:10px">Tocá un día para ver qué tenés.</p>'}`;
    }
    return `<section class="tarjeta">${cabeza('calendario', 'Agenda', `<div class="segmento"><button data-vista="semana" aria-selected="${vista === 'semana'}">Semana</button><button data-vista="mes" aria-selected="${vista === 'mes'}">Mes</button></div>`)}
      ${cuerpo}<div class="leyenda">${S.calendarios.map((c) => `<span><i style="background:${colorVar(c.color)}"></i>${esc(c.nombre)}</span>`).join('')}</div>
      <div class="fila-botones" style="margin-top:12px"><button class="boton boton-fuerte" data-a="nuevo-evento">${ico('mas')}Evento</button></div></section>
    <section class="tarjeta">${cabeza('reloj', 'Rutina semanal', `<button class="boton boton-chico" data-a="nueva-rutina">${ico('mas')}Bloque</button>`)}
      <p class="mini" style="margin-bottom:6px">Se repite sola cada semana. Tocá un bloque para cambiarlo o saltearlo un día.</p>
      <ul class="lista">${S.rutina.slice().sort((a, b) => a.ini.localeCompare(b.ini)).map((r) => `<li class="item item-click" data-rutina="${r.id}"><span class="punto" style="--c:${colorVar(calDe(r.cal).color)}"></span>
        <div class="item-cuerpo"><b>${esc(r.titulo)}${r.estudio ? '<span class="etiqueta">ESTUDIO</span>' : ''}</b><span>${[1, 2, 3, 4, 5, 6, 0].filter((d) => r.dias.includes(d)).map((d) => DIAS[d].slice(0, 3)).join(', ')}</span></div>
        <div class="item-valor">${r.ini}<small>${r.fin}</small></div></li>`).join('')}</ul></section>`;
  }

  function pintarFacu() {
    const h = hoy();
    const pend = facuPendientes();
    const sinFecha = S.facu.filter((f) => !f.hecho && !f.fecha);
    const hechas = S.facu.filter((f) => f.hecho);
    // Horas de estudio de esta semana
    const l = lunesDe(h); let minSem = 0;
    for (let i = 0; i < 7; i++) S.rutina.filter((r) => r.estudio && r.dias.includes(masDias(l, i).getDay())).forEach((r) => { minSem += (conHora(h, r.fin) - conHora(h, r.ini)) / 6e4; });
    const fila = (f) => {
      const n = f.fecha ? diasEntre(h, desdeIso(f.fecha)) : null;
      return `<li class="item item-click ${f.hecho ? 'hecho' : ''}" data-facu="${f.id}">${n !== null && !f.hecho ? cajaDias(n) : `<div class="dias-box"><strong>${f.hecho ? '✓' : '?'}</strong><small>${f.hecho ? 'listo' : 'fecha'}</small></div>`}
        <div class="item-cuerpo"><b>${esc(f.materia)}</b><span>${esc(f.titulo || cap(f.tipo))}${f.fecha ? ' · ' + fechaLarga(desdeIso(f.fecha)) + (f.hora ? ' · ' + f.hora : '') : ' · fecha a confirmar'}${f.nota ? ' · ' + esc(f.nota) : ''}</span></div>
        <button class="check ${f.hecho ? 'si' : ''}" data-facu-hecho="${f.id}" aria-label="Marcar como hecho">${ico('check')}</button></li>`;
    };
    const estudiaAhora = aQueEstudiar(h);
    return `
    <section class="tarjeta hero">
      <p class="hero-fecha">Lic. en Psicología · Cuenca del Plata</p>
      <h1>Facu</h1>
      <ul class="resumen">
        ${estudiaAhora ? `<li>${ico('birrete')}<span>Ahora toca: <b>${esc(nombreFacu(estudiaAhora))}</b> (${cuando(diasEntre(h, desdeIso(estudiaAhora.fecha)))}).</span></li>` : ''}
        <li>${ico('reloj')}<span>Tenés <b>${duracion(minSem)} de estudio</b> planificadas por semana. Los bloques se acomodan solos a lo que vence antes.</span></li>
        ${sinFecha.length ? `<li>${ico('aviso')}<span><b>${sinFecha.length}</b> ${sinFecha.length === 1 ? 'fecha' : 'fechas'} sin confirmar. Cargalas apenas salgan.</span></li>` : ''}
      </ul>
    </section>
    <section class="tarjeta">${cabeza('calendario', 'Próximas fechas', `<button class="boton boton-fuerte boton-chico" data-a="nueva-facu">${ico('mas')}Fecha</button>`)}
      <ul class="lista">${pend.map(fila).join('') || '<div class="vacio">Sin fechas pendientes.</div>'}</ul></section>
    ${sinFecha.length ? `<section class="tarjeta">${cabeza('aviso', 'Fecha a confirmar')}<ul class="lista">${sinFecha.map(fila).join('')}</ul></section>` : ''}
    <section class="tarjeta">${cabeza('reloj', 'Bloques de estudio')}
      <p class="mini" style="margin-bottom:6px">Entre el gym y el trabajo. Para cambiarlos, andá a Agenda → Rutina semanal.</p>
      <ul class="lista">${S.rutina.filter((r) => r.estudio).map((r) => `<li class="item item-click" data-rutina="${r.id}"><span class="punto" style="--c:var(--violeta)"></span><div class="item-cuerpo"><b>${[1, 2, 3, 4, 5, 6, 0].filter((d) => r.dias.includes(d)).map((d) => cap(DIAS[d].slice(0, 3))).join(', ')}</b><span>${duracion((conHora(h, r.fin) - conHora(h, r.ini)) / 6e4)}</span></div><div class="item-valor">${r.ini}<small>${r.fin}</small></div></li>`).join('')}</ul></section>
    ${hechas.length ? `<section class="tarjeta">${cabeza('check', 'Hechas', chip(hechas.length + ''))}<ul class="lista">${hechas.map(fila).join('')}</ul></section>` : ''}`;
  }
  function editarFacu(f) {
    const nuevo = !f;
    f = f || { materia: '', tipo: 'coloquio', titulo: '', fecha: '', hora: '', nota: '', hecho: false };
    const materias = [...new Set(S.facu.map((x) => x.materia))];
    formulario({
      titulo: nuevo ? 'Nueva fecha de la facu' : f.materia,
      campos: [
        { n: 'materia', et: 'Materia', v: f.materia, req: true, ph: materias[0] || 'Portugués', ayuda: materias.length ? 'Tus materias: ' + materias.join(' · ') : '' },
        { n: 'tipo', et: 'Tipo', tipo: 'select', v: f.tipo, ops: [['entrega', 'Entrega (AE, TP, foro)'], ['coloquio', 'Coloquio'], ['parcial', 'Parcial'], ['final', 'Final'], ['otro', 'Otro']] },
        { n: 'titulo', et: 'Nombre corto', v: f.titulo, ph: 'AE4, Coloquio, Final…' },
        { tipo: 'dos', campos: [{ n: 'fecha', et: 'Día', tipo: 'date', v: f.fecha || '' }, { n: 'hora', et: 'Hora (opcional)', tipo: 'time', v: f.hora || '' }] },
        { n: 'nota', et: 'Nota', v: f.nota || '' },
        { n: 'hecho', et: 'Ya está hecho / aprobado', tipo: 'check', v: f.hecho },
      ],
      alGuardar: (v) => { Object.assign(f, v, { fecha: v.fecha || null }); if (nuevo) { f.id = uid(); S.facu.push(f); } avisar('Guardado'); },
      borrar: nuevo ? null : () => { S.facu = S.facu.filter((x) => x !== f); },
    });
  }

  function pintarPlata() {
    const m = mesMas(mesDe(hoy()), UI.mesPlata);
    const ingresos = ingresosDelMes(m), fijos = fijosDelMes(m), gastos = gastosDelMes(m);
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
    const queda = ingresos - fijos.pesosMio - totalGastos;
    const pagos = pagosDelMes(m);
    const pagados = pagos.filter((p) => p.pagado && !p.recordatorio).length, aPagar = pagos.filter((p) => !p.recordatorio).length;
    const cats = S.categorias.map((c) => ({ ...c, v: gastos.filter((g) => g.cat === c.id).reduce((s, g) => s + g.monto, 0) })).filter((c) => c.v > 0).sort((a, b) => b.v - a.v);
    const maxCat = Math.max(1, ...cats.map((c) => c.v));
    const lib = liberaciones(m).slice(0, 4);
    const extras = S.ingresos.filter((i) => i.fecha.startsWith(m));
    const usdTxt = fijos.usd.length ? ` + ${fijos.usd.map((x) => plata(x.mio, 'USD')).join(' + ')}` : '';

    const filaPago = (x) => {
      const det = x.tipo === 'tarjeta' ? x.cuotas.map((c) => `${esc(c.concepto)} ${c.n}/${c.total}`).join(' · ')
        : x.recordatorio ? esc(x.nota || 'Recordatorio') : [x.p.compartido ? `Total ${plata(x.total, x.mon)} ÷ 2` : '', x.p.varia ? 'varía' : '', x.nota || ''].filter(Boolean).map(esc).join(' · ');
      return `<li class="item ${x.pagado ? 'hecho' : ''}"><div class="dias-box"><strong>${x.dia}</strong><small>${MC[Number(m.slice(5)) - 1]}</small></div>
        <div class="item-cuerpo item-click" data-${x.tipo === 'tarjeta' ? 'tarjeta' : 'pago'}="${x.id}"><b>${esc(x.concepto)}${x.p && x.p.varia ? ` <span class="etiqueta">${ico('lapiz')}</span>` : ''}</b><span>${det}</span></div>
        ${x.recordatorio ? '' : `<div class="item-valor">${plata(x.mio, x.mon)}${x.tipo === 'tarjeta' ? `<small>de ${pesos(x.total)}</small>` : ''}</div>`}
        <button class="check ${x.pagado ? 'si' : ''}" data-pagado="${x.id}" aria-label="Marcar como pagado">${ico('check')}</button></li>`;
    };

    return `
    <section class="tarjeta">${cabeza('dinero', 'Plata', `<div class="mes-sel"><button class="boton-icono" data-mes="-1" aria-label="Mes anterior">${ico('izq')}</button><strong>${nombreMes(m)}</strong><button class="boton-icono" data-mes="1" aria-label="Mes siguiente">${ico('der')}</button></div>`)}
      <div class="plata-cima">
        <div class="cifra grande ${queda < 0 ? 'mal' : ''}"><small>Te queda para el resto del mes</small><strong>${pesos(queda)}</strong>${usdTxt ? `<small>y falta restar${esc(usdTxt)} (cargá el dólar en Ajustes)</small>` : ''}</div>
        <div class="cifra item-click" data-a="sueldo"><small>Entra</small><strong>${pesos(ingresos)}</strong></div>
        <div class="cifra"><small>Pagos fijos (tu parte)</small><strong>${pesos(fijos.pesosMio)}</strong></div>
        <div class="cifra"><small>Gastos del día a día</small><strong>${pesos(totalGastos)}</strong></div>
        <div class="cifra"><small>Pagados</small><strong>${pagados} de ${aPagar}</strong></div>
      </div>
      <div class="fila-botones" style="margin-top:12px"><button class="boton boton-fuerte" data-a="gasto">${ico('mas')}Gasto</button><button class="boton" data-a="ingreso">${ico('mas')}Ingreso / comisión</button></div>
    </section>
    <section class="tarjeta">${cabeza('calendario', 'Pagos del mes', `<button class="boton boton-chico" data-a="nuevo-pago">${ico('mas')}Pago fijo</button>`)}
      <p class="mini" style="margin-bottom:4px">Los que tienen ${ico('lapiz')} cambian cada mes: tocalos para poner el monto de la boleta.</p>
      <ul class="lista">${pagos.map(filaPago).join('')}</ul></section>
    <section class="tarjeta">${cabeza('tarjeta', 'Cuotas', `<button class="boton boton-chico" data-a="nueva-cuota">${ico('mas')}Compra en cuotas</button>`)}
      ${S.tarjetas.map((t) => { const cs = cuotasDelMes(t.id, m); return `<h3 class="mini" style="margin:6px 0 2px;font-weight:800">${esc(t.nombre)} · vence el ${t.dia}</h3>
        <ul class="lista">${cs.map((c) => `<li class="item item-click" data-cuota="${c.id}"><div class="item-cuerpo"><b>${esc(c.concepto)} <span class="etiqueta">${c.n}/${c.total}</span></b><span>${c.n === c.total ? 'Última cuota 🎉' : `Faltan ${c.total - c.n}`}${c.compartido ? ' · a medias' : ''}</span></div><div class="item-valor">${pesos(miParte(c.monto, c.compartido))}${c.compartido ? `<small>de ${pesos(c.monto)}</small>` : ''}</div></li>`).join('') || '<div class="vacio">Sin cuotas este mes.</div>'}</ul>`; }).join('')}
    </section>
    ${lib.length ? `<section class="tarjeta">${cabeza('subida', 'Plata que se libera')}
      <p class="sub" style="margin-bottom:10px">Cuando termina una cuota, esa plata queda libre. Si la mandás al ahorro, no la extrañás porque ya te habías acostumbrado a no tenerla.</p>
      <ul class="libera">${lib.map((x) => `<li><span>Desde <b style="color:var(--texto)">${nombreMes(x.mes)}</b><br><span class="mini">${esc(x.cosas.join(', '))}</span></span><b>+${pesos(x.monto)}/mes</b></li>`).join('')}</ul></section>` : ''}
    <section class="tarjeta">${cabeza('ahorro', 'Ahorro', `<button class="boton boton-chico" data-a="nuevo-ahorro">${ico('mas')}Meta</button>`)}
      ${S.ahorro.map((a) => `<div class="objetivo item-click" data-ahorro="${a.id}"><div class="objetivo-cab"><b>${esc(a.nombre)}</b><span>${pesos(a.tengo)} <span class="mini">de ${pesos(a.meta)}</span></span></div>
        <div class="barra"><span style="--p:${Math.min(1, a.tengo / (a.meta || 1))};--c:var(--verde)"></span></div>${a.nota ? `<p class="mini" style="margin-top:6px">${esc(a.nota)}</p>` : ''}</div>`).join('') || '<div class="vacio">Sin metas de ahorro.</div>'}
      ${S.ahorro.length ? `<div class="fila-botones" style="margin-top:10px"><button class="boton boton-chico" data-a="deposito">${ico('mas')}Guardé plata</button></div>` : ''}</section>
    <section class="tarjeta">${cabeza('dinero', 'En qué se fue')}
      ${cats.length ? `<ul class="lista">${cats.map((c) => `<li class="item" style="display:block"><div class="objetivo-cab"><span><span class="punto" style="--c:${colorVar(c.color)};display:inline-block;margin-right:6px"></span>${esc(c.nombre)}</span><b>${pesos(c.v)}</b></div><div class="barra"><span style="--p:${c.v / maxCat};--c:${colorVar(c.color)}"></span></div></li>`).join('')}</ul>` : '<div class="vacio">Todavía no cargaste gastos este mes. Con un par de meses cargando vas a ver bien en qué se te va.</div>'}
      ${gastos.length || extras.length ? `<h3 class="mini" style="margin:14px 0 2px;font-weight:800">Movimientos</h3><ul class="lista">${[...gastos.map((g) => ({ ...g, signo: -1 })), ...extras.map((g) => ({ ...g, signo: 1 }))].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 15).map((g) => `<li class="item item-click" data-mov="${g.id}"><div class="item-cuerpo"><b>${esc(g.concepto)}</b><span>${fechaCorta(desdeIso(g.fecha))}${g.cat ? ' · ' + esc((S.categorias.find((c) => c.id === g.cat) || {}).nombre || '') : ''}</span></div><div class="item-valor" style="color:${g.signo > 0 ? 'var(--verde)' : 'inherit'}">${g.signo > 0 ? '+' : '−'}${pesos(g.monto)}</div></li>`).join('')}</ul>` : ''}
    </section>`;
  }

  function pintarYo() {
    const h = hoy(), l = lunesDe(h), Sa = S.salud;
    const pesos_ = Sa.peso.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
    const ultPeso = pesos_[pesos_.length - 1];
    const suenos = []; for (let i = 13; i >= 0; i--) { const d = masDias(h, -i); const s = Sa.sueno.find((x) => x.fecha === iso(d)); suenos.push({ d, v: s ? s.horas : null }); }
    const con = suenos.filter((s) => s.v !== null), prom7 = con.slice(-7);
    const promedio = prom7.length ? prom7.reduce((s, x) => s + x.v, 0) / prom7.length : null;

    // Gráfico del sueño (barras)
    const W = 320, H = 120, bw = W / 14;
    const yS = (v) => H - 16 - (v / 10) * (H - 24);
    const graSueno = `<svg class="graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <rect x="0" y="${yS(Sa.suenoMeta)}" width="${W}" height="${yS(Sa.suenoMin) - yS(Sa.suenoMeta)}" fill="var(--verde)" opacity=".12"/>
      ${suenos.map((s, i) => s.v === null ? '' : `<rect x="${i * bw + 3}" y="${yS(s.v)}" width="${bw - 6}" height="${H - 16 - yS(s.v)}" rx="3" fill="${s.v >= Sa.suenoMin ? 'var(--azul)' : 'var(--coral)'}"/>`).join('')}
      ${suenos.map((s, i) => i % 2 ? '' : `<text x="${i * bw + bw / 2}" y="${H - 3}" text-anchor="middle">${s.d.getDate()}</text>`).join('')}</svg>`;
    // Gráfico del peso (línea)
    let graPeso = '';
    if (pesos_.length >= 2) {
      const lo = Math.min(...pesos_.map((p) => p.kg), Sa.pesoInicio || 99) - 1, hi = Math.max(...pesos_.map((p) => p.kg), Sa.pesoMeta || 0) + 1;
      const x = (i) => 10 + (i / (pesos_.length - 1)) * (W - 20), y = (v) => H - 18 - ((v - lo) / (hi - lo)) * (H - 30);
      graPeso = `<svg class="graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        ${Sa.pesoMeta ? `<line x1="0" x2="${W}" y1="${y(Sa.pesoMeta)}" y2="${y(Sa.pesoMeta)}" stroke="var(--verde)" stroke-dasharray="4 4" opacity=".7"/><text x="${W - 4}" y="${y(Sa.pesoMeta) - 4}" text-anchor="end">meta ${nf1.format(Sa.pesoMeta)}</text>` : ''}
        <polyline fill="none" stroke="var(--coral)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${pesos_.map((p, i) => `${x(i)},${y(p.kg)}`).join(' ')}" vector-effect="non-scaling-stroke"/>
        ${pesos_.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.kg)}" r="3" fill="var(--coral)"/>`).join('')}
        <text x="10" y="${H - 3}">${fechaCorta(desdeIso(pesos_[0].fecha))}</text><text x="${W - 10}" y="${H - 3}" text-anchor="end">${fechaCorta(desdeIso(ultPeso.fecha))}</text></svg>`;
    }
    const progObj = (o) => {
      if (o.tipo === 'facu') { const t = S.facu.filter((f) => f.tipo === 'final' || f.tipo === 'coloquio'); const mats = [...new Set(t.map((f) => f.materia))]; const ok = mats.filter((mm) => t.filter((f) => f.materia === mm).some((f) => f.hecho)).length; return { p: ok / (mats.length || 1), txt: `${ok} de ${mats.length}` }; }
      if (o.tipo === 'peso') { if (!ultPeso || !Sa.pesoMeta) return { p: 0, txt: '—' }; const ini = Sa.pesoInicio ?? pesos_[0].kg; return { p: Math.max(0, (ultPeso.kg - ini) / (Sa.pesoMeta - ini)), txt: `${nf1.format(ultPeso.kg)} de ${nf1.format(Sa.pesoMeta)} kg` }; }
      if (o.tipo === 'ahorro') { const a = S.ahorro[0]; return a ? { p: a.tengo / (a.meta || 1), txt: `${pesos(a.tengo)} de ${pesos(a.meta)}` } : { p: 0, txt: '—' }; }
      const ps = o.pasos || []; const n = ps.filter((x) => x.hecho).length; return { p: n / (ps.length || 1), txt: `${n} de ${ps.length}` };
    };
    return `
    <section class="tarjeta">${cabeza('check', 'Hábitos · esta semana', `<button class="boton boton-chico" data-a="nuevo-habito">${ico('mas')}Hábito</button>`)}
      ${S.habitos.map((x) => { const n = semanaCuenta(x, h); return `<div class="habito" style="--c:${colorVar(x.color)}"><div class="habito-cab">${ico(x.icono || 'check')}<b class="item-click" data-habito-ed="${x.id}">${esc(x.nombre)}</b>${chip(`${n}/${Math.min(7, x.porSemana)}`, n >= x.porSemana ? 'chip-bien' : '')}</div>
        <div class="habito-semana">${[0, 1, 2, 3, 4, 5, 6].map((i) => { const d = masDias(l, i); const fut = d > h; return `<button class="hd ${hecho(x, d) ? 'si' : ''} ${iso(d) === iso(h) ? 'hoy' : ''} ${fut ? 'futuro' : ''}" data-hd="${x.id}|${iso(d)}" ${fut ? 'disabled' : ''}>${DIAS_C[d.getDay()]}<i>${hecho(x, d) ? '✓' : ''}</i></button>`; }).join('')}</div>
        ${racha(x) ? `<p class="mini" style="margin-top:6px">🔥 ${racha(x)}</p>` : ''}</div>`; }).join('')}
    </section>
    <section class="tarjeta">${cabeza('pesa', 'Peso', `<button class="boton boton-chico" data-a="peso">${ico('mas')}Me pesé</button>`)}
      <div class="salud-cima"><div><strong>${ultPeso ? nf1.format(ultPeso.kg) + ' kg' : '—'}</strong><p class="mini">${ultPeso ? 'Última vez ' + cuando(diasEntre(h, desdeIso(ultPeso.fecha))) : 'Sin datos'}</p></div>
        <div style="text-align:right"><p class="mini">Meta</p><b>${Sa.pesoMeta ? nf1.format(Sa.pesoMeta) + (Sa.pesoMetaMax ? '–' + nf1.format(Sa.pesoMetaMax) : '') + ' kg' : '—'}</b>${ultPeso && Sa.pesoMeta ? `<p class="mini">Faltan ${nf1.format(Math.max(0, Sa.pesoMeta - ultPeso.kg))} kg</p>` : ''}</div></div>
      ${graPeso || '<p class="mini">Pesate una vez por semana, mismo día y en ayunas. Con dos pesadas ya aparece el gráfico.</p>'}
    </section>
    <section class="tarjeta">${cabeza('luna', 'Sueño · 14 días', `<button class="boton boton-chico" data-a="sueno">${ico('mas')}Anotar</button>`)}
      <div class="salud-cima"><div><strong>${promedio ? nf1.format(promedio) + ' h' : '—'}</strong><p class="mini">Promedio de la última semana</p></div><div style="text-align:right"><p class="mini">Meta</p><b>${nf1.format(Sa.suenoMin)}–${nf1.format(Sa.suenoMeta)} h</b></div></div>
      ${con.length ? graSueno : '<p class="mini">Cada mañana, anotá las horas que marcó tu Galaxy Watch (desde Hoy es un toque).</p>'}
    </section>
    <section class="tarjeta">${cabeza('objetivos', 'Objetivos')}
      ${S.objetivos.map((o) => { const pr = progObj(o); return `<div class="objetivo"><div class="objetivo-cab"><b>${esc(o.nombre)}</b><span class="mini">${pr.txt}</span></div>
        <div class="barra"><span style="--p:${Math.min(1, pr.p)};--c:${colorVar(o.color)}"></span></div>
        ${o.tipo === 'pasos' ? `<div class="pasos">${o.pasos.map((p, i) => `<button class="${p.hecho ? 'si' : ''}" data-paso="${o.id}|${i}"><i>${p.hecho ? '✓' : ''}</i>${esc(p.t)}</button>`).join('')}<button data-paso-nuevo="${o.id}" style="color:var(--acento)"><i>+</i>Agregar paso</button></div>` : ''}</div>`; }).join('')}
    </section>
    <section class="tarjeta">${cabeza('gente', 'Gente que importa', `<button class="boton boton-chico" data-a="nueva-persona">${ico('mas')}Persona</button>`)}
      <ul class="lista">${S.gente.map((g) => { const n = g.ultima ? diasEntre(desdeIso(g.ultima), h) : null; const atrasado = n === null || n >= g.cada; return `<li class="item"><span class="punto" style="--c:${atrasado ? 'var(--ambar)' : 'var(--verde)'}"></span>
        <div class="item-cuerpo item-click" data-persona="${g.id}"><b>${esc(g.nombre)}</b><span>${n === null ? 'Sin registro' : n === 0 ? 'Hablaron hoy' : 'Hace ' + n + (n === 1 ? ' día' : ' días')} · cada ${g.cada === 1 ? 'día' : g.cada + ' días'}</span></div>
        <button class="boton boton-chico ${n === 0 ? '' : 'boton-fuerte'}" data-hable="${g.id}">${n === 0 ? '✓ Hoy' : 'Hablé hoy'}</button></li>`; }).join('')}</ul>
    </section>
    <section class="tarjeta">${cabeza('ajustes', 'Ajustes y copia de seguridad')}
      <p class="sub" style="margin-bottom:10px">Tus datos viven solo en este celu. Hacé una copia cada tanto y guardala en Drive o mandátela por WhatsApp.</p>
      <div class="fila-botones">
        <button class="boton boton-fuerte" data-a="exportar">Guardar copia</button>
        <button class="boton" data-a="importar">Cargar copia</button>
        <button class="boton" data-a="ajustes">Nombre, foco y dólar</button>
        <button class="boton boton-peligro" data-a="borrar-todo">Borrar todo</button>
      </div><input type="file" id="archivo" accept=".json,application/json" hidden>
    </section>`;
  }

  // ── Bienvenida (sin datos todavía) ───────────────────────────────────
  function pintarBienvenida() {
    $('#tabs').hidden = true;
    $('#vista').innerHTML = `<section class="tarjeta bienvenida">
      <span class="marca-logo" style="width:46px;height:46px;gap:5px" aria-hidden="true"><i></i><i></i><i></i></span>
      <h1>Tu <em>panel de vida</em></h1>
      <p class="sub">Para arrancar, cargá el archivo con tus datos (<b>mis-datos-panel.json</b>). Se guardan solo en este celu.</p>
      <button class="boton boton-fuerte" data-a="importar" style="height:46px;padding:0 22px">Cargar mis datos</button>
      <button class="boton" data-a="vacio">Empezar de cero</button>
      <input type="file" id="archivo" accept=".json,application/json" hidden></section>`;
  }

  // ── Pintar y responder a los toques ──────────────────────────────────
  function pintar() {
    if (!S) return pintarBienvenida();
    $('#tabs').hidden = false;
    const sec = seccion();
    $('#tabs').innerHTML = TABS.map(([id, t, ic]) => `<a href="#${id}" class="${id === sec ? 'activo' : ''}">${ico(ic)}<span>${t}</span></a>`).join('');
    const nota = $('#nota'); if (nota) S.nota = nota.value;
    $('#vista').innerHTML = { hoy: pintarHoy, agenda: pintarAgenda, facu: pintarFacu, plata: pintarPlata, yo: pintarYo }[sec]();
    const n = $('#nota'); if (n) n.addEventListener('input', () => { S.nota = n.value; guardar(); });
  }

  function exportar() {
    const txt = JSON.stringify(S, null, 1);
    const nombre = `panel-de-vida-copia-${iso(hoy())}.json`;
    try {
      const f = new File([txt], nombre, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: 'Copia del panel' }).catch(() => {}); return; }
    } catch (e) {}
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    avisar('Copia guardada en Descargas');
  }
  function importar() {
    const inp = $('#archivo'); inp.value = '';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      try {
        const d = JSON.parse(await f.text());
        if (!d || !d.version || !Array.isArray(d.pagos)) throw new Error();
        S = Object.assign(VACIO(), d); guardar(); location.hash = '#hoy'; pintar(); avisar('¡Listo! Datos cargados');
      } catch (e) { avisar('Ese archivo no es una copia del panel'); }
    };
    inp.click();
  }

  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('button, [data-ev], [data-viene], [data-rutina], [data-facu], [data-pago], [data-tarjeta], [data-cuota], [data-mov], [data-ahorro], [data-persona], [data-habito-ed], [data-a], [data-dia]');
    if (!t) return;
    const d = t.dataset;
    const m = mesMas(mesDe(hoy()), UI.mesPlata);

    if (d.habito) { const x = S.habitos.find((y) => y.id === d.habito); const k = iso(hoy()); if (x.dias[k]) delete x.dias[k]; else { x.dias[k] = 1; avisar('¡Bien ahí!'); } guardar(); return pintar(); }
    if (d.hd) { const [id, k] = d.hd.split('|'); const x = S.habitos.find((y) => y.id === id); if (x.dias[k]) delete x.dias[k]; else x.dias[k] = 1; guardar(); return pintar(); }
    if (d.sueno) { anotarSueno(Number(d.sueno)); return; }
    if (d.hecho !== undefined && d.hecho !== '') { ev.stopPropagation(); const v = seViene()[Number(d.hecho)]; if (!v) return; if (v.tipo === 'plata') S.pagados[clave(v.ref.id, v.mes)] = true; else v.ref.hecho = true; guardar(); avisar(v.tipo === 'plata' ? 'Marcado como pagado' : 'Hecho. Uno menos'); return pintar(); }
    if (d.viene) { const v = seViene()[Number(d.viene)]; if (!v) return; if (v.tipo === 'facu') return editarFacu(v.ref); if (v.tipo === 'vence') return editarVence(v.ref); UI.mesPlata = difMeses(mesDe(hoy()), v.mes); location.hash = '#plata'; return; }
    if (d.facuHecho) { ev.stopPropagation(); const f = S.facu.find((x) => x.id === d.facuHecho); f.hecho = !f.hecho; guardar(); if (f.hecho) avisar('¡Vamos! Una menos'); return pintar(); }
    if (d.ev) return tocarEvento(t);
    if (d.rutina && t.tagName !== 'BUTTON') return editarRutina(S.rutina.find((r) => r.id === d.rutina));
    if (d.facu && t.tagName !== 'BUTTON') return editarFacu(S.facu.find((f) => f.id === d.facu));
    if (d.sem) { UI.semana += Number(d.sem); return pintar(); }
    if (d.vista) { UI.vistaAgenda = d.vista; UI.semana = 0; return pintar(); }
    if (d.dia) { UI.diaSel = d.dia; return pintar(); }
    if (d.mes) { UI.mesPlata += Number(d.mes); return pintar(); }
    if (d.pagado) { const k = clave(d.pagado, m); if (S.pagados[k]) delete S.pagados[k]; else { S.pagados[k] = true; avisar('Pagado ✓'); } guardar(); return pintar(); }
    if (d.pago) return editarPago(S.pagos.find((p) => p.id === d.pago), m);
    if (d.tarjeta) return editarTarjeta(S.tarjetas.find((x) => x.id === d.tarjeta));
    if (d.cuota) return editarCuota(S.cuotas.find((c) => c.id === d.cuota));
    if (d.mov) return editarMovimiento(d.mov);
    if (d.ahorro) return editarAhorro(S.ahorro.find((a) => a.id === d.ahorro));
    if (d.persona) return editarPersona(S.gente.find((g) => g.id === d.persona));
    if (d.hable) { const g = S.gente.find((x) => x.id === d.hable); g.ultima = iso(hoy()); guardar(); avisar('Anotado'); return pintar(); }
    if (d.habitoEd) return editarHabito(S.habitos.find((x) => x.id === d.habitoEd));
    if (d.paso) { const [id, i] = d.paso.split('|'); const o = S.objetivos.find((x) => x.id === id); o.pasos[i].hecho = !o.pasos[i].hecho; guardar(); return pintar(); }
    if (d.pasoNuevo) { const o = S.objetivos.find((x) => x.id === d.pasoNuevo); return formulario({ titulo: 'Nuevo paso', campos: [{ n: 't', et: 'Paso', req: true }], alGuardar: (v) => { o.pasos.push({ t: v.t, hecho: false }); } }); }

    switch (d.a) {
      case 'nuevo-evento': return editarEvento(null, UI.diaSel);
      case 'nueva-rutina': return editarRutina(null);
      case 'nueva-facu': return editarFacu(null);
      case 'nuevo-vence': return editarVence(null);
      case 'foco': return formulario({ titulo: 'Foco de la semana', campos: [{ n: 'foco', et: 'En qué te enfocás', v: S.persona.foco }], alGuardar: (v) => { S.persona.foco = v.foco; } });
      case 'sueno': return formulario({ titulo: '¿Cuánto dormiste?', campos: [{ n: 'fecha', et: 'Noche que termina el', tipo: 'date', v: iso(hoy()) }, { n: 'horas', et: 'Horas', tipo: 'num', ph: '6,5', req: true }], alGuardar: (v) => { if (!(v.horas > 0 && v.horas < 16)) { avisar('Poné las horas, por ejemplo 6,5'); return false; } setSueno(v.fecha, v.horas); } });
      case 'peso': return formulario({ titulo: 'Me pesé', campos: [{ n: 'fecha', et: 'Día', tipo: 'date', v: iso(hoy()) }, { n: 'kg', et: 'Kilos', tipo: 'num', ph: '69,4', req: true }, { n: 'meta', et: 'Meta (kg)', tipo: 'num', v: S.salud.pesoMeta ? String(S.salud.pesoMeta).replace('.', ',') : '' }], alGuardar: (v) => { if (!(v.kg > 20)) { avisar('Poné los kilos, por ejemplo 69,4'); return false; } S.salud.peso = S.salud.peso.filter((p) => p.fecha !== v.fecha); S.salud.peso.push({ fecha: v.fecha, kg: v.kg }); if (v.meta > 20) S.salud.pesoMeta = v.meta; if (S.salud.pesoInicio == null) S.salud.pesoInicio = v.kg; avisar('Anotado'); } });
      case 'gasto': return editarMovimiento(null, 'gasto');
      case 'ingreso': return editarMovimiento(null, 'ingreso');
      case 'sueldo': return formulario({ titulo: 'Ingreso fijo', texto: 'Lo que entra todos los meses. Las comisiones cargalas con "Ingreso / comisión".', campos: [{ n: 'concepto', et: 'Concepto', v: S.sueldo.concepto }, { n: 'monto', et: 'Monto por mes', tipo: 'plata', v: S.sueldo.monto ? nf0.format(S.sueldo.monto) : '' }], alGuardar: (v) => { S.sueldo = { concepto: v.concepto, monto: v.monto || 0 }; } });
      case 'nuevo-pago': return editarPago(null, m);
      case 'nueva-cuota': return editarCuota(null);
      case 'nuevo-ahorro': return editarAhorro(null);
      case 'deposito': return formulario({ titulo: 'Guardé plata', campos: [{ n: 'meta', et: 'En qué meta', tipo: 'select', ops: S.ahorro.map((a) => [a.id, a.nombre]) }, { n: 'monto', et: 'Cuánto', tipo: 'plata', req: true, ph: '20.000' }], texto: 'Si sacaste, poné el monto con un menos adelante (−20.000).', alGuardar: (v) => { const a = S.ahorro.find((x) => x.id === v.meta); if (!a || isNaN(v.monto)) return false; a.tengo = Math.max(0, a.tengo + v.monto); avisar(v.monto > 0 ? '¡Eso! Sumaste ' + pesos(v.monto) : 'Anotado'); } });
      case 'nuevo-habito': return editarHabito(null);
      case 'nueva-persona': return editarPersona(null);
      case 'exportar': return exportar();
      case 'importar': return importar();
      case 'vacio': S = VACIO(); guardar(); return pintar();
      case 'ajustes': return formulario({ titulo: 'Ajustes', campos: [{ n: 'nombre', et: 'Tu nombre', v: S.persona.nombre }, { n: 'foco', et: 'Foco de la semana', v: S.persona.foco }, { n: 'dolar', et: 'Dólar tarjeta (pesos por US$ 1)', tipo: 'plata', v: S.dolar ? nf0.format(S.dolar) : '', ayuda: 'Para sumar a tus gastos lo que se cobra en dólares (Claude). Dejalo vacío si no querés.' }],
        alGuardar: (v) => { S.persona.nombre = v.nombre; S.persona.foco = v.foco; S.dolar = v.dolar > 0 ? v.dolar : null; } });
      case 'borrar-todo': return formulario({ titulo: '¿Borrar todo?', texto: 'Se borran todos tus datos de este celu. Hacé antes una copia si la querés guardar.', ok: 'Sí, borrar todo', alGuardar: () => { S = null; try { localStorage.removeItem(CLAVE); } catch (e) {} }, campos: [] });
    }
    if (t.id === 'boton-tema') {
      const r = document.documentElement; const nuevo = r.dataset.theme === 'light' ? 'dark' : 'light'; r.dataset.theme = nuevo;
      try { localStorage.setItem('pdv:tema', nuevo); } catch (e) {} pintarTema();
    }
  });

  function setSueno(fecha, horas) { S.salud.sueno = S.salud.sueno.filter((s) => s.fecha !== fecha); S.salud.sueno.push({ fecha, horas }); S.salud.sueno = S.salud.sueno.slice(-120); }
  function anotarSueno(h) { setSueno(iso(hoy()), h); guardar(); avisar(h >= S.salud.suenoMin ? 'Anotado. Bien ahí' : 'Anotado. Hoy, a la cama más temprano'); pintar(); }

  function editarVence(v) {
    const nuevo = !v;
    v = v || { que: '', detalle: '', fecha: iso(masDias(hoy(), 7)), hecho: false };
    formulario({ titulo: nuevo ? 'Trámite o vencimiento' : 'Editar', campos: [{ n: 'que', et: 'Qué', v: v.que, req: true, ph: 'Renovar el carnet de conducir' }, { n: 'fecha', et: 'Fecha límite', tipo: 'date', v: v.fecha, req: true }, { n: 'detalle', et: 'Detalle', v: v.detalle }, { n: 'hecho', et: 'Hecho', tipo: 'check', v: v.hecho }],
      alGuardar: (x) => { Object.assign(v, x); if (nuevo) { v.id = uid(); S.vence.push(v); } }, borrar: nuevo ? null : () => { S.vence = S.vence.filter((y) => y !== v); } });
  }
  function editarPago(p, m) {
    const nuevo = !p;
    p = p || { concepto: '', monto: 0, dia: 10, cat: 'casa', compartido: false, varia: false };
    const k = clave(p.id, m);
    formulario({
      titulo: nuevo ? 'Nuevo pago fijo' : p.concepto,
      texto: nuevo ? '' : `Monto de <b>${nombreMes(m)}</b>. ${p.varia ? 'Poné lo que dice la boleta.' : ''}`,
      campos: [
        ...(nuevo ? [] : [{ n: 'montoMes', et: `Monto total de ${nombreMes(m).toLowerCase()}${p.moneda === 'USD' ? ' (US$)' : ''}`, tipo: 'plata', v: nf2.format(montoPago(p, m)).replace(/,00$/, ''), ayuda: p.compartido ? 'El total de la boleta: el panel lo divide entre 2.' : '' }]),
        { n: 'concepto', et: 'Concepto', v: p.concepto, req: true },
        ...(nuevo ? [{ n: 'monto', et: 'Monto habitual (total)', tipo: 'plata', v: '', req: true }] : [{ n: 'monto', et: 'Monto habitual (los meses que no cambies)', tipo: 'plata', v: nf2.format(p.monto).replace(/,00$/, '') }]),
        { tipo: 'dos', campos: [{ n: 'dia', et: 'Vence el día', tipo: 'num', v: p.dia }, { n: 'moneda', et: 'Moneda', tipo: 'select', ops: [['ARS', 'Pesos'], ['USD', 'Dólares']], v: p.moneda || 'ARS' }] },
        { n: 'cat', et: 'Categoría', tipo: 'select', ops: opsCat(), v: p.cat },
        { n: 'compartido', et: 'Lo pago a medias (÷ 2)', tipo: 'check', v: p.compartido },
        { n: 'varia', et: 'El monto cambia cada mes', tipo: 'check', v: p.varia },
        { n: 'recordatorio', et: 'Solo recordatorio (no lo pago yo)', tipo: 'check', v: p.recordatorio },
        { n: 'nota', et: 'Nota', v: p.nota || '' },
      ],
      alGuardar: (v) => {
        if (!nuevo && !isNaN(v.montoMes) && v.montoMes !== montoPago(p, m)) S.montosMes[k] = v.montoMes;
        delete v.montoMes; if (isNaN(v.monto)) v.monto = p.monto || 0; v.dia = Math.min(31, Math.max(1, Math.round(v.dia) || 1));
        Object.assign(p, v); if (nuevo) { p.id = uid(); S.pagos.push(p); }
      },
      borrar: nuevo ? null : () => { S.pagos = S.pagos.filter((x) => x !== p); },
    });
  }
  function editarTarjeta(t) {
    formulario({ titulo: t.nombre, texto: 'Las cuotas se cargan en la sección Cuotas.', campos: [{ n: 'nombre', et: 'Nombre', v: t.nombre }, { n: 'dia', et: 'Vence el día', tipo: 'num', v: t.dia }],
      alGuardar: (v) => { t.nombre = v.nombre; t.dia = Math.min(31, Math.max(1, Math.round(v.dia) || 10)); },
      borrar: () => { S.tarjetas = S.tarjetas.filter((x) => x !== t); S.cuotas = S.cuotas.filter((c) => c.tarjeta !== t.id); } });
  }
  function editarCuota(c) {
    const nuevo = !c, m = mesMas(mesDe(hoy()), UI.mesPlata);
    c = c || { tarjeta: (S.tarjetas[0] || {}).id, concepto: '', monto: 0, cuota: 1, total: 3, mes: m, compartido: false };
    const nAhora = c.cuota + difMeses(c.mes, m);
    formulario({
      titulo: nuevo ? 'Compra en cuotas' : c.concepto,
      texto: `Contá la cuota que se paga en <b>${nombreMes(m)}</b>. Después avanza sola cada mes.`,
      campos: [
        { n: 'concepto', et: 'Qué compraste', v: c.concepto, req: true, ph: 'Zapatillas' },
        { n: 'tarjeta', et: 'Tarjeta', tipo: 'select', ops: [...S.tarjetas.map((t) => [t.id, t.nombre]), ['__nueva', '+ Otra tarjeta o crédito']], v: c.tarjeta },
        { n: 'monto', et: 'Valor de cada cuota (total)', tipo: 'plata', v: c.monto ? nf0.format(c.monto) : '', req: true },
        { tipo: 'dos', campos: [{ n: 'cuota', et: `Cuota en ${MC[Number(m.slice(5)) - 1]}`, tipo: 'num', v: nAhora }, { n: 'total', et: 'De', tipo: 'num', v: c.total }] },
        { n: 'compartido', et: 'Es a medias (÷ 2)', tipo: 'check', v: c.compartido },
      ],
      alGuardar: (v) => {
        if (!(v.monto > 0)) { avisar('Poné el valor de la cuota'); return false; }
        if (v.tarjeta === '__nueva') { const t = { id: uid(), nombre: 'Otra tarjeta', dia: 10 }; S.tarjetas.push(t); v.tarjeta = t.id; setTimeout(() => editarTarjeta(t), 50); }
        Object.assign(c, { concepto: v.concepto, tarjeta: v.tarjeta, monto: v.monto, cuota: Math.max(1, Math.round(v.cuota) || 1), total: Math.max(1, Math.round(v.total) || 1), mes: m, compartido: v.compartido });
        if (nuevo) { c.id = uid(); S.cuotas.push(c); }
      },
      borrar: nuevo ? null : () => { S.cuotas = S.cuotas.filter((x) => x !== c); },
    });
  }
  function editarMovimiento(id, tipoNuevo) {
    let g = id && (S.gastos.find((x) => x.id === id) || S.ingresos.find((x) => x.id === id));
    const esIngreso = g ? S.ingresos.includes(g) : tipoNuevo === 'ingreso';
    const nuevo = !g;
    g = g || { concepto: '', monto: '', fecha: iso(hoy()), cat: 'comida' };
    formulario({
      titulo: nuevo ? (esIngreso ? 'Nuevo ingreso' : 'Nuevo gasto') : (esIngreso ? 'Ingreso' : 'Gasto'),
      campos: [
        { n: 'concepto', et: 'Concepto', v: g.concepto, req: true, ph: esIngreso ? 'Comisión evento Casa Antropo' : 'Súper' },
        { n: 'monto', et: 'Monto', tipo: 'plata', v: g.monto ? nf2.format(g.monto).replace(/,00$/, '') : '', req: true, ph: '12.500' },
        ...(esIngreso ? [] : [{ n: 'cat', et: 'Categoría', tipo: 'select', ops: opsCat(), v: g.cat }]),
        { n: 'fecha', et: 'Día', tipo: 'date', v: g.fecha },
      ],
      texto: esIngreso && nuevo ? 'Idea: de cada comisión, mandá la mitad al ahorro.' : '',
      alGuardar: (v) => {
        if (!(v.monto > 0)) { avisar('Poné el monto, por ejemplo 12.500'); return false; }
        Object.assign(g, v); if (nuevo) { g.id = uid(); (esIngreso ? S.ingresos : S.gastos).push(g); }
        avisar(esIngreso ? 'Ingreso anotado' : 'Gasto anotado');
      },
      borrar: nuevo ? null : () => { S.gastos = S.gastos.filter((x) => x !== g); S.ingresos = S.ingresos.filter((x) => x !== g); },
    });
  }
  function editarAhorro(a) {
    const nuevo = !a; a = a || { nombre: '', tengo: 0, meta: 0, nota: '' };
    formulario({ titulo: nuevo ? 'Nueva meta de ahorro' : a.nombre, campos: [{ n: 'nombre', et: 'Para qué', v: a.nombre, req: true }, { n: 'meta', et: 'Meta', tipo: 'plata', v: a.meta ? nf0.format(a.meta) : '' }, { n: 'tengo', et: 'Lo que tenés guardado', tipo: 'plata', v: nf0.format(a.tengo || 0) }, { n: 'nota', et: 'Nota', v: a.nota }],
      alGuardar: (v) => { Object.assign(a, { nombre: v.nombre, meta: v.meta || 0, tengo: v.tengo || 0, nota: v.nota }); if (nuevo) { a.id = uid(); S.ahorro.push(a); } }, borrar: nuevo ? null : () => { S.ahorro = S.ahorro.filter((x) => x !== a); } });
  }
  function editarPersona(g) {
    const nuevo = !g; g = g || { nombre: '', cada: 7, ultima: null };
    formulario({ titulo: nuevo ? 'Nueva persona' : g.nombre, campos: [{ n: 'nombre', et: 'Nombre', v: g.nombre, req: true }, { n: 'cada', et: 'Hablar cada cuántos días', tipo: 'num', v: g.cada }, { n: 'ultima', et: 'Última vez que hablaron', tipo: 'date', v: g.ultima || '' }],
      alGuardar: (v) => { Object.assign(g, { nombre: v.nombre, cada: Math.max(1, Math.round(v.cada) || 7), ultima: v.ultima || null }); if (nuevo) { g.id = uid(); S.gente.push(g); } }, borrar: nuevo ? null : () => { S.gente = S.gente.filter((x) => x !== g); } });
  }
  function editarHabito(x) {
    const nuevo = !x; x = x || { nombre: '', icono: 'check', color: 'verde', porSemana: 7, dias: {} };
    formulario({ titulo: nuevo ? 'Nuevo hábito' : x.nombre, campos: [{ n: 'nombre', et: 'Hábito', v: x.nombre, req: true }, { n: 'porSemana', et: 'Veces por semana', tipo: 'num', v: x.porSemana },
      { n: 'color', et: 'Color', tipo: 'select', v: x.color, ops: [['verde', 'Verde'], ['azul', 'Azul'], ['violeta', 'Violeta'], ['ambar', 'Ámbar'], ['coral', 'Coral'], ['rosa', 'Rosa'], ['cian', 'Celeste']] },
      { n: 'icono', et: 'Ícono', tipo: 'select', v: x.icono, ops: [['check', 'Tilde'], ['pesa', 'Pesa'], ['gota', 'Agua'], ['libro', 'Libro'], ['birrete', 'Facu'], ['luna', 'Luna'], ['sol', 'Sol'], ['corazon', 'Corazón'], ['telefono', 'Teléfono']] }],
      alGuardar: (v) => { Object.assign(x, { nombre: v.nombre, porSemana: Math.min(7, Math.max(1, Math.round(v.porSemana) || 7)), color: v.color, icono: v.icono }); if (nuevo) { x.id = uid(); S.habitos.push(x); } }, borrar: nuevo ? null : () => { S.habitos = S.habitos.filter((y) => y !== x); } });
  }

  function pintarTema() { $('#boton-tema').innerHTML = ico(document.documentElement.dataset.theme === 'light' ? 'luna' : 'sol'); }

  // ── Arranque ─────────────────────────────────────────────────────────
  if (!S && window.DATOS_INICIALES) { S = Object.assign(VACIO(), JSON.parse(JSON.stringify(window.DATOS_INICIALES))); guardar(); }
  pintarTema();
  pintar();
  window.addEventListener('hashchange', () => { window.scrollTo(0, 0); pintar(); });
  cargarTiempo();
  // Repinta cada minuto (la hora avanza) y al volver a la app
  setInterval(() => { if (!$('#modal').open && seccion() === 'hoy') pintar(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('#modal').open) { pintar(); cargarTiempo(); } });
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !location.hostname.endsWith('claude.ai') && !location.hostname.endsWith('claudeusercontent.com')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
