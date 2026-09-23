/**
 * Schorni, der Assistent (Stufe 7). Ein Knopf unten links, ein Fenster, ein Gespräch.
 * Vanilla JS, keine Abhängigkeit, Farben nur aus den Token der Seite. Meldet der Motor
 * „nicht bereit", zeigt sich der Knopf gar nicht — die Seite bleibt, wie sie ist (P6).
 */
(function () {
  'use strict';
  if (window.__schorniAssistent) return;
  window.__schorniAssistent = true;

  var CSS = '\
.sa-knopf{position:fixed;left:18px;bottom:18px;z-index:60;display:flex;align-items:center;gap:10px;padding:8px 18px 8px 8px;border:0;border-radius:999px;background:var(--handlung,#0B3B5C);color:var(--handlung-text,#fff);font:700 15px/1.2 var(--font-body,Poppins,system-ui,sans-serif);cursor:pointer;box-shadow:0 10px 28px rgba(11,59,92,.28)}\
.sa-knopf img{width:36px;height:36px;border-radius:50%;background:var(--mint,#E6F8F5);display:block}\
.sa-knopf:focus-visible{outline:3px solid var(--signal,#00C2A8);outline-offset:3px}\
.sa-fenster{position:fixed;left:18px;bottom:18px;z-index:61;width:min(400px,calc(100vw - 36px));height:min(640px,calc(100dvh - 36px));display:flex;flex-direction:column;background:var(--grund-2,#FAF7F2);color:var(--text,#16242F);border:1px solid var(--grund-3,#E3DCCF);border-radius:18px;box-shadow:0 24px 60px rgba(11,59,92,.28);font-family:var(--font-body,Poppins,system-ui,sans-serif);overflow:hidden}\
.sa-knopf[hidden],.sa-fenster[hidden]{display:none}\
@media (max-width:600px){.sa-fenster{left:0;bottom:0;width:100vw;height:100dvh;border-radius:0}}\
.sa-kopf{display:flex;align-items:center;gap:11px;padding:12px 14px;background:var(--handlung,#0B3B5C);color:#fff}\
.sa-kopf img{width:38px;height:38px;border-radius:50%;background:var(--mint,#E6F8F5)}\
.sa-kopf b{display:block;font-size:15px;line-height:1.2}\
.sa-kopf small{display:flex;align-items:center;gap:6px;font-size:12px;opacity:.85}\
.sa-punkt{width:7px;height:7px;border-radius:50%;background:var(--signal,#00C2A8)}\
.sa-zu{margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:999px;width:32px;height:32px;cursor:pointer;font-size:18px;line-height:1}\
.sa-zu:focus-visible{outline:2px solid var(--signal,#00C2A8);outline-offset:2px}\
.sa-strom{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:12px}\
.sa-nachricht{display:flex;gap:8px;max-width:92%}\
.sa-nachricht--du{align-self:flex-end;flex-direction:row-reverse}\
.sa-tick{width:26px;height:26px;border-radius:50%;flex:none;background:var(--mint,#E6F8F5);overflow:hidden}\
.sa-tick img{width:26px;height:26px;display:block}\
.sa-nachricht--du .sa-tick{background:var(--akzent,#1A5A8A);color:#fff;font:700 11px/26px var(--font-body,sans-serif);text-align:center}\
.sa-blase{background:#fff;border:1px solid var(--grund-3,#E3DCCF);border-radius:13px;border-top-left-radius:4px;padding:11px 13px;font-size:14.5px;line-height:1.5;min-width:0;overflow-wrap:anywhere}\
.sa-nachricht--du .sa-blase{background:var(--handlung,#0B3B5C);color:#fff;border-color:transparent;border-radius:13px;border-top-right-radius:4px;font-weight:500}\
.sa-blase p{margin:0 0 8px}.sa-blase p:last-child{margin:0}.sa-blase ul{margin:0 0 8px;padding-left:18px}.sa-blase li{margin-bottom:3px}.sa-blase strong{color:var(--handlung,#0B3B5C)}\
.sa-nachricht--du .sa-blase strong{color:#fff}\
.sa-pflicht{margin-top:10px;padding:9px 11px;border-radius:9px;background:var(--mint,#E6F8F5);border:1px solid var(--signal,#00C2A8);font-size:12.5px;font-style:italic}\
.sa-quellen{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:11.5px;color:var(--text-muted,#5B6B77)}\
.sa-quellen a,.sa-quellen span.sa-q{display:inline-block;font-size:12px;font-weight:600;color:var(--handlung,#0B3B5C);background:var(--grund-2,#FAF7F2);border:1px solid var(--grund-3,#E3DCCF);border-radius:999px;padding:3px 10px;text-decoration:none}\
.sa-tippen{display:flex;gap:4px;padding:4px 2px}.sa-tippen i{width:6px;height:6px;border-radius:50%;background:var(--text-muted,#5B6B77);animation:sa-bob 1.2s infinite}.sa-tippen i:nth-child(2){animation-delay:.18s}.sa-tippen i:nth-child(3){animation-delay:.36s}\
@keyframes sa-bob{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}\
@media (prefers-reduced-motion:reduce){.sa-tippen i{animation:none;opacity:.6}}\
.sa-chips{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 10px}\
.sa-chip{font:500 13px/1.3 var(--font-body,sans-serif);background:#fff;color:var(--text,#16242F);border:1px solid var(--grund-3,#E3DCCF);padding:7px 12px;border-radius:999px;cursor:pointer;text-align:left}\
.sa-chip:hover{background:var(--handlung,#0B3B5C);color:#fff;border-color:var(--handlung,#0B3B5C)}\
.sa-chip:focus-visible{outline:2px solid var(--signal,#00C2A8);outline-offset:2px}\
.sa-eingabe{display:flex;gap:8px;align-items:flex-end;padding:10px 12px;border-top:1px solid var(--grund-3,#E3DCCF);background:#fff}\
.sa-eingabe textarea{flex:1;resize:none;min-height:42px;max-height:120px;padding:10px 12px;border:1px solid var(--grund-3,#E3DCCF);border-radius:12px;font:inherit;font-size:15px;line-height:1.4;color:var(--text,#16242F);background:var(--grund-2,#FAF7F2)}\
.sa-eingabe textarea:focus-visible{outline:3px solid var(--signal,#00C2A8);outline-offset:1px}\
.sa-senden{width:42px;height:42px;border:0;border-radius:50%;background:var(--signal,#00C2A8);color:#06232B;font-size:18px;cursor:pointer;flex:none}\
.sa-senden[disabled]{opacity:.5;cursor:default}\
.sa-fuss{padding:7px 14px 9px;font-size:11.5px;color:var(--text-muted,#5B6B77);background:#fff;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}\
.sa-fuss a{color:var(--handlung,#0B3B5C)}\
.sa-fehler{border-color:#E4A79E;background:#FDEEEC}\
.sa-einwilligung{margin:16px 14px;padding:14px;border-radius:12px;background:#fff;border:1px solid var(--grund-3,#E3DCCF);font-size:14px;line-height:1.5}\
.sa-einwilligung p{margin:0 0 10px}.sa-einwilligung .sa-ok{font:700 14px var(--font-body,sans-serif);border:0;border-radius:999px;padding:10px 18px;background:var(--handlung,#0B3B5C);color:#fff;cursor:pointer}\
.sa-einwilligung .sa-ok:focus-visible{outline:3px solid var(--signal,#00C2A8);outline-offset:2px}\
.sa-fuss button{background:none;border:0;padding:0;font:inherit;color:var(--handlung,#0B3B5C);text-decoration:underline;cursor:pointer}';

  var BASIS = '/api/chat';
  var config = null, verlauf = [], laeuft = false;
  var wurzel, fenster, strom, chips, eingabe, senden, knopf;

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /** Markdown-light: **fett**, Spiegelstriche, Absätze. Erst escapen, dann formen. */
  function markdown(text) {
    var zeilen = esc(text).split(/\r?\n/), html = '', liste = false, absatz = [];
    function schliesse() { if (absatz.length) { html += '<p>' + absatz.join('<br>') + '</p>'; absatz = []; } }
    zeilen.forEach(function (z) {
      var m = z.match(/^\s*[-•*]\s+(.*)$/);
      if (m) { schliesse(); if (!liste) { html += '<ul>'; liste = true; } html += '<li>' + m[1] + '</li>'; return; }
      if (liste) { html += '</ul>'; liste = false; }
      if (!z.trim()) { schliesse(); return; }
      absatz.push(z);
    });
    if (liste) html += '</ul>';
    schliesse();
    return html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  function scrolle() { strom.scrollTop = strom.scrollHeight; }

  function nachricht(wer, html) {
    var n = el('div', 'sa-nachricht' + (wer === 'du' ? ' sa-nachricht--du' : ''));
    var tick = el('div', 'sa-tick');
    if (wer === 'du') tick.textContent = 'DU'; else { var img = el('img'); img.src = '/img/schorni-logo.png'; img.alt = ''; tick.appendChild(img); }
    var blase = el('div', 'sa-blase'); blase.innerHTML = html;
    n.appendChild(tick); n.appendChild(blase); strom.appendChild(n); scrolle();
    return blase;
  }

  function zeigeChips() {
    chips.innerHTML = '';
    (config.vorschlaege || []).forEach(function (f) {
      var b = el('button', 'sa-chip', f); b.type = 'button';
      b.addEventListener('click', function () { frage(f); });
      chips.appendChild(b);
    });
  }

  function bereit(schalten) { laeuft = !schalten; senden.disabled = !schalten; eingabe.disabled = !schalten; }

  async function frage(text) {
    text = String(text || '').trim();
    if (!text || laeuft) return;
    bereit(false); chips.innerHTML = ''; eingabe.value = '';
    nachricht('du', '<p>' + esc(text) + '</p>');
    var blase = nachricht('bot', '<div class="sa-tippen"><i></i><i></i><i></i></div>');
    var antwort = '';
    try {
      var r = await fetch(BASIS, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' }, body: JSON.stringify({ frage: text, verlauf: verlauf.slice(-6) }) });
      if (!r.ok || !r.body) { var d = await r.json().catch(function () { return {}; }); throw new Error(d.error || ('Status ' + r.status)); }
      var leser = r.body.getReader(), dec = new TextDecoder(), rest = '', fertig = null;
      while (true) {
        var teil = await leser.read(); if (teil.done) break;
        rest += dec.decode(teil.value, { stream: true });
        var zeilen = rest.split('\n'); rest = zeilen.pop();
        zeilen.forEach(function (z) {
          if (!z.trim()) return;
          var ev; try { ev = JSON.parse(z); } catch (e) { return; }
          if (ev.typ === 'delta') { antwort += ev.text; blase.innerHTML = markdown(antwort); scrolle(); }
          else if (ev.typ === 'fertig') fertig = ev;
          else if (ev.typ === 'fehler') throw new Error(ev.text);
        });
      }
      if (!fertig) throw new Error('Keine Antwort');
      antwort = fertig.antwort || antwort;
      blase.innerHTML = markdown(antwort);
      if (fertig.hinweis) { var h = el('div', 'sa-pflicht', fertig.pflichtsatz || ''); blase.appendChild(h); }
      if (fertig.quellen && fertig.quellen.length) {
        var q = el('div', 'sa-quellen'); q.appendChild(el('span', null, 'Quelle:'));
        fertig.quellen.forEach(function (s) { var a = s.href ? el('a', null, s.titel) : el('span', 'sa-q', s.titel); if (s.href) a.href = s.href; q.appendChild(a); });
        blase.appendChild(q);
      }
      verlauf.push({ rolle: 'user', text: text }, { rolle: 'assistant', text: antwort });
    } catch (err) {
      blase.classList.add('sa-fehler');
      blase.innerHTML = '<p>' + esc((err && err.message) || 'Gerade klappt das nicht.') + '</p><p>Ruf uns an: <strong>' + esc(config.telefon || '') + '</strong></p>';
    } finally { bereit(true); scrolle(); eingabe.focus(); }
  }

  function baue() {
    var style = el('style'); style.textContent = CSS; document.head.appendChild(style);
    wurzel = el('div'); wurzel.id = 'schorni-assistent';
    knopf = el('button', 'sa-knopf'); knopf.type = 'button'; knopf.setAttribute('aria-haspopup', 'dialog');
    var kimg = el('img'); kimg.src = '/img/schorni-logo.png'; kimg.alt = ''; knopf.appendChild(kimg); knopf.appendChild(el('span', null, 'Frag ' + config.name));
    fenster = el('div', 'sa-fenster'); fenster.hidden = true; fenster.setAttribute('role', 'dialog'); fenster.setAttribute('aria-modal', 'false'); fenster.setAttribute('aria-label', config.name + ', der Assistent');
    var kopf = el('div', 'sa-kopf'); var himg = el('img'); himg.src = '/img/schorni-logo.png'; himg.alt = '';
    var wer = el('div'); wer.appendChild(el('b', null, config.name)); var st = el('small'); st.appendChild(el('span', 'sa-punkt')); st.appendChild(document.createTextNode('KI-Assistent · antwortet nur aus dieser Website')); wer.appendChild(st);
    var zu = el('button', 'sa-zu', '×'); zu.type = 'button'; zu.setAttribute('aria-label', 'Schließen');
    kopf.appendChild(himg); kopf.appendChild(wer); kopf.appendChild(zu);
    strom = el('div', 'sa-strom'); strom.setAttribute('role', 'log'); strom.setAttribute('aria-live', 'polite');
    chips = el('div', 'sa-chips');
    var form = el('form', 'sa-eingabe');
    eingabe = el('textarea'); eingabe.rows = 1; eingabe.placeholder = config.platzhalter || 'Deine Frage …'; eingabe.setAttribute('aria-label', 'Deine Frage'); eingabe.maxLength = 400;
    senden = el('button', 'sa-senden', '➤'); senden.type = 'submit'; senden.setAttribute('aria-label', 'Abschicken');
    form.appendChild(eingabe); form.appendChild(senden);
    form.addEventListener('submit', function (e) { e.preventDefault(); frage(eingabe.value); });
    eingabe.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); frage(eingabe.value); } });
    var fuss = el('div', 'sa-fuss'); fuss.appendChild(el('span', null, config.fusszeile || '')); fuss.appendChild(el('span', null, '·'));
    var ds = el('a', null, 'Datenschutz'); ds.href = config.datenschutzHref || '/datenschutz/'; fuss.appendChild(ds);
    var widerruf = el('button', 'sa-widerruf', 'Einwilligung zurücknehmen'); widerruf.type = 'button'; widerruf.hidden = true;
    widerruf.addEventListener('click', function () { setzeEinwilligung(false); strom.innerHTML = ''; chips.innerHTML = ''; verlauf = []; zeigeStart(); });
    fuss.appendChild(el('span', null, '·')); fuss.appendChild(widerruf);
    fenster.appendChild(kopf); fenster.appendChild(strom); fenster.appendChild(chips); fenster.appendChild(form); fenster.appendChild(fuss);
    wurzel.appendChild(knopf); wurzel.appendChild(fenster); document.body.appendChild(wurzel);

    /** Einwilligung (Art. 6 Abs. 1 lit. a DSGVO): die Frage geht an den KI-Anbieter. Gemerkt nur im eigenen Browser. */
    function hatEinwilligung() { try { return localStorage.getItem('sa-einwilligung') === '1'; } catch (e) { return false; } }
    function setzeEinwilligung(ja) { try { if (ja) localStorage.setItem('sa-einwilligung', '1'); else localStorage.removeItem('sa-einwilligung'); } catch (e) { /* ohne Speicher gilt sie nur für dieses Fenster */ } widerruf.hidden = !ja; }
    var einwilligungOffen = false;
    function zeigeStart() {
      strom.innerHTML = '';
      nachricht('bot', markdown(config.begruessung + '\n\n' + (config.kennt || '')));
      if (hatEinwilligung() || einwilligungOffen) { widerruf.hidden = false; zeigeChips(); bereit(true); return; }
      bereit(false); chips.innerHTML = '';
      var box = el('div', 'sa-einwilligung'); box.id = 'sa-einwilligung';
      box.appendChild(el('p', null, 'Deine Fragen werden zur Beantwortung an unseren KI-Anbieter (Anthropic, USA) übermittelt. Bitte gib keine persönlichen Daten ein. Wir speichern Frage und Antwort ohne Bezug zu dir. Mehr dazu unter Datenschutz.'));
      var okKnopf = el('button', 'sa-ok', 'Einverstanden, los geht\'s'); okKnopf.type = 'button';
      okKnopf.addEventListener('click', function () { einwilligungOffen = true; setzeEinwilligung(true); box.remove(); zeigeChips(); bereit(true); eingabe.focus(); });
      box.appendChild(okKnopf); strom.appendChild(box); scrolle();
    }
    function oeffne() { fenster.hidden = false; knopf.hidden = true; if (!strom.childElementCount) zeigeStart(); if (!eingabe.disabled) eingabe.focus(); }
    function schliesse() { fenster.hidden = true; knopf.hidden = false; knopf.focus(); }
    knopf.addEventListener('click', oeffne); zu.addEventListener('click', schliesse);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !fenster.hidden) schliesse(); });
  }

  fetch(BASIS + '/status', { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (s) { if (!s || !s.bereit) return; config = s; baue(); })
    .catch(function () { /* still: ohne Assistent bleibt die Seite, wie sie ist */ });
})();
