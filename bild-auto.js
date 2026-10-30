/* Karteikasten – Bilder automatisch zu Nomen hinzufügen (Unsplash + Wiktionary-Prüfung)
 * Unsplash-Key liegt als Secret in der Supabase Edge Function "bild-suche". Läuft nur, wenn der Nutzer den Knopf drückt.
 * 1) Wiktionary (en.wiktionary.org) prüft, ob das Wort ein Nomen ist. Tippfehler werden über die
 *    Wiktionary-Suche korrigiert (ähnliches Wort wird akzeptiert).
 * 2) Unsplash (über die Edge Function) liefert ein Foto – nur für echte Nomen, das spart Anfragen.
 * 3) Bild wird verkleinert und in v.img gespeichert (gleiches Format wie manuelle Bilder).
 * Übersetzungen: de / en / pt-BR.
 */
(function () {
  'use strict';
  var PAR = 3, running = false, cancel = false;
  var LANGS = [ // code, Name in Wiktionary (englisch), Anzeigename
    ['de', 'German', 'Deutsch'], ['en', 'English', 'English'], ['fr', 'French', 'Français'],
    ['es', 'Spanish', 'Español'], ['it', 'Italian', 'Italiano'], ['pt', 'Portuguese', 'Português'],
    ['la', 'Latin', 'Latina'], ['nl', 'Dutch', 'Nederlands']
  ];
  var DETECT = [[/deutsch|german|alem/i, 'de'], [/engl|ingl/i, 'en'], [/franz|french|fran[cç]/i, 'fr'], [/span|espa/i, 'es'],
    [/ital/i, 'it'], [/portug/i, 'pt'], [/lat(ein|in)/i, 'la'], [/niederl|dutch|holand|neerl/i, 'nl']];
  var TX = {
    btn: { de: '🖼️ Bilder automatisch', en: '🖼️ Auto images', 'pt-BR': '🖼️ Imagens automáticas' },
    title: { de: 'Bilder automatisch hinzufügen', en: 'Add images automatically', 'pt-BR': 'Adicionar imagens automaticamente' },
    hint: { de: 'Wichtig: Das funktioniert nur bei Nomen (Hund, Haus, Apfel). Verben, Adjektive und Wörter wie „obwohl“ werden übersprungen. Ob ein Wort ein Nomen ist, prüft ein Online-Wörterbuch (Wiktionary); kleine Tippfehler werden dabei erkannt. Die Fotos kommen von Unsplash und passen nicht immer perfekt – du kannst sie danach ändern oder entfernen.', en: 'Important: This only works for nouns (dog, house, apple). Verbs, adjectives and words like “although” are skipped. An online dictionary (Wiktionary) checks whether a word is a noun; small typos are tolerated. Photos come from Unsplash and may not always fit perfectly – you can change or remove them afterwards.', 'pt-BR': 'Importante: isso só funciona com substantivos (cão, casa, maçã). Verbos, adjetivos e palavras como “embora” são ignorados. Um dicionário online (Wiktionary) verifica se a palavra é um substantivo; pequenos erros de digitação são tolerados. As fotos vêm do Unsplash e nem sempre combinam perfeitamente – você pode alterá-las ou removê-las depois.' },
    privacy: { de: 'Dabei werden die Wörter an Wiktionary und Unsplash (USA) gesendet. Anmeldung nötig.', en: 'The words are sent to Wiktionary and Unsplash (USA). Sign-in required.', 'pt-BR': 'As palavras são enviadas ao Wiktionary e ao Unsplash (EUA). É necessário entrar.' },
    col: { de: 'Welche Spalte soll gesucht werden?', en: 'Which column should be searched?', 'pt-BR': 'Qual coluna deve ser pesquisada?' },
    lng: { de: 'Sprache dieser Wörter', en: 'Language of these words', 'pt-BR': 'Idioma dessas palavras' },
    onlyEmpty: { de: 'Nur Vokabeln ohne Bild', en: 'Only words without an image', 'pt-BR': 'Só palavras sem imagem' },
    start: { de: 'Starten', en: 'Start', 'pt-BR': 'Iniciar' },
    stop: { de: 'Abbrechen', en: 'Cancel', 'pt-BR': 'Cancelar' },
    close: { de: 'Schließen', en: 'Close', 'pt-BR': 'Fechar' },
    none: { de: 'Keine Vokabeln zu bearbeiten.', en: 'No words to process.', 'pt-BR': 'Nenhuma palavra para processar.' },
    prog: { de: 'Suche Bilder … ', en: 'Searching images … ', 'pt-BR': 'Procurando imagens … ' },
    done: { de: 'Fertig: {n} Bilder hinzugefügt, {s} übersprungen (kein Nomen oder im Wörterbuch nicht gefunden), {m} Nomen ohne passendes Bild.', en: 'Done: {n} images added, {s} skipped (not a noun or not found in the dictionary), {m} nouns without a fitting image.', 'pt-BR': 'Pronto: {n} imagens adicionadas, {s} ignoradas (não é substantivo ou não encontrado no dicionário), {m} substantivos sem imagem adequada.' },
    full: { de: 'Der Bilderspeicher ist voll. Entferne zuerst ein paar Bilder. Bisher hinzugefügt: {n}.', en: 'Image storage is full. Remove a few images first. Added so far: {n}.', 'pt-BR': 'O armazenamento de imagens está cheio. Remova algumas. Adicionadas: {n}.' },
    net: { de: 'Keine Verbindung zu Wiktionary/Unsplash. Bisher hinzugefügt: {n}.', en: 'Cannot reach Wiktionary/Unsplash. Added so far: {n}.', 'pt-BR': 'Sem conexão com Wiktionary/Unsplash. Adicionadas: {n}.' },
    credit: { de: 'Fotos von Unsplash', en: 'Photos from Unsplash', 'pt-BR': 'Fotos do Unsplash' },
    noSb: { de: 'Bitte zuerst anmelden.', en: 'Please sign in first.', 'pt-BR': 'Entre primeiro.' },
    limit: { de: 'Das Unsplash-Limit ist erreicht. Bitte später weitermachen (Option „Nur ohne Bild“). Bisher hinzugefügt: {n}.', en: 'Unsplash limit reached. Continue later (option “Only without image”). Added so far: {n}.', 'pt-BR': 'Limite do Unsplash atingido. Continue mais tarde (opção “Só sem imagem”). Adicionadas: {n}.' }
  };
  function lang() { var l = window.kkLang; return (l === 'en' || l === 'pt-BR') ? l : 'de'; }
  function t(k, r) { var s = (TX[k] && TX[k][lang()]) || ''; if (r) Object.keys(r).forEach(function (x) { s = s.replace('{' + x + '}', r[x]); }); return s; }
  function api() { return window.kkBildApi || null; }
  function el(tag, a, txt) { var e = document.createElement(tag); Object.keys(a || {}).forEach(function (k) { e.setAttribute(k, a[k]); }); if (txt) e.textContent = txt; return e; }
  function detect(name) { for (var i = 0; i < DETECT.length; i++) if (DETECT[i][0].test(name || '')) return DETECT[i][1]; return ''; }
  function langName(code) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i][0] === code) return LANGS[i][1]; return 'English'; }

  /* ---------- Wort säubern ---------- */
  var ART = /^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|the|a|an|le|la|les|l'|un|une|el|los|las|il|lo|gli|i|uno|una|o|os|as|um|uma|de|het|een)\s+/i;
  function clean(s) {
    s = String(s || '').replace(/\(.*?\)|\[.*?\]/g, ' ').split(/[,;\/|]/)[0].replace(/\s+/g, ' ').trim();
    s = s.replace(/^to\s+/i, function (m) { return m; }); // "to run" bleibt, wird als Verb aussortiert
    s = s.replace(ART, '');
    return s.trim();
  }
  function lev(a, b) {
    var m = [], i, j; for (i = 0; i <= a.length; i++) m[i] = [i];
    for (j = 1; j <= b.length; j++) m[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- Netzwerk ---------- */
  function getJson(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); });
  }
  var W = 'https://en.wiktionary.org/w/api.php?format=json&formatversion=2&origin=*&action=query';
  // Liefert: null (Seite fehlt/Sprache fehlt) oder { title, noun:boolean }
  function wikt(title, lname) {
    return getJson(W + '&prop=revisions&rvprop=content&rvslots=main&redirects=1&titles=' + encodeURIComponent(title)).then(function (d) {
      var p = d.query && d.query.pages && d.query.pages[0];
      if (!p || p.missing || !p.revisions) return null;
      var txt = (p.revisions[0].slots && p.revisions[0].slots.main && p.revisions[0].slots.main.content) || '';
      var i = txt.indexOf('\n==' + lname + '==');
      if (i < 0 && txt.indexOf('==' + lname + '==') === 0) i = 0;
      if (i < 0) return null;
      var rest = txt.slice(i + 1), j = rest.slice(3 + lname.length).search(/\n==[^=]/);
      var sec = j < 0 ? rest : rest.slice(0, j + 3 + lname.length);
      return { title: p.title, noun: /={3,5}\s*(Proper noun|Noun)\s*={3,5}/i.test(sec) };
    });
  }
  // Tippfehler-Suche: ähnliche Wörter aus der Wiktionary-Suche
  function typo(word, lname) {
    return getJson(W.replace('action=query', 'action=query') + '&list=search&srlimit=5&srinfo=suggestion&srprop=&srsearch=' + encodeURIComponent(word)).then(function (d) {
      var c = [], q = d.query || {};
      if (q.searchinfo && q.searchinfo.suggestion) c.push(q.searchinfo.suggestion);
      (q.search || []).forEach(function (x) { c.push(x.title); });
      var max = Math.max(1, Math.floor(word.length * 0.3)), seen = {};
      c = c.filter(function (x) { x = x.replace(/<[^>]+>/g, ''); var k = x.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return lev(k, word.toLowerCase()) <= max; }).slice(0, 3);
      return c.reduce(function (p, x) { return p.then(function (found) { return found || wikt(x, lname); }); }, Promise.resolve(null));
    });
  }
  function resolve(word, lname) {
    var vars = [word, cap(word), word.toLowerCase()].filter(function (x, i, a) { return a.indexOf(x) === i; });
    return vars.reduce(function (p, v) { return p.then(function (f) { return f || wikt(v, lname); }); }, Promise.resolve(null))
      .then(function (f) { return f || typo(word, lname); });
  }
  // Unsplash über die Edge Function; wirft Error('limit') bei Limit
  function unsplash(q, alt) {
    var sb = window.kkGetSb && window.kkGetSb();
    return sb.functions.invoke('bild-suche', { body: { action: 'search', q: q, alt: alt } }).then(function (res) {
      if (res.error) { var c = res.error.context; throw new Error(c && c.status === 429 ? 'limit' : 'fn'); }
      return (res.data && res.data.result) || null;
    });
  }

  /* ---------- Hauptlauf ---------- */
  function run(opts, status, bar) {
    var A = api(), sb = window.kkGetSb && window.kkGetSb();
    if (!A || !sb || !sb.functions) { status.textContent = t('noSb'); return Promise.resolve(); }
    var lname = langName(opts.code);
    var items = A.words().filter(function (w) { return !(opts.onlyEmpty && w.hasImg) && clean(opts.col === 'a' ? w.a : w.b); });
    if (!items.length) { status.textContent = t('none'); return Promise.resolve(); }
    running = true; cancel = false;
    var added = 0, skipped = 0, miss = 0, done = 0, next = 0, stopMsg = '';
    bar.max = items.length; bar.value = 0; bar.style.display = '';

    function one(w) {
      var word = clean(opts.col === 'a' ? w.a : w.b);
      if (!word || word.split(' ').length > 2 || /^to\s/i.test(word)) { skipped++; return Promise.resolve(); }
      return resolve(word, lname).then(function (f) {
        if (!f || !f.noun) { skipped++; return; }
        var other = clean(opts.col === 'a' ? w.b : w.a);
        return unsplash(f.title, other).then(function (h) {
          if (!h) { miss++; return; }
          return fetch(h.url).then(function (r) { if (!r.ok) throw new Error('img'); return r.blob(); })
            .then(function (b) { return A.setImage(w.idx, b); })
            .then(function (ok) {
              if (ok === 'full') stopMsg = t('full', { n: added });
              else if (ok) { added++; sb.functions.invoke('bild-suche', { body: { action: 'track', location: h.location } }); }
              else miss++;
            });
        });
      }).catch(function (e) { if (!stopMsg) stopMsg = t(e && e.message === 'limit' ? 'limit' : 'net', { n: added }); });
    }
    function worker() {
      if (cancel || stopMsg || next >= items.length) return Promise.resolve();
      var w = items[next++];
      return one(w).then(function () {
        done++; bar.value = done; status.textContent = t('prog') + done + ' / ' + items.length;
        return worker();
      });
    }
    var ws = []; for (var k = 0; k < PAR; k++) ws.push(worker());
    return Promise.all(ws).then(function () {
      running = false; A.refresh();
      status.textContent = stopMsg || t('done', { n: added, s: skipped, m: miss });
    });
  }

  /* ---------- Fenster ---------- */
  function open() {
    if (document.getElementById('kkBildOv')) return;
    var A = api(), info = (A && A.info && A.info()) || { langA: 'A', langB: 'B' };
    var ov = el('div', { id: 'kkBildOv', style: 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px' });
    var box = el('div', { style: 'background:var(--bg,#fbf6ea);color:var(--ink,#222);max-width:460px;width:100%;max-height:92vh;overflow:auto;border-radius:14px;padding:18px;box-shadow:0 10px 40px rgba(0,0,0,.3)' });
    var h = el('h3', { style: 'margin:0 0 8px' }, t('title'));
    var p = el('p', { style: 'font-size:.9em;margin:0 0 6px;line-height:1.4' }, t('hint'));
    var pr = el('p', { style: 'font-size:.8em;opacity:.75;margin:0 0 12px' }, t('privacy'));
    var l1 = el('label', { style: 'display:block;font-size:.9em;margin-bottom:4px' }, t('col'));
    var sc = el('select', { style: 'width:100%;margin-bottom:10px' });
    [['b', info.langB], ['a', info.langA]].forEach(function (o) { var op = el('option', { value: o[0] }, o[1]); sc.appendChild(op); });
    var l2 = el('label', { style: 'display:block;font-size:.9em;margin-bottom:4px' }, t('lng'));
    var sl = el('select', { style: 'width:100%;margin-bottom:10px' });
    LANGS.forEach(function (x) { sl.appendChild(el('option', { value: x[0] }, x[2])); });
    function guess() { sl.value = detect(sc.value === 'a' ? info.langA : info.langB) || sl.value; }
    sc.addEventListener('change', guess); sl.value = 'en'; guess();
    var lab = el('label', { style: 'display:flex;gap:8px;align-items:center;margin-bottom:12px' });
    var cb = el('input', { type: 'checkbox' }); cb.checked = true; lab.appendChild(cb); lab.appendChild(document.createTextNode(t('onlyEmpty')));
    var bar = el('progress', { style: 'width:100%;display:none' });
    var st = el('div', { style: 'font-size:.9em;min-height:1.4em;margin:6px 0' });
    var credit = el('div', { style: 'font-size:.75em;opacity:.7;margin-bottom:10px' }, t('credit'));
    var row = el('div', { style: 'display:flex;gap:8px;justify-content:flex-end' });
    var go = el('button', { type: 'button', class: 'btn-outline btn-rust' }, t('start'));
    var cl = el('button', { type: 'button', class: 'btn-outline' }, t('close'));
    go.addEventListener('click', function () {
      if (running) { cancel = true; return; }
      go.textContent = t('stop'); [cb, sc, sl].forEach(function (x) { x.disabled = true; });
      run({ onlyEmpty: cb.checked, col: sc.value, code: sl.value }, st, bar).then(function () {
        go.textContent = t('start'); [cb, sc, sl].forEach(function (x) { x.disabled = false; });
      });
    });
    cl.addEventListener('click', function () { cancel = true; ov.remove(); });
    row.appendChild(go); row.appendChild(cl);
    [h, p, pr, l1, sc, l2, sl, lab, bar, st, credit, row].forEach(function (x) { box.appendChild(x); });
    ov.appendChild(box); document.body.appendChild(ov);
  }

  function mount() {
    var anchor = document.getElementById('kkAIBulkBtn');
    if (!anchor || document.getElementById('kkBildBtn')) return;
    var b = el('button', { type: 'button', class: 'btn-outline btn-rust', id: 'kkBildBtn' }, t('btn'));
    b.addEventListener('click', open);
    anchor.parentNode.insertBefore(b, anchor.nextSibling);
  }
  function init() { mount(); new MutationObserver(function () { mount(); var b = document.getElementById('kkBildBtn'); if (b) b.textContent = t('btn'); }).observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.kkBildOpen = open;
})();
