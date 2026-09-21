import { html, raw, reihe, escapeAttr } from './_util.js';

/**
 * Formular — die eine Handlung muss irgendwo landen (3.7). Felder aus dem Schema,
 * Honigtopf gegen Bots, Datenschutzhinweis mit Link, nie mehr Felder als nötig.
 * Der Endpunkt speichert ZUERST, benachrichtigt DANN. Mit JavaScript bleibt der
 * Besucher auf der Seite; ohne bekommt er eine Danke-Seite vom Server.
 */
const TYPEN = new Set(['text', 'email', 'tel', 'textarea']);

export default {
  name: 'form',
  label: 'Formular',
  schema: {
    name:   { type: 'text',     default: 'kontakt', label: 'Formularname (technisch, nur a-z und Bindestrich)' },
    titel:  { type: 'text',     default: 'Schreib uns', label: 'Überschrift' },
    text:   { type: 'longtext', default: 'Fahrzeug, Tankgröße, deine Frage. Wir melden uns.', label: 'Ein Satz darüber (optional)' },
    felder: { type: 'list', label: 'Felder — nie mehr als nötig',
              default: [
                { name: 'name', label: 'Dein Name', typ: 'text', pflicht: true },
                { name: 'email', label: 'Deine E-Mail', typ: 'email', pflicht: true },
                { name: 'nachricht', label: 'Deine Frage', typ: 'textarea', pflicht: true },
              ],
              felder: { name: 'text', label: 'text', typ: 'text', pflicht: 'bool' } },
    knopf:  { type: 'text',     default: 'Abschicken', label: 'Knopf' },
    danke:  { type: 'longtext', default: 'Danke, deine Anfrage ist angekommen. Wir melden uns.', label: 'Text nach dem Abschicken' },
  },
  css: `
    .form__box { max-width: 62ch; }
    .form__titel { font-size: clamp(22px, 2.6vw, 30px); margin-bottom: 8px; }
    .form__intro { color: var(--text-muted); margin-bottom: 20px; }
    .form__feld { display: block; margin-bottom: 14px; }
    .form__feld span { display: block; font-size: 14px; font-weight: 600; margin-bottom: 5px; }
    .form__feld input, .form__feld textarea { width: 100%; font: inherit; font-size: 16px; padding: 11px 13px;
      border: 1px solid var(--grund-3); border-radius: 10px; background: #fff; color: var(--text); }
    .form__feld textarea { min-height: 130px; resize: vertical; }
    .form__feld input:focus-visible, .form__feld textarea:focus-visible { outline: 3px solid var(--signal); outline-offset: 1px; }
    .form__honig { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
    .form__hinweis { font-size: 13.5px; color: var(--text-muted); margin: 6px 0 16px; }
    .form__knopf { font: inherit; font-weight: 700; padding: 14px 26px; border-radius: 999px; border: 0;
      background: var(--handlung); color: var(--handlung-text); cursor: pointer; }
    .form__knopf[disabled] { opacity: .6; cursor: wait; }
    .form__danke { margin-top: 16px; padding: 14px 16px; border-radius: 10px; background: var(--mint); font-weight: 600; }
    .form__fehler { margin-top: 16px; padding: 14px 16px; border-radius: 10px; background: #FDEEEC; }
  `,
  pruefe(data) {
    const fehler = [];
    if (!/^[a-z0-9-]{1,40}$/.test(String(data.name || ''))) fehler.push('Formularname: nur a-z, 0-9 und Bindestrich');
    for (const f of data.felder || []) {
      if (!/^[a-z0-9_]{1,40}$/.test(String(f.name || ''))) fehler.push(`Feldname ungültig: „${f.name}"`);
      if (!TYPEN.has(f.typ)) fehler.push(`Feldtyp ungültig: „${f.typ}" (text, email, tel, textarea)`);
    }
    return fehler;
  },
  render(data) {
    const name = /^[a-z0-9-]{1,40}$/.test(String(data.name || '')) ? data.name : 'kontakt';
    const felder = (data.felder || []).filter((f) => TYPEN.has(f.typ)).map((f) => {
      const id = `f-${name}-${f.name}`;
      const eingabe = f.typ === 'textarea'
        ? html`<textarea id="${id}" name="${f.name}" ${raw(f.pflicht ? 'required' : '')}></textarea>`
        : html`<input id="${id}" type="${f.typ}" name="${f.name}" ${raw(f.pflicht ? 'required' : '')} autocomplete="${f.typ === 'email' ? 'email' : f.typ === 'tel' ? 'tel' : 'on'}">`;
      return html`<label class="form__feld" for="${id}"><span>${f.label}${f.pflicht ? ' *' : ''}</span>${eingabe}</label>`;
    });
    const script = raw(`<script>(function(){document.querySelectorAll('form[data-motor-form]').forEach(function(f){f.addEventListener('submit',async function(e){e.preventDefault();var k=f.querySelector('.form__knopf'),d=f.querySelector('.form__danke'),x=f.querySelector('.form__fehler');k.disabled=true;try{var r=await fetch(f.action,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(f)))});if(!r.ok)throw new Error(r.status);f.querySelectorAll('.form__feld').forEach(function(el){el.hidden=true});f.querySelector('.form__hinweis').hidden=true;k.hidden=true;d.hidden=false;x.hidden=true}catch(err){x.hidden=false;k.disabled=false}})})})();</script>`);
    return html`
      <section class="section form"><div class="container"><div class="form__box">
        ${data.titel ? html`<h2 class="form__titel">${data.titel}</h2>` : ''}
        ${data.text ? html`<p class="form__intro">${data.text}</p>` : ''}
        <form class="form__form" method="post" action="/api/form/${raw(escapeAttr(name))}" data-motor-form>
          <input type="hidden" name="_seite" value="${data.seite || ''}">
          <div class="form__honig" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
          ${reihe(felder, '')}
          <p class="form__hinweis">Mit dem Abschicken stimmst du zu, dass wir deine Angaben verwenden, um deine Anfrage zu beantworten. <a href="/datenschutz/">Datenschutz</a></p>
          <button class="form__knopf" type="submit">${data.knopf || 'Abschicken'}</button>
          <p class="form__danke" hidden>${data.danke}</p>
          <p class="form__fehler" hidden>Das hat gerade nicht geklappt. Ruf uns an: {{facts.telefon}}</p>
        </form>
      </div></div></section>
      ${script}`;
  },
};
