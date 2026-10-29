/* Karteikasten – Foto zu Liste (KI)
 * Ablauf: Foto wählen -> im Browser verkleinern -> Supabase Edge Function "foto-liste"
 * (dort liegt GEMINI_API_KEY als Secret) -> Vorschau prüfen/korrigieren -> in Liste einfügen oder neue Liste erstellen.
 * Der API-Key steht NIE in dieser Datei. Übersetzungen: de / en / pt-BR (window.kkLang).
 * Einstiege: Knopf neben jedem „mit KI“-Knopf + Tab „Foto zu Liste“ im KI-Fenster.
 */
(function () {
  'use strict';

  var FUNCTION_NAME = 'foto-liste';
  var MAX_BYTES = 1200 * 1024;  // Ziel nach Komprimierung
  var MAX_SIDE = 2000;          // längste Bildkante in px
  var MIN_SIDE = 900;

  var TX = {
    btn: { de: '📷 Foto zu Liste', en: '📷 Photo to list', 'pt-BR': '📷 Foto para lista' },
    title: { de: 'Foto zu Liste', en: 'Photo to list', 'pt-BR': 'Foto para lista' },
    hint: { de: 'Fotografiere eine Vokabelseite im Schulbuch (gerade und gut beleuchtet). Die KI liest die Wörter aus und du kannst sie vor dem Einfügen prüfen.', en: 'Take a photo of a vocabulary page in your textbook (straight and well lit). The AI reads the words and you can check them before adding.', 'pt-BR': 'Tire uma foto de uma página de vocabulário do livro (reta e bem iluminada). A IA lê as palavras e você pode conferi-las antes de adicionar.' },
    camera: { de: 'Foto aufnehmen', en: 'Take photo', 'pt-BR': 'Tirar foto' },
    pick: { de: 'Bild auswählen', en: 'Choose image', 'pt-BR': 'Escolher imagem' },
    close: { de: 'Schließen', en: 'Close', 'pt-BR': 'Fechar' },
    prep: { de: 'Bild wird verkleinert …', en: 'Shrinking image …', 'pt-BR': 'Reduzindo a imagem …' },
    scan: { de: 'KI liest das Foto … (kann bis zu 30 Sekunden dauern)', en: 'AI is reading the photo … (can take up to 30 seconds)', 'pt-BR': 'A IA está lendo a foto … (pode levar até 30 segundos)' },
    notImg: { de: 'Das ist keine Bilddatei.', en: 'This is not an image file.', 'pt-BR': 'Este não é um arquivo de imagem.' },
    tooBig: { de: 'Das Bild konnte nicht klein genug gemacht werden. Bitte nimm ein neues Foto mit weniger Hintergrund auf.', en: 'The image could not be made small enough. Please take a new photo with less background.', 'pt-BR': 'Não foi possível reduzir a imagem o bastante. Tire outra foto com menos fundo.' },
    noSb: { de: 'Keine Verbindung zum Server. Bitte melde dich an und versuche es erneut.', en: 'No connection to the server. Please sign in and try again.', 'pt-BR': 'Sem conexão com o servidor. Entre na sua conta e tente de novo.' },
    fail: { de: 'Foto konnte nicht ausgewertet werden: ', en: 'The photo could not be analysed: ', 'pt-BR': 'Não foi possível analisar a foto: ' },
    nothing: { de: 'Es wurden keine Vokabeln erkannt. Probiere ein schärferes, helleres Foto.', en: 'No vocabulary was found. Try a sharper, brighter photo.', 'pt-BR': 'Nenhum vocabulário foi encontrado. Tente uma foto mais nítida e clara.' },
    found: { de: 'Gefundene Vokabeln – bitte prüfen und korrigieren:', en: 'Words found – please check and correct:', 'pt-BR': 'Palavras encontradas – confira e corrija:' },
    swap: { de: 'Spalten tauschen', en: 'Swap columns', 'pt-BR': 'Trocar colunas' },
    add: { de: 'Zur aktuellen Liste hinzufügen', en: 'Add to current list', 'pt-BR': 'Adicionar à lista atual' },
    create: { de: 'Neue Liste erstellen', en: 'Create new list', 'pt-BR': 'Criar nova lista' },
    listName: { de: 'Listenname', en: 'List name', 'pt-BR': 'Nome da lista' },
    added: { de: ' Vokabeln hinzugefügt.', en: ' words added.', 'pt-BR': ' palavras adicionadas.' },
    created: { de: ' Vokabeln in neuer Liste erstellt.', en: ' words created in a new list.', 'pt-BR': ' palavras criadas em uma nova lista.' },
    dupes: { de: 'Nichts hinzugefügt (alles schon vorhanden oder leer).', en: 'Nothing added (all already present or empty).', 'pt-BR': 'Nada adicionado (tudo já existe ou vazio).' },
    selAll: { de: 'Alle', en: 'All', 'pt-BR': 'Todas' },
    privacy: { de: 'Hinweis: Das Foto wird zur Auswertung an die KI (Google Gemini) gesendet und nicht von uns gespeichert.', en: 'Note: the photo is sent to the AI (Google Gemini) for analysis and is not stored by us.', 'pt-BR': 'Aviso: a foto é enviada à IA (Google Gemini) para análise e não é armazenada por nós.' }
  };
  function lang() { var l = window.kkLang; return l === 'en' || l === 'pt-BR' ? l : 'de'; }
  function t(k) { var o = TX[k]; return o ? (o[lang()] || o.de) : k; }
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
    if (window.createImageBitmap) return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return viaImg(file); });
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
  function toBlob(canvas, q) { return new Promise(function (res) { canvas.toBlob(res, 'image/jpeg', q); }); }
  function shrink(file) {
    return loadBitmap(file).then(function (bmp) {
      var w0 = bmp.width, h0 = bmp.height, side = Math.min(MAX_SIDE, Math.max(w0, h0)), q = 0.85;
      var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      function attempt() {
        var sc = side / Math.max(w0, h0), w = Math.round(w0 * sc), h = Math.round(h0 * sc);
        canvas.width = w; canvas.height = h;
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(bmp, 0, 0, w, h);
        return toBlob(canvas, q).then(function (blob) {
          if (!blob) throw new Error('blob');
          if (blob.size <= MAX_BYTES) return blob;
          if (q > 0.5) { q -= 0.1; return attempt(); }
          if (side > MIN_SIDE) { side = Math.round(side * 0.85); q = 0.7; return attempt(); }
          throw new Error('toobig');
        });
      }
      return attempt();
    });
  }
  function blobToDataUrl(blob) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(blob); });
  }

  /* ---------- Oberfläche ---------- */
  var css = '.kkfi-ov{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}' +
    '.kkfi-box{background:var(--surface,#fff);color:var(--ink,#222);width:100%;max-width:640px;max-height:92vh;overflow:auto;border-radius:14px 14px 0 0;padding:16px;box-sizing:border-box}' +
    '@media(min-width:700px){.kkfi-ov{align-items:center}.kkfi-box{border-radius:14px}}' +
    '.kkfi-box h3{margin:0 0 8px}.kkfi-row{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}' +
    '.kkfi-msg{margin:10px 0;font-size:14px}.kkfi-msg.err{color:#b00020}.kkfi-small{font-size:12px;opacity:.75}' +
    '.kkfi-tbl{width:100%;border-collapse:collapse;margin:8px 0}.kkfi-tbl th{text-align:left;font-size:13px;padding:2px 4px}' +
    '.kkfi-tbl td{padding:2px 3px}.kkfi-tbl input[type=text],.kkfi-name{width:100%;box-sizing:border-box;font:inherit;padding:6px;border:1.5px solid var(--border,#ccc);border-radius:6px;background:var(--surface,#fff);color:inherit}';
  function ensureCss() {
    if (document.getElementById('kkfiCss')) return;
    var st = el('style', { id: 'kkfiCss' }); st.textContent = css; document.head.appendChild(st);
  }

  // Füllt einen Container mit dem kompletten Foto-Ablauf. onDone() nach erfolgreichem Einfügen.
  function buildPanel(host, onDone) {
    var cam = el('input', { type: 'file', accept: 'image/*', capture: 'environment', style: 'display:none' });
    var pic = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
    var bCam = el('button', { type: 'button', class: 'btn-outline', 'data-kk-nt': '', text: t('camera') });
    var bPic = el('button', { type: 'button', class: 'btn-outline', 'data-kk-nt': '', text: t('pick') });
    var msg = el('div', { class: 'kkfi-msg', 'data-kk-nt': '', 'aria-live': 'polite' });
    var result = el('div', { 'data-kk-nt': '' });
    host.appendChild(el('p', { class: 'kkfi-small', 'data-kk-nt': '', text: t('hint') }));
    host.appendChild(el('div', { class: 'kkfi-row' }, [bCam, bPic]));
    [cam, pic, msg, result].forEach(function (n) { host.appendChild(n); });
    host.appendChild(el('p', { class: 'kkfi-small', 'data-kk-nt': '', text: t('privacy') }));
    function say(text, err) { msg.textContent = text || ''; msg.className = 'kkfi-msg' + (err ? ' err' : ''); }
    bCam.onclick = function () { cam.click(); };
    bPic.onclick = function () { pic.click(); };
    function onFile(e) { var f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) handle(f, say, result, onDone); }
    cam.onchange = onFile; pic.onchange = onFile;
  }

  var overlay = null;
  function open() {
    ensureCss(); close();
    var bClose = el('button', { type: 'button', class: 'btn-text', 'data-kk-nt': '', text: t('close') });
    var host = el('div');
    var box = el('div', { class: 'kkfi-box', role: 'dialog', 'aria-modal': 'true' }, [el('h3', { 'data-kk-nt': '', text: t('title') }), host, el('div', { class: 'kkfi-row' }, [bClose])]);
    overlay = el('div', { class: 'kkfi-ov' }, [box]);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    bClose.onclick = close;
    document.body.appendChild(overlay);
    buildPanel(host, function (created) { if (created) close(); });
  }
  function close() { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay = null; }

  var busy = false;
  function handle(file, say, result, onDone) {
    if (busy) return;
    if (!/^image\//.test(file.type)) { say(t('notImg'), true); return; }
    var sb = window.kkGetSb && window.kkGetSb();
    if (!sb || !sb.functions) { say(t('noSb'), true); return; }
    var A = api(), info = A && A.info();
    busy = true; result.textContent = ''; say(t('prep'));
    shrink(file).then(blobToDataUrl).then(function (dataUrl) {
      say(t('scan'));
      return sb.functions.invoke(FUNCTION_NAME, { body: { image: dataUrl, uiLang: lang(), langA: info ? info.langA : '', langB: info ? info.langB : '' } });
    }).then(function (r) {
      if (r.error) throw new Error(r.error.message || 'error');
      var d = r.data || {};
      if (d.error) throw new Error(d.error);
      var pairs = (d.pairs || []).filter(function (p) { return p && (p.a || p.b); });
      if (!pairs.length) { say(t('nothing'), true); return; }
      say(''); showPairs(pairs, d, info, result, say, onDone);
    }).catch(function (e) {
      say(e && e.message === 'toobig' ? t('tooBig') : t('fail') + (e && e.message ? e.message : ''), true);
    }).then(function () { busy = false; });
  }

  function showPairs(pairs, d, info, result, say, onDone) {
    result.textContent = '';
    var rows = pairs.map(function (p) { return { a: p.a, b: p.b, on: true }; });
    var hA = info ? info.langA : (d.langA || 'A'), hB = info ? info.langB : (d.langB || 'B');
    var tbl = el('table', { class: 'kkfi-tbl' });
    var all = el('input', { type: 'checkbox', checked: 'checked', 'aria-label': t('selAll') });
    tbl.appendChild(el('tr', {}, [el('th', {}, [all]), el('th', { text: hA }), el('th', { text: hB })]));
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
    var nameIn = el('input', { type: 'text', class: 'kkfi-name', 'aria-label': t('listName'), placeholder: t('listName') });
    nameIn.value = d.listName || '';
    var bSwap = el('button', { type: 'button', class: 'btn-outline', text: t('swap') });
    var bAdd = info ? el('button', { type: 'button', class: 'btn-outline', text: t('add') }) : null;
    var bNew = el('button', { type: 'button', class: 'btn-outline', text: t('create') });
    bSwap.onclick = function () {
      rows.forEach(function (r) { var x = r.a; r.a = r.b; r.b = x; }); build();
      var h = tbl.rows[0].cells; var x = h[1].textContent; h[1].textContent = h[2].textContent; h[2].textContent = x;
      var y = hA; hA = hB; hB = y;
    };
    function sel() { return rows.filter(function (r) { return r.on; }); }
    if (bAdd) bAdd.onclick = function () {
      var A = api(); if (!A) return;
      var n = A.add(sel());
      if (n) { say(n + t('added')); result.textContent = ''; if (onDone) onDone(false); } else say(t('dupes'), true);
    };
    bNew.onclick = function () {
      var A = api(); if (!A || !A.create) return;
      var n = A.create(nameIn.value.trim(), hA, hB, sel());
      if (n) { say(n + t('created')); result.textContent = ''; if (onDone) onDone(true); } else say(t('dupes'), true);
    };
    result.appendChild(el('p', { text: t('found') }));
    result.appendChild(tbl);
    result.appendChild(nameIn);
    result.appendChild(el('div', { class: 'kkfi-row' }, bAdd ? [bAdd, bNew, bSwap] : [bNew, bSwap]));
  }

  /* ---------- Knöpfe neben jedem „mit KI“-Knopf ---------- */
  var ANCHORS = [['kkAINewListBtn', 'kkFotoBtnNew'], ['kkAIRowBtn', 'kkFotoBtnRow'], ['kkAIBulkBtn', 'kkFotoBtnBulk']];
  function mount() {
    ensureCss();
    ANCHORS.forEach(function (p) {
      var anchor = document.getElementById(p[0]);
      if (!anchor || document.getElementById(p[1])) return;
      var b = el('button', { type: 'button', class: 'btn-outline btn-rust', id: p[1], 'data-kk-nt': '', text: t('btn') });
      b.addEventListener('click', open);
      anchor.parentNode.insertBefore(b, anchor.nextSibling);
    });
  }
  function relabel() {
    ANCHORS.forEach(function (p) { var b = document.getElementById(p[1]); if (b) b.textContent = t('btn'); });
    var tab = document.getElementById('kkAITabFoto'); if (tab) tab.textContent = t('title');
  }

  /* ---------- Neuer Tab „Foto zu Liste“ im KI-Fenster ---------- */
  function mountTab() {
    var tabCreate = document.getElementById('kkAITabCreate');
    if (!tabCreate || document.getElementById('kkAITabFoto')) return;
    var tabs = tabCreate.parentNode, modal = tabs.parentNode;
    var log = document.getElementById('kkAIChatLog'), topic = document.getElementById('kkAITopic');
    var chatPane = log && log.parentNode, createPane = topic && topic.closest('.kk-ai-pane');
    ensureCss();
    var tab = el('button', { type: 'button', id: 'kkAITabFoto', 'data-kk-nt': '', text: t('title') });
    var pane = el('div', { class: 'kk-ai-pane hidden', id: 'kkFotoPane', style: 'overflow:auto;padding:12px' });
    var built = false;
    tabs.insertBefore(tab, tabCreate.nextSibling);
    modal.appendChild(pane);
    function hideMine() { pane.classList.add('hidden'); tab.classList.remove('active'); }
    tab.addEventListener('click', function () {
      Array.prototype.forEach.call(modal.querySelectorAll('.kk-ai-pane'), function (p) { if (p !== pane) p.classList.add('hidden'); });
      Array.prototype.forEach.call(tabs.children, function (b) { b.classList.remove('active'); });
      tab.classList.add('active'); pane.classList.remove('hidden');
      if (!built) {
        built = true;
        buildPanel(pane, function () { var c = document.getElementById('kkAIClose'); if (c) c.click(); });
      }
    });
    [chatPane, createPane].forEach(function (p) {
      if (!p || !window.MutationObserver) return;
      new MutationObserver(function () { if (!p.classList.contains('hidden')) hideMine(); })
        .observe(p, { attributes: true, attributeFilter: ['class'] });
    });
  }

  function init() {
    mount(); mountTab();
    // KI-Fenster wird erst beim Öffnen gebaut -> Tab nachrüsten
    if (window.MutationObserver) new MutationObserver(function () { mountTab(); }).observe(document.body, { childList: true });
  }
  document.addEventListener('kk-lang', relabel);
  document.addEventListener('change', function () { setTimeout(relabel, 50); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  setTimeout(mount, 900); setTimeout(mount, 2400); setTimeout(mount, 5000);
  window.kkFotoOpen = open;
})();
