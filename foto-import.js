/* Karteikasten – Foto-Import: Schulbuch-Foto -> Vokabeln
 * Ablauf: Foto wählen -> im Browser verkleinern (< ~700 KB) -> Supabase Edge Function "ocr-vokabeln"
 * (dort liegt der OCR.space-Key als Secret) -> Zeilen in 2 Spalten teilen -> Vorschau -> in Liste einfügen.
 * Der API-Key steht NIE in dieser Datei.
 * Übersetzungen: de / en / pt-BR (eigene Tabelle unten, nutzt window.kkLang).
 */
(function () {
  'use strict';

  var FUNCTION_NAME = 'ocr-vokabeln';
  var MAX_BYTES = 700 * 1024;   // Ziel nach Komprimierung (OCR.space Free: max. 1 MB)
  var MAX_SIDE = 1800;          // längste Bildkante in px
  var MIN_SIDE = 900;           // darunter nicht weiter verkleinern

  /* ---------- Übersetzungen ---------- */
  var TX = {
    btn: { de: '📷 Foto → Vokabeln', en: '📷 Photo → vocab', 'pt-BR': '📷 Foto → vocabulário' },
    title: { de: 'Vokabeln aus Foto', en: 'Vocab from photo', 'pt-BR': 'Vocabulário a partir de foto' },
    hint: { de: 'Fotografiere eine Vokabelseite im Schulbuch (zwei Spalten, gerade und gut beleuchtet). Die Wörter werden erkannt und du kannst sie vor dem Einfügen prüfen.', en: 'Take a photo of a vocabulary page in your textbook (two columns, straight and well lit). The words are recognised and you can check them before adding.', 'pt-BR': 'Tire uma foto de uma página de vocabulário do livro (duas colunas, reta e bem iluminada). As palavras são reconhecidas e você pode conferi-las antes de adicionar.' },
    camera: { de: 'Foto aufnehmen', en: 'Take photo', 'pt-BR': 'Tirar foto' },
    pick: { de: 'Bild auswählen', en: 'Choose image', 'pt-BR': 'Escolher imagem' },
    close: { de: 'Schließen', en: 'Close', 'pt-BR': 'Fechar' },
    prep: { de: 'Bild wird verkleinert …', en: 'Shrinking image …', 'pt-BR': 'Reduzindo a imagem …' },
    scan: { de: 'Text wird erkannt … (kann bis zu 30 Sekunden dauern)', en: 'Recognising text … (can take up to 30 seconds)', 'pt-BR': 'Reconhecendo texto … (pode levar até 30 segundos)' },
    notImg: { de: 'Das ist keine Bilddatei.', en: 'This is not an image file.', 'pt-BR': 'Este não é um arquivo de imagem.' },
    tooBig: { de: 'Das Bild konnte nicht klein genug gemacht werden. Bitte nimm ein neues Foto mit weniger Hintergrund auf.', en: 'The image could not be made small enough. Please take a new photo with less background.', 'pt-BR': 'Não foi possível reduzir a imagem o bastante. Tire outra foto com menos fundo.' },
    noSb: { de: 'Keine Verbindung zum Server. Bitte melde dich an und versuche es erneut.', en: 'No connection to the server. Please sign in and try again.', 'pt-BR': 'Sem conexão com o servidor. Entre na sua conta e tente de novo.' },
    fail: { de: 'Texterkennung fehlgeschlagen: ', en: 'Text recognition failed: ', 'pt-BR': 'Falha no reconhecimento de texto: ' },
    nothing: { de: 'Es wurde kein Text erkannt. Probiere ein schärferes, helleres Foto.', en: 'No text was found. Try a sharper, brighter photo.', 'pt-BR': 'Nenhum texto foi encontrado. Tente uma foto mais nítida e clara.' },
    found: { de: 'Gefundene Vokabeln – bitte prüfen und korrigieren:', en: 'Words found – please check and correct:', 'pt-BR': 'Palavras encontradas – confira e corrija:' },
    swap: { de: 'Spalten tauschen', en: 'Swap columns', 'pt-BR': 'Trocar colunas' },
    add: { de: 'Ausgewählte hinzufügen', en: 'Add selected', 'pt-BR': 'Adicionar selecionadas' },
    added: { de: ' Vokabeln hinzugefügt.', en: ' words added.', 'pt-BR': ' palavras adicionadas.' },
    dupes: { de: 'Alle Einträge sind schon in der Liste.', en: 'All entries are already in the list.', 'pt-BR': 'Todas as entradas já estão na lista.' },
    noList: { de: 'Öffne zuerst eine Liste.', en: 'Open a list first.', 'pt-BR': 'Abra uma lista primeiro.' },
    selAll: { de: 'Alle', en: 'All', 'pt-BR': 'Todas' },
    privacy: { de: 'Hinweis: Das Foto wird zur Texterkennung an OCR.space gesendet und nicht von uns gespeichert.', en: 'Note: the photo is sent to OCR.space for text recognition and is not stored by us.', 'pt-BR': 'Aviso: a foto é enviada ao OCR.space para reconhecimento de texto e não é armazenada por nós.' }
  };
  function lang() { var l = window.kkLang; return l === 'en' || l === 'pt-BR' ? l : 'de'; }
  function t(k) { var o = TX[k]; return o ? (o[lang()] || o.de) : k; }

  /* ---------- Hilfen ---------- */
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }
  function api() { return window.kkFotoImportApi || null; }

  /* ---------- Bild verkleinern ---------- */
  function loadBitmap(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return viaImg(file); });
    }
    return viaImg(file);
  }
  function viaImg(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); res(img); };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('img')); };
      img.src = url;
    });
  }
  function toBlob(canvas, q) {
    return new Promise(function (res) { canvas.toBlob(res, 'image/jpeg', q); });
  }
  function shrink(file) {
    return loadBitmap(file).then(function (bmp) {
      var w0 = bmp.width, h0 = bmp.height, side = Math.min(MAX_SIDE, Math.max(w0, h0)), q = 0.82;
      var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      function attempt() {
        var sc = side / Math.max(w0, h0), w = Math.round(w0 * sc), h = Math.round(h0 * sc);
        canvas.width = w; canvas.height = h;
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(bmp, 0, 0, w, h);
        return toBlob(canvas, q).then(function (blob) {
          if (!blob) throw new Error('blob');
          if (blob.size <= MAX_BYTES) return blob;
          if (q > 0.5) { q -= 0.1; return attempt(); }          // erst Qualität senken
          if (side > MIN_SIDE) { side = Math.round(side * 0.85); q = 0.7; return attempt(); } // dann Größe
          throw new Error('toobig');
        });
      }
      return attempt();
    });
  }
  function blobToDataUrl(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(blob);
    });
  }

  /* ---------- Zeilen -> Vokabelpaare ---------- */
  // lines: [{ h: Zeilenhöhe, words: [[text, left, width], ...] }]
  function pairsFromLines(lines) {
    // 1) Zeilen mit gleicher Höhe im Bild zu einer Reihe zusammenfassen (OCR liefert Spalten oft einzeln)
    var ls = (lines || []).filter(function (l) { return l.words && l.words.length; })
      .map(function (l) { return { y: l.y || 0, h: l.h || 20, words: l.words.slice() }; })
      .sort(function (p, q) { return p.y - q.y; });
    var hasY = ls.some(function (l) { return l.y > 0; });
    var rowsY = [];
    ls.forEach(function (l) {
      var last = rowsY[rowsY.length - 1];
      if (hasY && last && Math.abs((l.y + l.h / 2) - (last.y + last.h / 2)) < Math.max(l.h, last.h) * 0.6) {
        last.words = last.words.concat(l.words); last.h = Math.max(last.h, l.h);
      } else rowsY.push(l);
    });
    // 2) Jede Reihe an großen Lücken in Zellen teilen
    var out = [], singles = [];
    rowsY.forEach(function (ln) {
      var w = ln.words.slice().sort(function (a, b) { return a[1] - b[1]; });
      var h = ln.h || 20, cells = [[w[0][0]]];
      for (var i = 1; i < w.length; i++) {
        var gap = w[i][1] - (w[i - 1][1] + w[i - 1][2]);
        if (gap > h * 1.1) cells.push([w[i][0]]); else cells[cells.length - 1].push(w[i][0]);
      }
      cells = cells.map(function (c) { return c.join(' ').trim(); }).filter(Boolean);
      var a = '', b = '';
      if (cells.length >= 2) {
        var core = cells.filter(function (c) { return !/^[\[\/].*[\]\/]$/.test(c); });
        if (core.length < 2) core = cells;
        a = core[0]; b = core.slice(1).join(' ');
      } else {
        var m = cells[0].split(/\s+[-–—:=]\s+|\t/);
        a = m[0]; b = m.slice(1).join(' ');
        if (!b) singles.push(a);
      }
      a = a.replace(/^\s*\d+\s*[.)]\s*/, '').trim(); b = b.trim();
      if (a || b) out.push({ a: a, b: b });
    });
    // 3) Notlösung: fast alles einzeln -> abwechselnd Wort / Übersetzung paaren
    if (out.length > 1 && singles.length >= out.length * 0.8) {
      var flat = out.map(function (p) { return p.a || p.b; }), paired = [];
      for (var k = 0; k < flat.length; k += 2) paired.push({ a: flat[k], b: flat[k + 1] || '' });
      return paired;
    }
    return out;
  }

  /* ---------- Oberfläche ---------- */
  var css = '.kkfi-ov{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}' +
    '.kkfi-box{background:var(--surface,#fff);color:var(--ink,#222);width:100%;max-width:640px;max-height:92vh;overflow:auto;border-radius:14px 14px 0 0;padding:16px;box-sizing:border-box}' +
    '@media(min-width:700px){.kkfi-ov{align-items:center}.kkfi-box{border-radius:14px}}' +
    '.kkfi-box h3{margin:0 0 8px}.kkfi-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}' +
    '.kkfi-msg{margin:10px 0;font-size:14px}.kkfi-msg.err{color:#b00020}.kkfi-small{font-size:12px;opacity:.75}' +
    '.kkfi-tbl{width:100%;border-collapse:collapse;margin:8px 0}.kkfi-tbl th{text-align:left;font-size:13px;padding:2px 4px}' +
    '.kkfi-tbl td{padding:2px 3px}.kkfi-tbl input[type=text]{width:100%;box-sizing:border-box;font:inherit;padding:6px;border:1.5px solid var(--border,#ccc);border-radius:6px;background:var(--surface,#fff);color:inherit}';

  var overlay = null;

  function open() {
    var A = api(), info = A && A.info();
    if (!info) { alert(t('noList')); return; }
    if (!document.getElementById('kkfiCss')) { var st = el('style', { id: 'kkfiCss' }); st.textContent = css; document.head.appendChild(st); }
    close();

    var cam = el('input', { type: 'file', accept: 'image/*', capture: 'environment', style: 'display:none' });
    var pic = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
    var bCam = el('button', { type: 'button', class: 'btn-outline', 'data-kk-nt': '', text: t('camera') });
    var bPic = el('button', { type: 'button', class: 'btn-outline', 'data-kk-nt': '', text: t('pick') });
    var bClose = el('button', { type: 'button', class: 'btn-text', 'data-kk-nt': '', text: t('close') });
    var msg = el('div', { class: 'kkfi-msg', 'data-kk-nt': '', 'aria-live': 'polite' });
    var result = el('div', { 'data-kk-nt': '' });
    var box = el('div', { class: 'kkfi-box', role: 'dialog', 'aria-modal': 'true' }, [
      el('h3', { 'data-kk-nt': '', text: t('title') }),
      el('p', { class: 'kkfi-small', 'data-kk-nt': '', text: t('hint') }),
      el('div', { class: 'kkfi-row' }, [bCam, bPic, bClose]),
      cam, pic, msg, result,
      el('p', { class: 'kkfi-small', 'data-kk-nt': '', text: t('privacy') })
    ]);
    overlay = el('div', { class: 'kkfi-ov' }, [box]);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);

    function say(text, err) { msg.textContent = text || ''; msg.className = 'kkfi-msg' + (err ? ' err' : ''); }
    bCam.onclick = function () { cam.click(); };
    bPic.onclick = function () { pic.click(); };
    bClose.onclick = close;
    function onFile(e) {
      var f = e.target.files && e.target.files[0]; e.target.value = '';
      if (f) handle(f, say, result, info);
    }
    cam.onchange = onFile; pic.onchange = onFile;
  }
  function close() { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay = null; }

  var busy = false;
  function handle(file, say, result, info) {
    if (busy) return;
    if (!/^image\//.test(file.type)) { say(t('notImg'), true); return; }
    var sb = window.kkGetSb && window.kkGetSb();
    if (!sb || !sb.functions) { say(t('noSb'), true); return; }
    busy = true; result.textContent = ''; say(t('prep'));
    shrink(file).then(blobToDataUrl).then(function (dataUrl) {
      say(t('scan'));
      return sb.functions.invoke(FUNCTION_NAME, { body: { image: dataUrl, uiLang: lang() } });
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message || 'error');
      var d = r.data || {};
      if (d.error) throw new Error(d.error);
      var pairs = pairsFromLines(d.lines || []);
      if (!pairs.length) { say(t('nothing'), true); return; }
      say(''); showPairs(pairs, result, say, info);
    }).catch(function (e) {
      say(e && e.message === 'toobig' ? t('tooBig') : t('fail') + (e && e.message ? e.message : ''), true);
    }).then(function () { busy = false; });
  }

  function showPairs(pairs, result, say, info) {
    result.textContent = '';
    var rows = pairs.map(function (p) { return { a: p.a, b: p.b, on: true }; });
    var tbl = el('table', { class: 'kkfi-tbl' });
    var all = el('input', { type: 'checkbox', checked: 'checked', 'aria-label': t('selAll') });
    tbl.appendChild(el('tr', {}, [el('th', {}, [all]), el('th', { text: info.langA }), el('th', { text: info.langB })]));
    var inputs = [];
    function build() {
      while (tbl.rows.length > 1) tbl.deleteRow(1);
      inputs = rows.map(function (r) {
        var cb = el('input', { type: 'checkbox' }); cb.checked = r.on;
        var ia = el('input', { type: 'text' }); ia.value = r.a;
        var ib = el('input', { type: 'text' }); ib.value = r.b;
        cb.onchange = function () { r.on = cb.checked; };
        ia.oninput = function () { r.a = ia.value; }; ib.oninput = function () { r.b = ib.value; };
        tbl.appendChild(el('tr', {}, [el('td', {}, [cb]), el('td', {}, [ia]), el('td', {}, [ib])]));
        return cb;
      });
    }
    build();
    all.onchange = function () { rows.forEach(function (r, i) { r.on = all.checked; inputs[i].checked = all.checked; }); };
    var bSwap = el('button', { type: 'button', class: 'btn-outline', text: t('swap') });
    var bAdd = el('button', { type: 'button', class: 'btn-outline', text: t('add') });
    bSwap.onclick = function () { rows.forEach(function (r) { var x = r.a; r.a = r.b; r.b = x; }); build(); };
    bAdd.onclick = function () {
      var A = api(); if (!A) return;
      var sel = rows.filter(function (r) { return r.on; });
      var n = A.add(sel);
      if (n) { say(n + t('added')); result.textContent = ''; } else say(t('dupes'), true);
    };
    result.appendChild(el('p', { text: t('found') }));
    result.appendChild(tbl);
    result.appendChild(el('div', { class: 'kkfi-row' }, [bAdd, bSwap]));
  }

  /* ---------- Button neben „+ Zeile hinzufügen“ ---------- */
  var btn = null;
  function mount() {
    var anchor = document.getElementById('addRowBtn');
    if (!anchor || document.getElementById('kkFotoBtn')) return;
    btn = el('button', { type: 'button', class: 'btn-outline', id: 'kkFotoBtn', 'data-kk-nt': '', text: t('btn') });
    btn.addEventListener('click', open);
    anchor.parentNode.insertBefore(btn, anchor.nextSibling);
  }
  function relabel() { var b = document.getElementById('kkFotoBtn'); if (b) b.textContent = t('btn'); }
  // Sprachwechsel läuft über <select>-change -> Beschriftung danach aktualisieren
  document.addEventListener('change', function () { setTimeout(relabel, 50); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
