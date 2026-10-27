/* Karteikasten – Popup "Für den Computer herunterladen" (de / en / pt-BR).
   Gleiche Datei für Karteikasten UND Karteikasten Developer. Einbinden: <script src="desktop-popup.js" defer></script>
   Test ohne PC: Seite mit ?kkpopup=win, ?kkpopup=mac oder ?kkpopup=linux öffnen (erzwingt das Popup, auch am Handy). */
(function () {
  'use strict';
  var REPO = 'Ajaronn/karteikasten-desktop';
  var cs = document.currentScript;
  var DEV = /\/vokdev(\/|$)/.test(location.pathname) || /Developer/.test(document.title);
  var KEY = 'kk_desktop_hide_' + (DEV ? 'dev' : 'main');
  var ua = navigator.userAgent || '';
  var force = /[?&]kkpopup=(win|mac|linux)(?:&|$)/.exec(location.search);

  if (!force) {
    if (/Android|iPhone|iPad|iPod|Mobi/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return;
    if (/KKDesktop/.test(ua)) return;
    try { if (/kkdesktop=/.test(location.search) || sessionStorage.getItem('kk_desktop_login')) return; } catch (e) { }
    if (window.matchMedia && matchMedia('(display-mode: standalone)').matches) return;
    try { if (localStorage.getItem(KEY) === '1') return; } catch (e) { }
  }

  var APP = DEV ? 'Karteikasten Developer' : 'Karteikasten';
  var T = {
    de: {
      t: 'Karteikasten für deinen Computer', d: 'Lade die kostenlose App herunter: eigenes Fenster, eigenes Symbol auf dem Startbildschirm bzw. Desktop und immer die neueste Version.',
      dl: 'Herunterladen für', o: 'Andere Systeme:', h: 'Nicht mehr anzeigen', c: 'Später', n: 'Developer-Version',
      dt: 'Download gestartet ✅', dd: 'Die Datei wird heruntergeladen. So geht es weiter:',
      fb: 'Der Download hat nicht gestartet?', fl: 'Hier erneut herunterladen', fin: 'Fertig',
      s: {
        win: ['Öffne die heruntergeladene Datei {f} (Ordner „Downloads“).', 'Erscheint ein blaues Fenster „Der Computer wurde geschützt“: auf „Weitere Informationen“ und dann „Trotzdem ausführen“ klicken.', 'Die App startet und legt ein Symbol auf dem Desktop an.'],
        mac: ['Öffne die Datei {f} (Ordner „Downloads“).', 'Ziehe {a} in den Ordner „Programme“.', 'Beim ersten Start: Rechtsklick auf die App → „Öffnen“ → „Öffnen“. Steht dort „beschädigt“, gib im Terminal ein:'],
        linux: ['Mache die Datei {f} ausführbar: Rechtsklick → Eigenschaften → „Als Programm ausführen“ erlauben (oder im Terminal: chmod +x).', 'Starte die Datei per Doppelklick.']
      }
    },
    en: {
      t: 'Karteikasten for your computer', d: 'Download the free app: its own window, its own icon on your desktop or home screen, and always the latest version.',
      dl: 'Download for', o: 'Other systems:', h: "Don't show again", c: 'Later', n: 'Developer edition',
      dt: 'Download started ✅', dd: 'The file is downloading. Here is what to do next:',
      fb: "Download didn't start?", fl: 'Download again here', fin: 'Done',
      s: {
        win: ['Open the downloaded file {f} (your "Downloads" folder).', 'If a blue window says "Windows protected your PC": click "More info", then "Run anyway".', 'The app starts and adds an icon to your desktop.'],
        mac: ['Open the file {f} (your "Downloads" folder).', 'Drag {a} into the "Applications" folder.', 'On first launch: right-click the app → "Open" → "Open". If it says "damaged", enter this in Terminal:'],
        linux: ['Make the file {f} executable: right-click → Properties → allow "Run as program" (or in Terminal: chmod +x).', 'Start it with a double-click.']
      }
    },
    'pt-BR': {
      t: 'Karteikasten para o seu computador', d: 'Baixe o app gratuito: janela própria, ícone próprio na área de trabalho ou tela inicial e sempre a versão mais recente.',
      dl: 'Baixar para', o: 'Outros sistemas:', h: 'Não mostrar novamente', c: 'Depois', n: 'Edição para desenvolvedores',
      dt: 'Download iniciado ✅', dd: 'O arquivo está sendo baixado. Veja o que fazer a seguir:',
      fb: 'O download não começou?', fl: 'Baixar novamente aqui', fin: 'Concluído',
      s: {
        win: ['Abra o arquivo baixado {f} (pasta "Downloads").', 'Se aparecer uma janela azul "O Windows protegeu o computador": clique em "Mais informações" e depois em "Executar assim mesmo".', 'O app inicia e cria um ícone na área de trabalho.'],
        mac: ['Abra o arquivo {f} (pasta "Downloads").', 'Arraste {a} para a pasta "Aplicativos".', 'Na primeira vez: clique com o botão direito no app → "Abrir" → "Abrir". Se disser "danificado", digite no Terminal:'],
        linux: ['Torne o arquivo {f} executável: botão direito → Propriedades → permitir "Executar como programa" (ou no Terminal: chmod +x).', 'Inicie com um clique duplo.']
      }
    }
  };
  var lang = 'de';
  try { var s = localStorage.getItem('kk_lang'); if (s === 'de' || s === 'en' || s === 'pt-BR') lang = s; else throw 0; }
  catch (e) { var n = String(navigator.language || 'de').toLowerCase(); lang = n.indexOf('pt') === 0 ? 'pt-BR' : n.indexOf('en') === 0 ? 'en' : 'de'; }
  var L = T[lang];

  var os = force ? force[1] : /Win/i.test(ua) ? 'win' : /Mac/i.test(ua) ? 'mac' : 'linux';
  var NAMES = { win: 'Windows', mac: 'macOS', linux: 'Linux' };
  var FILES = { win: 'Windows.exe', mac: 'Mac.dmg', linux: 'Linux.AppImage' };
  var PREFIX = DEV ? 'Karteikasten-Developer-' : 'Karteikasten-';
  var base = 'https://github.com/' + REPO + '/releases/latest/download/' + PREFIX;
  function url(k) { return base + FILES[k]; }
  function fill(t) { return t.replace('{f}', PREFIX + FILES[os]).replace('{a}', APP + '.app'); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  var root = cs && cs.src ? cs.src.replace(/desktop-popup\.js.*$/, '') : '';

  function build() {
    var link = el('link'); link.rel = 'stylesheet'; link.href = root + 'desktop-popup.css'; document.head.appendChild(link);

    var ov = el('div', 'kkdp-ov');
    var box = el('div', 'kkdp-box');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'kkdpT');
    var lab = el('label', 'kkdp-chk'); var cb = el('input'); cb.type = 'checkbox';
    lab.appendChild(cb); lab.appendChild(document.createTextNode(' ' + L.h));

    function close() {
      if (cb.checked) { try { localStorage.setItem(KEY, '1'); } catch (e) { } }
      ov.remove(); document.removeEventListener('keydown', key);
    }
    function key(e) { if (e.key === 'Escape') close(); }

    function head(title) {
      var img = el('img', 'kkdp-logo'); img.src = root + 'icon-192.png'; img.alt = '';
      var h = el('h2', '', title); h.id = 'kkdpT';
      box.appendChild(img); box.appendChild(h);
      if (DEV) box.appendChild(el('span', 'kkdp-tag', L.n));
    }

    function viewStart() {
      box.textContent = ''; head(L.t);
      box.appendChild(el('p', '', L.d));
      var main = el('a', 'kkdp-btn', L.dl + ' ' + NAMES[os]); main.href = url(os); main.rel = 'noopener';
      main.addEventListener('click', function () { setTimeout(viewDone, 400); }); // Download läuft normal weiter
      box.appendChild(main);
      var oth = el('p', 'kkdp-oth', L.o + ' ');
      ['win', 'mac', 'linux'].filter(function (k) { return k !== os; }).forEach(function (k, i) {
        if (i) oth.appendChild(document.createTextNode(' · '));
        var a = el('a', '', NAMES[k]); a.href = url(k); a.rel = 'noopener';
        a.addEventListener('click', function () { os = k; setTimeout(viewDone, 400); });
        oth.appendChild(a);
      });
      box.appendChild(oth); box.appendChild(lab);
      var cl = el('button', 'kkdp-close', L.c); cl.type = 'button'; cl.addEventListener('click', close); box.appendChild(cl);
      main.focus();
    }

    function viewDone() {
      box.textContent = ''; head(L.dt);
      box.appendChild(el('p', '', L.dd));
      var ol = el('ol', 'kkdp-steps');
      L.s[os].forEach(function (t) { ol.appendChild(el('li', '', fill(t))); });
      box.appendChild(ol);
      if (os === 'mac') box.appendChild(el('code', 'kkdp-code', 'xattr -cr "/Applications/' + APP + '.app"'));
      var fb = el('p', 'kkdp-oth', L.fb + ' ');
      var a = el('a', '', L.fl); a.href = url(os); a.rel = 'noopener'; fb.appendChild(a);
      box.appendChild(fb); box.appendChild(lab);
      var fin = el('button', 'kkdp-btn kkdp-fin', L.fin); fin.type = 'button'; fin.addEventListener('click', close);
      box.appendChild(fin); fin.focus();
    }

    document.addEventListener('keydown', key);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.appendChild(box); document.body.appendChild(ov); viewStart();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
