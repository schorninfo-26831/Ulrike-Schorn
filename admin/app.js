/**
 * Das Cockpit. Vanilla JS, kein Framework, kein Build-Schritt. Formulare entstehen
 * automatisch aus dem Schema der Bausteine — ein neues Feld im Schema erscheint hier
 * von selbst. Jeder Ablauf steht im Handbuch (handbook.js) mit den echten Knopfnamen.
 */
(function () {
  'use strict';
  const app = document.getElementById('app');
  const stamm = { types: [], blocks: {}, statuses: [], ungelesen: 0 };

  // ---- Werkzeug ---------------------------------------------------------------
  const el = (tag, attrs = {}, ...kinder) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kinder.flat(Infinity)) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
    return n;
  };
  const leeren = (n) => { while (n.firstChild) n.removeChild(n.firstChild); return n; };

  async function api(pfad, opt = {}) {
    const init = { method: opt.method || 'GET', credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (opt.roh) { init.body = opt.roh; init.headers['Content-Type'] = 'application/octet-stream'; }
    else if (opt.body !== undefined) { init.body = JSON.stringify(opt.body); init.headers['Content-Type'] = 'application/json'; }
    const r = await fetch('/api' + pfad, init);
    if (r.status === 401 && pfad !== '/login') { zeigeLogin(); throw new Error('Anmeldung nötig'); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `${r.status} ${r.statusText}`);
    return d;
  }

  let toastTimer;
  function toast(text, fehler = false) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = el('div', { class: 'toast' + (fehler ? ' toast--fehler' : ''), role: 'status' }, text);
    document.body.append(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), fehler ? 6000 : 3000);
  }

  /** Rückfrage als kleines Fenster. Gibt den Eingabewert (oder true) zurück, null bei Abbruch. */
  function frage(titel, { text = '', eingabe = null, platzhalter = '', ok = 'OK', rot = false } = {}) {
    return new Promise((resolve) => {
      const input = eingabe !== null ? el('input', { type: 'text', value: eingabe, placeholder: platzhalter, id: 'frage-eingabe' }) : null;
      const box = el('div', { class: 'modal__box', role: 'dialog', 'aria-modal': 'true' },
        el('h2', {}, titel), text ? el('p', {}, text) : null,
        input ? el('label', { class: 'feld' }, input) : null,
        el('div', { class: 'zeile', style: 'justify-content:flex-end' },
          el('button', { class: 'knopf knopf--leise', type: 'button', onclick: () => { modal.remove(); resolve(null); } }, 'Abbrechen'),
          el('button', { class: 'knopf' + (rot ? ' knopf--rot' : ''), type: 'button', id: 'frage-ok', onclick: () => { const w = input ? input.value.trim() : true; modal.remove(); resolve(w); } }, ok)));
      const modal = el('div', { class: 'modal' }, box);
      document.body.append(modal);
      (input || box.querySelector('#frage-ok')).focus();
    });
  }

  const statusLabel = { draft: 'Entwurf', generated: 'generiert', edited: 'bearbeitet', approved: 'freigegeben', published: 'veröffentlicht', archived: 'archiviert' };
  const datum = (iso) => new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

  // ---- Login ------------------------------------------------------------------------
  async function zeigeLogin() {
    const status = await fetch('/api/status').then((r) => r.json()).catch(() => ({}));
    const pw = el('input', { type: 'password', id: 'passwort', autocomplete: 'current-password', required: true });
    const meldung = el('div', {});
    const form = el('form', { onsubmit: async (e) => {
      e.preventDefault();
      try { await api('/login', { method: 'POST', body: { passwort: pw.value } }); start(); }
      catch (err) { leeren(meldung).append(el('div', { class: 'fehler' }, err.message)); }
    } },
      el('h1', {}, 'Cockpit'), el('p', {}, 'Camping Schorni · Inhaltsseite'),
      status.passwortKonfiguriert === false ? el('div', { class: 'warn' }, 'ADMIN_PASSWORD ist nicht gesetzt. Trag es in die Datei .env ein (Vorlage: .env.example) und starte den Motor neu.') : null,
      el('label', { class: 'feld' }, el('span', {}, 'Passwort'), pw),
      meldung,
      el('button', { class: 'knopf', type: 'submit', id: 'login' }, 'Anmelden'));
    leeren(app).append(el('div', { class: 'login' }, el('div', { class: 'login__box' }, form)));
    pw.focus();
  }

  // ---- Rahmen ---------------------------------------------------------------------------
  const ansichten = {
    seiten: { titel: 'Seiten' }, navigation: { titel: 'Navigation' }, medien: { titel: 'Medien' },
    umleitungen: { titel: 'Umleitungen' }, anfragen: { titel: 'Anfragen' }, fakten: { titel: 'Fakten' }, handbuch: { titel: 'Handbuch' },
  };
  let hauptbereich, badge;

  function rahmen() {
    const punkte = Object.entries(ansichten).map(([key, a]) =>
      el('a', { class: 'punkt', href: '#/' + key, 'data-view': key }, a.titel, key === 'anfragen' ? (badge = el('span', { class: 'badge', hidden: true })) : null));
    hauptbereich = el('main', {});
    leeren(app).append(el('div', { class: 'app' },
      el('aside', { class: 'seite' },
        el('div', { class: 'seite__marke' }, el('img', { src: '/img/schorni-logo.png', alt: '' }), el('div', {}, el('b', {}, 'Cockpit'), el('small', {}, 'Camping Schorni'))),
        ...punkte,
        el('div', { class: 'seite__fuss' }, el('a', { href: '/', target: '_blank', style: 'color:#fff' }, 'Website öffnen ↗'),
          el('button', { type: 'button', onclick: async () => { await api('/logout', { method: 'POST' }); zeigeLogin(); } }, 'Abmelden'))),
      hauptbereich));
  }

  function markiere(view) {
    document.querySelectorAll('.seite a.punkt').forEach((a) => a.classList.toggle('aktiv', a.dataset.view === view));
  }

  async function zaehleUngelesen() {
    try {
      const liste = await api('/submissions');
      stamm.ungelesen = liste.filter((s) => !s.gelesen).length;
      badge.hidden = stamm.ungelesen === 0; badge.textContent = stamm.ungelesen;
    } catch { /* still */ }
  }

  function kopf(titel, ...rechts) {
    return el('div', { class: 'kopf' }, el('h1', {}, titel), el('div', { class: 'rechts' }, ...rechts));
  }

  // ---- Seiten (3.1) ---------------------------------------------------------------------
  async function ansichtSeiten() {
    const seiten = await api('/pages');
    const tabelle = el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'Titel'), el('th', {}, 'Adresse'), el('th', {}, 'Typ'), el('th', {}, 'Status'), el('th', {}, 'Geändert'), el('th', {}))),
      el('tbody', {}, seiten.map((s) => el('tr', {},
        el('td', {}, el('b', {}, s.title || '(ohne Titel)')),
        el('td', {}, el('code', {}, '/' + s.slug + '/')),
        el('td', {}, (stamm.types.find((t) => t.name === s.page_type) || {}).label || s.page_type),
        el('td', {}, el('span', { class: 'status status--' + s.status }, statusLabel[s.status] || s.status)),
        el('td', {}, datum(s.updated_at)),
        el('td', {}, el('div', { class: 'zeile' },
          el('a', { class: 'knopf knopf--klein', href: '#/seite/' + s.id }, 'Bearbeiten'),
          el('a', { class: 'knopf knopf--klein knopf--leise', href: '/api/preview/' + s.id, target: '_blank' }, 'Vorschau')))))));
    leeren(hauptbereich).append(
      kopf('Seiten', el('button', { class: 'knopf', type: 'button', id: 'neue-seite', onclick: neueSeite }, 'Neue Seite')),
      el('p', { class: 'hinweis' }, `${seiten.length} Seiten. Ein Entwurf ist öffentlich nicht erreichbar; „Vorschau" zeigt ihn trotzdem.`),
      tabelle);
  }

  async function neueSeite() {
    const typ = el('select', { id: 'neu-typ' }, stamm.types.map((t) => el('option', { value: t.name }, `${t.label} — ${t.beschreibung || ''}`)));
    const titel = el('input', { type: 'text', id: 'neu-titel', placeholder: 'z. B. Winterfest machen' });
    const slug = el('input', { type: 'text', id: 'neu-slug', placeholder: 'entsteht aus dem Titel' });
    titel.addEventListener('input', () => { if (!slug.dataset.hand) slug.value = slugify(titel.value); });
    slug.addEventListener('input', () => { slug.dataset.hand = '1'; });
    const meldung = el('div', {});
    const modal = el('div', { class: 'modal' }, el('div', { class: 'modal__box', role: 'dialog' },
      el('h2', {}, 'Neue Seite'),
      el('label', { class: 'feld' }, el('span', {}, 'Seitentyp'), typ),
      el('label', { class: 'feld' }, el('span', {}, 'Titel'), titel),
      el('label', { class: 'feld' }, el('span', {}, 'Slug (Adresse)'), slug),
      meldung,
      el('div', { class: 'zeile', style: 'justify-content:flex-end' },
        el('button', { class: 'knopf knopf--leise', type: 'button', onclick: () => modal.remove() }, 'Abbrechen'),
        el('button', { class: 'knopf', type: 'button', id: 'neu-anlegen', onclick: async () => {
          try {
            const s = await api('/pages', { method: 'POST', body: { page_type: typ.value, title: titel.value, slug: slug.value } });
            modal.remove(); toast('Seite angelegt'); location.hash = '#/seite/' + s.id;
          } catch (err) { leeren(meldung).append(el('div', { class: 'fehler' }, err.message)); }
        } }, 'Anlegen'))));
    document.body.append(modal); titel.focus();
  }

  const slugify = (s) => String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

  // ---- Seite bearbeiten -------------------------------------------------------------------
  async function ansichtSeite(id) {
    const seite = await api('/pages/' + id);
    const typ = stamm.types.find((t) => t.name === seite.page_type) || { schema: {} };
    const erlaubt = typ.schema.allowedBlocks || Object.keys(stamm.blocks);
    const inhalt = seite.content_json;
    let geaendert = false;
    const merke = () => { geaendert = true; };

    const fTitel = el('input', { type: 'text', id: 'titel', value: seite.title || '', oninput: merke });
    const fSlug = el('input', { type: 'text', id: 'slug', value: seite.slug, oninput: merke });
    const fBeschr = el('textarea', { id: 'beschreibung', oninput: merke, style: 'min-height:64px' }, seite.description || '');
    const fOg = bildFeld({ id: 'og_image', wert: seite.og_image || '', onchange: merke });
    const fStatus = el('select', { id: 'status', onchange: merke }, stamm.statuses.map((s) => el('option', { value: s, selected: s === seite.status }, statusLabel[s] || s)));

    const bloeckeBox = el('div', { id: 'bloecke' });
    const zeichneBloecke = () => {
      leeren(bloeckeBox);
      inhalt.blocks.forEach((b, i) => bloeckeBox.append(blockFormular(b, i, inhalt.blocks, zeichneBloecke, merke)));
    };
    zeichneBloecke();

    const neuTyp = el('select', { id: 'neuer-baustein' }, erlaubt.map((n) => el('option', { value: n }, (stamm.blocks[n] || {}).label || n)));
    const hinzu = el('div', { class: 'zeile' }, neuTyp,
      el('button', { class: 'knopf knopf--leise', type: 'button', id: 'baustein-hinzufuegen', onclick: () => {
        inhalt.blocks.push({ type: neuTyp.value, data: {} }); merke(); zeichneBloecke();
        bloeckeBox.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } }, 'Baustein hinzufügen'));

    const sammle = () => {
      bloeckeBox.querySelectorAll('.block').forEach((box, i) => { inhalt.blocks[i].data = liesBlock(box, stamm.blocks[inhalt.blocks[i].type]); });
      return { title: fTitel.value, slug: fSlug.value, description: fBeschr.value, og_image: fOg.wert(), status: fStatus.value, content: inhalt };
    };

    const speichern = async (status) => {
      const daten = sammle();
      if (status) daten.status = status;
      try {
        const neu = await api('/pages/' + id, { method: 'PUT', body: daten });
        geaendert = false;
        toast(neu.umleitung ? `Gespeichert. Umleitung angelegt: ${neu.umleitung}` : (status === 'published' ? 'Veröffentlicht — die Seite ist jetzt erreichbar' : 'Gespeichert'));
        if (neu.slug !== seite.slug || neu.status !== seite.status) { seite.slug = neu.slug; seite.status = neu.status; fSlug.value = neu.slug; fStatus.value = neu.status; }
      } catch (err) { toast(err.message, true); }
    };

    const loeschen = async () => {
      let ziel = '';
      if (seite.status === 'published') {
        ziel = await frage('Seite ist veröffentlicht — wohin umleiten?', { text: 'Alte Links müssen ein Ziel behalten. Pfad eingeben, z. B. /wasser-ratgeber/', eingabe: '/', ok: 'Löschen und umleiten', rot: true });
        if (!ziel) return;
      } else if (!(await frage(`„${seite.title}" wirklich löschen?`, { ok: 'Löschen', rot: true }))) return;
      try { await api('/pages/' + id, { method: 'DELETE', body: { to_path: ziel } }); toast('Seite gelöscht'); location.hash = '#/seiten'; }
      catch (err) { toast(err.message, true); }
    };

    window.onbeforeunload = () => (geaendert ? true : undefined);

    leeren(hauptbereich).append(
      kopf(seite.title || 'Seite',
        el('a', { class: 'knopf knopf--leise', href: '/api/preview/' + id, target: '_blank', id: 'vorschau' }, 'Vorschau'),
        el('button', { class: 'knopf knopf--leise', type: 'button', id: 'speichern', onclick: () => speichern() }, 'Speichern'),
        el('button', { class: 'knopf', type: 'button', id: 'veroeffentlichen', onclick: () => speichern('published') }, 'Veröffentlichen')),
      el('div', { class: 'karte' },
        el('div', { class: 'zeile', style: 'align-items:flex-start' },
          el('label', { class: 'feld', style: 'flex:2 1 260px' }, el('span', {}, 'Titel'), fTitel),
          el('label', { class: 'feld', style: 'flex:1 1 200px' }, el('span', {}, 'Slug — Adresse /…/'), fSlug),
          el('label', { class: 'feld', style: 'flex:0 1 180px' }, el('span', {}, 'Status'), fStatus)),
        el('label', { class: 'feld' }, el('span', {}, 'Beschreibung (für Google und beim Teilen)'), fBeschr),
        el('div', { class: 'feld' }, el('span', {}, 'Vorschaubild fürs Teilen (og:image)'), fOg.node),
        seite.status === 'published' ? el('p', { class: 'hinweis' }, 'Diese Seite ist veröffentlicht. Änderst du den Slug, legt der Motor von allein eine Umleitung an.') : null),
      el('h2', { style: 'font-size:16px;margin:18px 0 10px' }, 'Bausteine'),
      bloeckeBox, hinzu,
      el('div', { class: 'karte', style: 'margin-top:22px' },
        el('div', { class: 'zeile' }, el('button', { class: 'knopf knopf--rot', type: 'button', id: 'loeschen', onclick: loeschen }, 'Löschen'),
          el('span', { class: 'hinweis' }, 'Bei veröffentlichten Seiten nur mit Umleitungsziel.'))));
  }

  /** Ein Baustein als Kasten: Kopf mit Reihenfolge-Knöpfen, darunter das Formular aus dem Schema. */
  function blockFormular(block, i, liste, neuZeichnen, merke) {
    const def = stamm.blocks[block.type];
    const kopfzeile = el('div', { class: 'block__kopf' },
      el('b', {}, def ? def.label : block.type), el('small', {}, block.type),
      el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', title: 'Nach oben', disabled: i === 0, onclick: () => { [liste[i - 1], liste[i]] = [liste[i], liste[i - 1]]; merke(); neuZeichnen(); } }, '↑'),
      el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', title: 'Nach unten', disabled: i === liste.length - 1, onclick: () => { [liste[i + 1], liste[i]] = [liste[i], liste[i + 1]]; merke(); neuZeichnen(); } }, '↓'),
      el('button', { class: 'knopf knopf--klein knopf--rot', type: 'button', title: 'Entfernen', onclick: () => { liste.splice(i, 1); merke(); neuZeichnen(); } }, '✕'));
    const inhalt = el('div', { class: 'block__inhalt' });
    if (!def) inhalt.append(el('div', { class: 'fehler' }, `Unbekannter Baustein „${block.type}" — er wird auf der Seite nicht angezeigt.`));
    else inhalt.append(...schemaFormular(def.schema, block.data || {}, merke));
    return el('div', { class: 'block', 'data-type': block.type }, kopfzeile, inhalt);
  }

  /** Aus einem Schema Felder bauen. Typen: text, longtext, image, bool, list. */
  function schemaFormular(schema, daten, merke, praefix = '') {
    return Object.entries(schema).map(([key, def]) => {
      const wert = daten[key] ?? def.default ?? '';
      const name = praefix + key;
      if (def.type === 'longtext') return el('label', { class: 'feld' }, el('span', {}, def.label || key), el('textarea', { 'data-feld': name, oninput: merke }, wert));
      if (def.type === 'bool') return el('label', { class: 'feld feld--inline' }, el('input', { type: 'checkbox', 'data-feld': name, checked: Boolean(wert), onchange: merke }), el('span', {}, def.label || key));
      if (def.type === 'image') { const f = bildFeld({ wert, onchange: merke, altSchwester: () => null }); f.node.dataset.feld = name; f.node.dataset.bild = '1'; return el('div', { class: 'feld' }, el('span', {}, def.label || key), f.node); }
      if (def.type === 'list') return listenFeld(name, def, Array.isArray(wert) ? wert : [], merke);
      return el('label', { class: 'feld' }, el('span', {}, def.label || key), el('input', { type: 'text', 'data-feld': name, value: wert, oninput: merke }));
    });
  }

  /** Bildfeld: Pfad plus „Bild wählen" aus den Medien. */
  function bildFeld({ id, wert = '', onchange }) {
    const input = el('input', { type: 'text', id, value: wert, placeholder: '/uploads/… oder /img/…', oninput: onchange, style: 'flex:1' });
    const node = el('div', { class: 'zeile' }, input,
      el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', onclick: async () => {
        const m = await bildWaehlen(); if (!m) return;
        input.value = m.file_path; onchange();
        // Alt-Text der Medien vorschlagen, wenn im selben Baustein ein leeres Alt-Feld liegt
        const box = node.closest('.block__inhalt'); if (!box) return;
        const alt = box.querySelector('[data-feld$="Alt"], [data-feld="alt"]'); if (alt && !alt.value) alt.value = m.alt || '';
      } }, 'Bild wählen'));
    return { node, wert: () => input.value.trim() };
  }

  function bildWaehlen() {
    return new Promise(async (resolve) => {
      const liste = await api('/media').catch(() => []);
      const modal = el('div', { class: 'modal' }, el('div', { class: 'modal__box', role: 'dialog' },
        el('h2', {}, 'Bild wählen'),
        liste.length ? el('div', { class: 'medien' }, liste.map((m) => el('button', { type: 'button', class: 'medium', style: 'cursor:pointer;text-align:left', onclick: () => { modal.remove(); resolve(m); } },
          el('img', { src: m.file_path, alt: m.alt || '' }), el('code', {}, m.file_path), el('div', {}, m.alt)))) : el('p', {}, 'Noch keine Bilder. Unter „Medien" hochladen.'),
        el('div', { class: 'zeile', style: 'justify-content:flex-end;margin-top:12px' }, el('button', { class: 'knopf knopf--leise', type: 'button', onclick: () => { modal.remove(); resolve(null); } }, 'Abbrechen'))));
      document.body.append(modal);
    });
  }

  /** Listenfeld (z. B. Karten): Zeilen mit Unterfeldern, hinzufügen / verschieben / entfernen. */
  function listenFeld(name, def, werte, merke) {
    const zeilen = werte.map((z) => ({ ...z }));
    const box = el('div', { class: 'feld', 'data-liste': name });
    const zeichne = () => {
      leeren(box).append(el('span', {}, def.label || name));
      zeilen.forEach((z, i) => {
        const felder = Object.entries(def.felder || {}).map(([k, typ]) => {
          const w = z[k] ?? '';
          if (typ === 'longtext') return el('label', { class: 'feld' }, el('span', {}, k), el('textarea', { 'data-unterfeld': k, oninput: (e) => { z[k] = e.target.value; merke(); }, style: 'min-height:70px' }, w));
          if (typ === 'bool') return el('label', { class: 'feld feld--inline' }, el('input', { type: 'checkbox', checked: Boolean(w), onchange: (e) => { z[k] = e.target.checked; merke(); } }), el('span', {}, k));
          return el('label', { class: 'feld' }, el('span', {}, k), el('input', { type: 'text', 'data-unterfeld': k, value: w, oninput: (e) => { z[k] = e.target.value; merke(); } }));
        });
        box.append(el('div', { class: 'liste__zeile' }, ...felder, el('div', { class: 'zeile' },
          el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', disabled: i === 0, onclick: () => { [zeilen[i - 1], zeilen[i]] = [zeilen[i], zeilen[i - 1]]; merke(); zeichne(); } }, '↑'),
          el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', disabled: i === zeilen.length - 1, onclick: () => { [zeilen[i + 1], zeilen[i]] = [zeilen[i], zeilen[i + 1]]; merke(); zeichne(); } }, '↓'),
          el('button', { class: 'knopf knopf--klein knopf--rot', type: 'button', onclick: () => { zeilen.splice(i, 1); merke(); zeichne(); } }, '✕'))));
      });
      box.append(el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', onclick: () => { zeilen.push(Object.fromEntries(Object.keys(def.felder || {}).map((k) => [k, def.felder[k] === 'bool' ? false : '']))); merke(); zeichne(); } }, '+ Eintrag'));
    };
    zeichne();
    box.werte = () => zeilen;
    return box;
  }

  /** Werte eines Baustein-Kastens einsammeln, spiegelbildlich zu schemaFormular. */
  function liesBlock(box, def) {
    const daten = {};
    if (!def) return daten;
    for (const [key, f] of Object.entries(def.schema)) {
      if (f.type === 'list') { const l = box.querySelector(`[data-liste="${key}"]`); daten[key] = l ? l.werte() : []; continue; }
      if (f.type === 'image') { const n = box.querySelector(`[data-feld="${key}"][data-bild] input`); daten[key] = n ? n.value.trim() : ''; continue; }
      const n = box.querySelector(`[data-feld="${key}"]`);
      if (!n) continue;
      daten[key] = f.type === 'bool' ? n.checked : n.value;
    }
    return daten;
  }

  // ---- Navigation (3.2) ---------------------------------------------------------------------
  async function ansichtNavigation() {
    const [baum, seiten] = await Promise.all([api('/navigation'), api('/pages')]);
    const menue = baum.map((p) => ({ label: p.label, href: p.href, warnung: p.warnung, kinder: (p.kinder || []).map((k) => ({ ...k })) }));
    const oeffentlich = seiten.filter((s) => s.status === 'published');
    const rechts = el('ul', { class: 'nav-tree', id: 'menue' });
    const zeichne = () => {
      leeren(rechts);
      if (!menue.length) rechts.append(el('li', {}, el('span', { class: 'hinweis' }, 'Das Menü ist leer. Links eine Seite mit „+" hinzufügen.')));
      menue.forEach((p, i) => {
        const kinder = el('ul', {}, (p.kinder || []).map((k, j) => el('li', {}, el('div', { class: 'zeile' },
          el('input', { type: 'text', value: k.label, placeholder: 'Beschriftung', oninput: (e) => { k.label = e.target.value; } }),
          el('input', { type: 'text', value: k.href, placeholder: '/adresse/', oninput: (e) => { k.href = e.target.value; } }),
          el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', disabled: j === 0, onclick: () => { [p.kinder[j - 1], p.kinder[j]] = [p.kinder[j], p.kinder[j - 1]]; zeichne(); } }, '↑'),
          el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', disabled: j === p.kinder.length - 1, onclick: () => { [p.kinder[j + 1], p.kinder[j]] = [p.kinder[j], p.kinder[j + 1]]; zeichne(); } }, '↓'),
          el('button', { class: 'knopf knopf--klein knopf--rot', type: 'button', onclick: () => { p.kinder.splice(j, 1); zeichne(); } }, '✕')),
          k.warnung ? el('div', { class: 'warn' }, k.warnung) : null)));
        rechts.append(el('li', {}, el('div', { class: 'zeile' },
          el('input', { type: 'text', value: p.label, placeholder: 'Beschriftung', oninput: (e) => { p.label = e.target.value; } }),
          el('input', { type: 'text', value: p.href, placeholder: '/adresse/', oninput: (e) => { p.href = e.target.value; } }),
          el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', disabled: i === 0, onclick: () => { [menue[i - 1], menue[i]] = [menue[i], menue[i - 1]]; zeichne(); } }, '↑'),
          el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', disabled: i === menue.length - 1, onclick: () => { [menue[i + 1], menue[i]] = [menue[i], menue[i + 1]]; zeichne(); } }, '↓'),
          el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', onclick: () => { (p.kinder = p.kinder || []).push({ label: '', href: '/' }); zeichne(); } }, 'Unterpunkt'),
          el('button', { class: 'knopf knopf--klein knopf--rot', type: 'button', onclick: () => { menue.splice(i, 1); zeichne(); } }, '✕')),
          p.warnung ? el('div', { class: 'warn' }, p.warnung) : null, kinder));
      });
    };
    zeichne();
    const links = el('div', { class: 'karte' }, el('h2', {}, 'Veröffentlichte Seiten'),
      oeffentlich.map((s) => el('div', { class: 'zeile', style: 'justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--linie)' },
        el('span', {}, el('b', {}, s.title), ' ', el('code', {}, '/' + s.slug + '/')),
        el('button', { class: 'knopf knopf--klein', type: 'button', title: 'Ins Menü', onclick: () => { menue.push({ label: s.title, href: '/' + s.slug + '/', kinder: [] }); zeichne(); } }, '+'))),
      el('div', { class: 'zeile', style: 'margin-top:12px' }, el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', id: 'externer-link', onclick: () => { menue.push({ label: 'Shop', href: 'https://camping-schorni.de', kinder: [] }); zeichne(); } }, 'Externer Link')));
    leeren(hauptbereich).append(
      kopf('Navigation', el('button', { class: 'knopf', type: 'button', id: 'menue-speichern', onclick: async () => {
        try { await api('/navigation', { method: 'PUT', body: menue.map((p) => ({ label: p.label, href: p.href, kinder: (p.kinder || []).map((k) => ({ label: k.label, href: k.href })) })) }); toast('Menü gespeichert'); ansichtNavigation(); }
        catch (err) { toast(err.message, true); }
      } }, 'Menü speichern')),
      el('p', { class: 'hinweis' }, 'Zwei Ebenen. Die Reihenfolge ist Redaktion. Punkte, deren Ziel nicht veröffentlicht ist, werden auf der Website versteckt.'),
      el('div', { class: 'zwei' }, links, el('div', { class: 'karte' }, el('h2', {}, 'Menü'), rechts)));
  }

  // ---- Medien (3.3) ----------------------------------------------------------------------------
  async function ansichtMedien() {
    const liste = await api('/media');
    const datei = el('input', { type: 'file', id: 'datei', accept: '.png,.jpg,.jpeg,.webp,.gif' });
    const alt = el('input', { type: 'text', id: 'alt', placeholder: 'Was ist auf dem Bild zu sehen?' });
    const hochladen = el('button', { class: 'knopf', type: 'button', id: 'hochladen', onclick: async () => {
      const f = datei.files[0];
      if (!f) return toast('Bitte eine Datei wählen', true);
      if (!alt.value.trim()) return toast('Alt-Text ist Pflicht', true);
      hochladen.disabled = true;
      try { await api(`/media?name=${encodeURIComponent(f.name)}&alt=${encodeURIComponent(alt.value.trim())}`, { method: 'POST', roh: f }); toast('Hochgeladen'); ansichtMedien(); }
      catch (err) { toast(err.message, true); hochladen.disabled = false; }
    } }, 'Hochladen');
    leeren(hauptbereich).append(
      kopf('Medien'),
      el('div', { class: 'karte' }, el('h2', {}, 'Bild hochladen'),
        el('div', { class: 'zeile', style: 'align-items:flex-end' },
          el('label', { class: 'feld', style: 'flex:1 1 220px' }, el('span', {}, 'Datei (PNG, JPG, WebP, GIF)'), datei),
          el('label', { class: 'feld', style: 'flex:2 1 260px' }, el('span', {}, 'Alt-Text — Pflicht'), alt),
          el('div', { class: 'feld' }, hochladen))),
      liste.length ? el('div', { class: 'medien' }, liste.map((m) => el('div', { class: 'medium' },
        el('img', { src: m.file_path, alt: m.alt || '' }), el('code', {}, m.file_path), el('div', {}, m.alt), el('div', { class: 'hinweis' }, `${Math.round(m.bytes / 1024)} KB · ${datum(m.created_at)}`),
        el('div', { class: 'zeile', style: 'margin-top:6px' },
          el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', onclick: () => { navigator.clipboard?.writeText(m.file_path); toast('Pfad kopiert'); } }, 'Pfad kopieren'),
          el('button', { class: 'knopf knopf--klein knopf--rot', type: 'button', onclick: async () => {
            if (!(await frage('Bild löschen?', { text: 'Seiten, die es verwenden, zeigen es danach nicht mehr.', ok: 'Löschen', rot: true }))) return;
            try { await api('/media/' + m.id, { method: 'DELETE' }); toast('Gelöscht'); ansichtMedien(); } catch (err) { toast(err.message, true); }
          } }, 'Löschen'))))) : el('p', { class: 'hinweis' }, 'Noch keine Bilder.'));
  }

  // ---- Umleitungen (3.4) ------------------------------------------------------------------------
  async function ansichtUmleitungen() {
    const liste = await api('/redirects');
    const von = el('input', { type: 'text', id: 'von', placeholder: '/alte-adresse/' });
    const nach = el('input', { type: 'text', id: 'nach', placeholder: '/neue-adresse/ oder https://…' });
    leeren(hauptbereich).append(
      kopf('Umleitungen'),
      el('div', { class: 'karte' }, el('h2', {}, 'Umleitung anlegen'),
        el('div', { class: 'zeile', style: 'align-items:flex-end' },
          el('label', { class: 'feld', style: 'flex:1 1 200px' }, el('span', {}, 'von'), von),
          el('label', { class: 'feld', style: 'flex:1 1 200px' }, el('span', {}, 'nach'), nach),
          el('div', { class: 'feld' }, el('button', { class: 'knopf', type: 'button', id: 'umleitung-anlegen', onclick: async () => {
            try { await api('/redirects', { method: 'POST', body: { from_path: von.value, to_path: nach.value } }); toast('Umleitung angelegt'); ansichtUmleitungen(); } catch (err) { toast(err.message, true); }
          } }, 'Umleitung anlegen')))),
      liste.length ? el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'von'), el('th', {}, 'nach'), el('th', {}, 'Code'), el('th', {}, 'Seit'), el('th', {}))),
        el('tbody', {}, liste.map((r) => el('tr', {}, el('td', {}, el('code', {}, r.from_path)), el('td', {}, el('code', {}, r.to_path)), el('td', {}, r.code), el('td', {}, datum(r.created_at)),
          el('td', {}, el('button', { class: 'knopf knopf--klein knopf--rot', type: 'button', onclick: async () => {
            if (!(await frage('Umleitung löschen?', { text: `${r.from_path} führt danach ins Leere.`, ok: 'Löschen', rot: true }))) return;
            try { await api('/redirects', { method: 'DELETE', body: { from_path: r.from_path } }); toast('Gelöscht'); ansichtUmleitungen(); } catch (err) { toast(err.message, true); }
          } }, 'Löschen')))))) : el('p', { class: 'hinweis' }, 'Keine Umleitungen. Umbenennen und Löschen veröffentlichter Seiten legen hier von allein welche an.'));
  }

  // ---- Anfragen (3.7) ------------------------------------------------------------------------------
  async function ansichtAnfragen() {
    const liste = await api('/submissions');
    const zeilen = [];
    for (const a of liste) {
      const detail = el('tr', { class: 'anfrage__detail', hidden: true }, el('td', { colspan: 4 },
        el('dl', {}, Object.entries(a.daten).filter(([k]) => !k.startsWith('_')).flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, String(v))])),
        el('div', { class: 'zeile', style: 'margin-top:10px' }, el('button', { class: 'knopf knopf--klein knopf--leise', type: 'button', onclick: async () => { await api('/submissions/' + a.id, { method: 'PUT', body: { gelesen: !a.gelesen } }); ansichtAnfragen(); zaehleUngelesen(); } }, a.gelesen ? 'Als ungelesen markieren' : 'Als gelesen markieren'))));
      const zeile = el('tr', { class: 'anfrage' + (a.gelesen ? '' : ' anfrage--neu'), onclick: async () => {
        detail.hidden = !detail.hidden;
        if (!a.gelesen && !detail.hidden) { await api('/submissions/' + a.id, { method: 'PUT', body: { gelesen: true } }); a.gelesen = 1; zeile.classList.remove('anfrage--neu'); zaehleUngelesen(); }
      } },
        el('td', {}, datum(a.created_at)), el('td', {}, a.form), el('td', {}, a.page_slug ? '/' + a.page_slug + '/' : '—'),
        el('td', {}, String(a.daten.name || a.daten.email || Object.values(a.daten)[0] || '').slice(0, 60)));
      zeilen.push(zeile, detail);
    }
    leeren(hauptbereich).append(
      kopf('Anfragen'),
      el('p', { class: 'hinweis' }, 'Jede Anfrage wird zuerst gespeichert, dann verschickt. Was hier steht, ist angekommen — auch wenn keine Mail kam.'),
      liste.length ? el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'Wann'), el('th', {}, 'Formular'), el('th', {}, 'Seite'), el('th', {}, 'Von'))), el('tbody', {}, zeilen)) : el('p', { class: 'hinweis' }, 'Noch keine Anfragen.'));
  }

  // ---- Fakten (3.8) ----------------------------------------------------------------------------------
  async function ansichtFakten() {
    const { wirksam } = await api('/facts');
    const werte = JSON.parse(JSON.stringify(wirksam));
    const felder = [];
    const feld = (pfadListe, wert) => {
      const name = pfadListe.join('.');
      const input = el('input', { type: 'text', id: 'fakt-' + name.replace(/\./g, '-'), value: wert ?? '' });
      felder.push({ pfadListe, input });
      return el('label', { class: 'feld' }, el('span', {}, name), input);
    };
    const gruppen = [];
    for (const [k, v] of Object.entries(werte)) {
      if (k.startsWith('_')) continue;
      if (v && typeof v === 'object' && !Array.isArray(v)) gruppen.push(el('div', { class: 'karte' }, el('h2', {}, k), Object.entries(v).map(([k2, v2]) => feld([k, k2], v2))));
      else gruppen.unshift(feld([k], v));
    }
    leeren(hauptbereich).append(
      kopf('Fakten', el('button', { class: 'knopf', type: 'button', id: 'fakten-speichern', onclick: async () => {
        for (const f of felder) { let o = werte; for (const k of f.pfadListe.slice(0, -1)) o = o[k]; o[f.pfadListe.at(-1)] = f.input.value; }
        try { await api('/facts', { method: 'PUT', body: werte }); toast('Fakten gespeichert — gelten sofort auf allen Seiten'); } catch (err) { toast(err.message, true); }
      } }, 'Fakten speichern')),
      el('p', { class: 'hinweis' }, 'Die eine Quelle für Telefon, Anschrift, Öffnungszeiten und Links. Ein leerer Wert erscheint auf der Seite als […].'),
      el('div', { class: 'karte' }, gruppen.filter((g) => g.tagName === 'LABEL')), ...gruppen.filter((g) => g.tagName !== 'LABEL'));
  }

  // ---- Handbuch (3.6) -----------------------------------------------------------------------------------
  function ansichtHandbuch() {
    const eintraege = (window.HANDBUCH || []).map((h) => el('details', {}, el('summary', {}, h.titel),
      el('p', { class: 'hinweis' }, h.wann),
      el('h3', {}, 'Schritte'), el('ol', {}, h.schritte.map((s) => el('li', { html: s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') }))),
      el('h3', {}, 'Macht die App von allein'), el('ul', {}, h.automatisch.map((s) => el('li', { html: s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') }))),
      el('h3', {}, 'Fallstricke'), el('ul', {}, h.fallstricke.map((s) => el('li', {}, s)))));
    leeren(hauptbereich).append(kopf('Handbuch'), el('p', { class: 'hinweis' }, 'Jeder Ablauf mit den echten Knopfnamen. Wenn hier etwas nicht stimmt, ist das ein Fehler — bitte melden.'), el('div', { class: 'handbuch' }, eintraege));
  }

  // ---- Router ---------------------------------------------------------------------------------------------
  async function route() {
    const h = location.hash || '#/seiten';
    const [, view, id] = h.match(/^#\/([a-z]+)\/?([^/]*)/) || [];
    window.onbeforeunload = null;
    markiere(view);
    zaehleUngelesen(); // bei jedem Ansichtswechsel — sonst zählt der Badge nur den Stand vom Laden
    try {
      if (view === 'seite' && id) return await ansichtSeite(id);
      const f = { seiten: ansichtSeiten, navigation: ansichtNavigation, medien: ansichtMedien, umleitungen: ansichtUmleitungen, anfragen: ansichtAnfragen, fakten: ansichtFakten, handbuch: ansichtHandbuch }[view];
      if (f) return await f();
      location.hash = '#/seiten';
    } catch (err) { if (err.message !== 'Anmeldung nötig') { leeren(hauptbereich).append(el('div', { class: 'fehler' }, err.message)); } }
  }

  async function start() {
    try {
      const [types, blocks, statuses] = await Promise.all([api('/types'), api('/blocks'), api('/statuses')]);
      stamm.types = types; stamm.statuses = statuses;
      stamm.blocks = Object.fromEntries(blocks.map((b) => [b.name, b]));
    } catch (err) { if (err.message === 'Anmeldung nötig') return; }
    rahmen();
    window.addEventListener('hashchange', route);
    zaehleUngelesen();
    route();
  }

  api('/me').then(start).catch(() => { /* zeigeLogin läuft in api() */ });
})();
