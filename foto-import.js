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
    col: { de: 'Spalte', en: 'Column', 'pt-BR': 'Coluna' },
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
  // lines: [{ y, h, words: [[text, left, width], ...] }]
  // -> { rows: [[Zelle je Spalte]], ncols, guess: [Spalte A, Spalte B] }
  // Neu gegenüber früher:
  //  - Schräglage des Fotos wird geschätzt und herausgerechnet (sonst zerfallen Spalten/Zeilen)
  //  - Lautschrift [..] wird auch entfernt, wenn sie über zwei Zeilen läuft oder Klammern fehlen
  //  - Spaltenpaar wird nach Inhalt gewählt (nicht "die ersten zwei Spalten"):
  //    Beispielsatz-Spalten (lange Sätze) und Nachbarseiten fallen heraus
  function cleanCell(c) {
    c = String(c || '')
      .replace(/\[[^\]]*\]/g, ' ')        // [fɛʁpœʁ]
      .replace(/\[[^\]]*$/, ' ')          // "[øʁø/"  (Rest steht in der nächsten Zeile)
      .replace(/^[^\[\]]*\]/, ' ')        // "øʁøz]"  (Anfang stand in der Zeile davor)
      .replace(/\/[^\/\s]*[ˈˌəɪʊɛæɑɒɔʌʃʒθðŋːøœɑ̃ɔ̃ʁ][^\/]*\//g, ' ')
      .replace(/^\s*Atelier\b/i, ' ')     // Randnotiz "Atelier B 2"
      .replace(/^\s*[A-D]\s?\d\b(?=\s+\S)/, ' ')
      .replace(/^\s*\d+\s*[.)]\s*/, '')
      .replace(/\s+/g, ' ').trim();
    // Kopfzeile / Unit- und Seitenzahl ("2 Vocabulaire", "2", "S. 14") ist kein Vokabeleintrag
    if (/^\d{1,3}$/.test(c) || /^(S\.?|p\.?|Seite|page)\s*\d{1,3}$/i.test(c) ||
        /^\d{0,3}\s*(Vocabulaire|Vocabulary|Wortschatz|Vokabeln|Unit|Unité|Lektion|Leçon)[\s\d\W]*$/i.test(c)) return '';
    // Lautschrift ohne Klammern an einzelnen Wörtern ("jER", "dERnje"): Kleinbuchstabe direkt vor Großbuchstabe
    c = c.split(' ').filter(function (tk) { return !/[a-zà-ÿøœ][A-Z]/.test(tk); }).join(' ').trim();
    // übrig gebliebene Lautschrift ohne Klammern, z. B. "kyRjoZ" oder "DROZ"
    if (/^\S+$/.test(c) && (/[a-zà-ÿ][A-Z]/.test(c) || /^[A-ZØŒ]{3,}$/.test(c))) return '';
    return c;
  }
  function median(a) { a = a.slice().sort(function (p, q) { return p - q; }); return a[Math.floor(a.length / 2)] || 0; }
  function estimateTilt(ls, mh) {
    var firsts = ls.map(function (l) {
      var m = l.words[0]; l.words.forEach(function (w) { if (w[1] < m[1]) m = w; });
      return { x: m[1], y: l.y };
    });
    if (firsts.length < 8) return 0;
    var bw = Math.max(10, mh * 1.5), best = -1e9, theta = 0;
    for (var th = -0.1; th <= 0.1001; th += 0.0025) {
      var bins = {}, sc = 0, k;
      firsts.forEach(function (f) { k = Math.floor((f.x + th * f.y) / bw); bins[k] = (bins[k] || 0) + 1; });
      for (k in bins) sc += bins[k] * bins[k];
      sc -= Math.abs(th) * 0.5;           // bei Gleichstand: lieber gerade
      if (sc > best) { best = sc; theta = th; }
    }
    return theta;
  }
  // vertikale Neigung: der Wert, bei dem die wenigsten Zeilengruppen entstehen
  // (dann liegen Französisch und Deutsch derselben Vokabel auf einer Höhe)
  function groupCount(ls, th, tolF) {
    var ys = ls.map(function (l) {
      var xmin = Math.min.apply(null, l.words.map(function (w) { return w[1]; }));
      return { y: l.y - th * xmin + l.h / 2, h: l.h };
    }).sort(function (p, q) { return p.y - q.y; });
    var n = 0, last = null;
    ys.forEach(function (o) {
      if (last && Math.abs(o.y - last.y) < Math.max(o.h, last.h) * tolF) return;
      n++; last = o;
    });
    return n;
  }
  function estimateSlopeY(ls) {
    var best = 1e9, th = 0;
    for (var t = -0.1; t <= 0.1001; t += 0.005) {   // Fotos sind selten stärker als ~6° gedreht
      var c = groupCount(ls, t, 0.5) + Math.abs(t) * 40;
      if (c < best) { best = c; th = t; }
    }
    return th;
  }
  function parseLines(lines) {
    var ls = (lines || []).filter(function (l) { return l.words && l.words.length; })
      .map(function (l) { return { y: l.y || 0, h: l.h || 20, words: l.words.slice() }; });
    if (!ls.length) return { rows: [], ncols: 0, guess: [0, 1] };
    var hasY = ls.some(function (l) { return l.y > 0; });
    var mh = median(ls.map(function (l) { return l.h; })) || 20;
    var theta = hasY ? estimateTilt(ls, mh) : 0;          // für x (Spalten)
    var thetaY = hasY && ls.length >= 8 ? estimateSlopeY(ls) : 0;   // für y (Zeilen)
    // entzerren: x' = x + θ·y, y' = y − θ·x(Zeilenanfang)
    ls.forEach(function (l, idx) {
      var xmin = Math.min.apply(null, l.words.map(function (w) { return w[1]; }));
      l.yc = hasY ? l.y - thetaY * xmin : idx * 1000;
      l.words = l.words.map(function (w) { return [w[0], w[1] + theta * l.y, w[2]]; });
    });
    ls.sort(function (p, q) { return p.yc - q.yc; });
    var rowsY = [];
    ls.forEach(function (l) {
      var last = rowsY[rowsY.length - 1];
      if (hasY && last && Math.abs((l.yc + l.h / 2) - (last.yc + last.h / 2)) < Math.max(l.h, last.h) * 0.9) {
        last.words = last.words.concat(l.words); last.h = Math.max(last.h, l.h);
      } else rowsY.push({ yc: l.yc, h: l.h, words: l.words.slice() });
    });
    // Zellen je Reihe (Lücke > 1,1 Zeilenhöhen = neue Spalte; mit bekannten Spaltenpositionen
    // reicht schon eine kleine Lücke, wenn das Wort genau an einem Spaltenanfang steht)
    function buildCells(centers) {
      var starts = [], rc = [], hs = [];
      rowsY.forEach(function (ln) {
        var w = ln.words.slice().sort(function (p, q) { return p[1] - q[1]; });
        var h = ln.h || 20, cells = [{ x: w[0][1], t: [w[0][0]] }];
        for (var i = 1; i < w.length; i++) {
          var gap = w[i][1] - (w[i - 1][1] + w[i - 1][2]);
          var atCol = false;
          if (centers && gap > h * 0.35) {
            var cur = cells[cells.length - 1].x;
            centers.forEach(function (c) { if (c > cur + h && Math.abs(w[i][1] - c) < h * 0.9) atCol = true; });
          }
          if (gap > h * 1.1 || atCol) cells.push({ x: w[i][1], t: [w[i][0]] }); else cells[cells.length - 1].t.push(w[i][0]);
        }
        cells.forEach(function (c) { c.t = c.t.join(' ').trim(); starts.push(c.x); });
        rc.push(cells); hs.push(h);
      });
      return { starts: starts, rc: rc, hs: hs };
    }
    function findCols(st, tol, nrows) {
      var sorted = st.slice().sort(function (p, q) { return p - q; }), cols = [];
      sorted.forEach(function (x) {
        var c = cols[cols.length - 1];
        if (c && x - c.sum / c.n < tol) { c.sum += x; c.n++; } else cols.push({ sum: x, n: 1 });
      });
      var out = cols.filter(function (c) { return c.n >= Math.max(2, nrows * 0.15); }).map(function (c) { return c.sum / c.n; });
      return out.length ? out : cols.map(function (c) { return c.sum / c.n; });
    }
    var pass1 = buildCells(null);
    var tol = median(pass1.hs) * 3;
    var cx = findCols(pass1.starts, tol, pass1.rc.length);
    var pass2 = buildCells(cx);
    var rc = pass2.rc;
    cx = findCols(pass2.starts, tol, rc.length);
    var rows = rc.map(function (cells) {
      var r = cx.map(function () { return ''; });
      cells.forEach(function (c) {
        var k = 0, best = 1e9;
        cx.forEach(function (x, i) { var d = Math.abs(x - c.x); if (d < best) { best = d; k = i; } });
        if (best > tol * 1.5) return;      // Randnotiz / Nachbarseite: ignorieren
        r[k] = (r[k] + ' ' + c.t).trim();
      });
      return r;
    });
    // Notlösung: nur eine Spalte -> abwechselnd Wort / Übersetzung
    if (cx.length === 1 && rows.length > 1) {
      var flat = rows.map(function (r) { return r[0]; }), pr = [];
      for (var k = 0; k < flat.length; k += 2) pr.push([flat[k], flat[k + 1] || '']);
      return { rows: pr, ncols: 2, guess: [0, 1] };
    }
    // Spalten bewerten (Inhalt NACH dem Entfernen der Lautschrift)
    var n = cx.length, stat = [];
    for (var i = 0; i < n; i++) {
      var filled = 0, words = 0;
      rows.forEach(function (r) { var c = cleanCell(r[i]); if (c) { filled++; words += c.split(' ').length; } });
      stat.push({ i: i, filled: filled, avg: filled ? words / filled : 0 });
    }
    var cand = stat.filter(function (s) { return s.filled >= 2 && s.avg < 5; });   // lange Sätze = Beispielspalte
    if (cand.length < 2) cand = stat.filter(function (s) { return s.filled > 0; });
    var g = [0, Math.min(1, n - 1)], bestSc = -1;
    // Anker: gibt es eine Beispielsatz-Spalte, sind die zwei Spalten direkt links davon die Vokabeln
    // (so wird die Nachbarseite im Foto nicht mit der Vokabelspalte verwechselt)
    var exs = stat.filter(function (s) { return s.filled >= 2 && s.avg >= 5; });
    if (exs.length) {
      var ex = exs.reduce(function (m, s) { return s.avg > m.avg ? s : m; }, exs[0]);
      var left = cand.filter(function (s) { return s.i < ex.i; });
      if (left.length >= 2) return { rows: rows, ncols: n, guess: [left[left.length - 2].i, left[left.length - 1].i] };
    }
    for (var a = 0; a < cand.length; a++) for (var b = a + 1; b < cand.length; b++) {
      var both = 0;
      rows.forEach(function (r) { if (cleanCell(r[cand[a].i]) && cleanCell(r[cand[b].i])) both++; });
      var sc = both - 0.01 * (cand[b].i - cand[a].i);
      if (sc > bestSc) { bestSc = sc; g = [cand[a].i, cand[b].i]; }
    }
    return { rows: rows, ncols: n, guess: g };
  }
  function pairsFrom(parsed, ia, ib) {
    var out = [];
    parsed.rows.forEach(function (r) {
      var a = cleanCell(r[ia] || ''), b = cleanCell(r[ib] || '');
      if (!a && !b) return;
      var prev = out[out.length - 1];
      // zweite Zeile einer Vokabel: "(f.)" / "(Schulfach)" oder nur eine umgebrochene Übersetzung
      var aCont = !a || /^\(/.test(a), bCont = !b || /^\(/.test(b);
      if (prev && aCont && bCont) {
        prev.a = (prev.a + ' ' + a).trim(); prev.b = (prev.b + ' ' + b).trim(); return;
      }
      if (!a && b && prev) { prev.b = (prev.b + ' ' + b).trim(); return; }   // umgebrochene Übersetzung
      out.push({ a: a, b: b });
    });
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
      var parsed = parseLines(d.lines || []);
      var pairs = pairsFrom(parsed, parsed.guess[0], parsed.guess[1]);
      if (!pairs.length) { say(t('nothing'), true); return; }
      say(''); showPairs(pairs, result, say, info, parsed);
    }).catch(function (e) {
      say(e && e.message === 'toobig' ? t('tooBig') : t('fail') + (e && e.message ? e.message : ''), true);
    }).then(function () { busy = false; });
  }

  function showPairs(pairs, result, say, info, parsed) {
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
