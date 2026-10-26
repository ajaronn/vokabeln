/* Karteikasten – Popup "Für den Computer herunterladen" (de / en / pt-BR).
   Gleiche Datei für Karteikasten UND Karteikasten Developer. Einbinden: <script src="desktop-popup.js" defer></script> */
(function () {
  'use strict';
  var REPO = 'Ajaronn/karteikasten-desktop';   // <- dein GitHub-Repo mit den Downloads (siehe Anleitung)
  var cs = document.currentScript;
  var DEV = /\/vokdev(\/|$)/.test(location.pathname) || /Developer/.test(document.title);
  var KEY = 'kk_desktop_hide_' + (DEV ? 'dev' : 'main'); // getrennt, da beide Seiten dieselbe Domain nutzen
  var ua = navigator.userAgent || '';

  // Nicht anzeigen: Handy/Tablet, in der Desktop-App selbst, installierte PWA, oder "nicht mehr anzeigen"
  if (/Android|iPhone|iPad|iPod|Mobi/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return;
  if (/KKDesktop/.test(ua)) return;
  try { if (/kkdesktop=/.test(location.search) || sessionStorage.getItem('kk_desktop_login')) return; } catch (e) { }
  if (window.matchMedia && matchMedia('(display-mode: standalone)').matches) return;
  try { if (localStorage.getItem(KEY) === '1') return; } catch (e) { }

  var T = {
    de: { t: 'Karteikasten für deinen Computer', d: 'Lade die kostenlose App herunter: eigenes Fenster, eigenes Symbol auf dem Startbildschirm bzw. Desktop und immer die neueste Version.', dl: 'Herunterladen für', o: 'Andere Systeme:', h: 'Nicht mehr anzeigen', c: 'Später', n: 'Developer-Version' },
    en: { t: 'Karteikasten for your computer', d: 'Download the free app: its own window, its own icon on your desktop or home screen, and always the latest version.', dl: 'Download for', o: 'Other systems:', h: "Don't show again", c: 'Later', n: 'Developer edition' },
    'pt-BR': { t: 'Karteikasten para o seu computador', d: 'Baixe o app gratuito: janela própria, ícone próprio na área de trabalho ou tela inicial e sempre a versão mais recente.', dl: 'Baixar para', o: 'Outros sistemas:', h: 'Não mostrar novamente', c: 'Depois', n: 'Edição para desenvolvedores' }
  };
  var lang = 'de';
  try { var s = localStorage.getItem('kk_lang'); if (s === 'de' || s === 'en' || s === 'pt-BR') lang = s; else throw 0; }
  catch (e) { var n = String(navigator.language || 'de').toLowerCase(); lang = n.indexOf('pt') === 0 ? 'pt-BR' : n.indexOf('en') === 0 ? 'en' : 'de'; }
  var L = T[lang];

  var os = /Win/i.test(ua) ? 'win' : /Mac/i.test(ua) ? 'mac' : 'linux';
  var NAMES = { win: 'Windows', mac: 'macOS', linux: 'Linux' };
  var FILES = { win: 'Windows.exe', mac: 'Mac.dmg', linux: 'Linux.AppImage' };
  var base = 'https://github.com/' + REPO + '/releases/latest/download/' + (DEV ? 'Karteikasten-Developer-' : 'Karteikasten-');
  function url(k) { return base + FILES[k]; }

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }

  function build() {
    var link = el('link'); link.rel = 'stylesheet';
    link.href = cs && cs.src ? cs.src.replace(/desktop-popup\.js.*$/, 'desktop-popup.css') : 'desktop-popup.css';
    document.head.appendChild(link);

    var ov = el('div', 'kkdp-ov');
    var box = el('div', 'kkdp-box');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'kkdpT');
    var img = el('img', 'kkdp-logo'); img.src = (cs && cs.src ? cs.src.replace(/desktop-popup\.js.*$/, '') : '') + 'icon-192.png'; img.alt = '';
    var h = el('h2', '', L.t); h.id = 'kkdpT';
    box.appendChild(img); box.appendChild(h);
    if (DEV) box.appendChild(el('span', 'kkdp-tag', L.n));
    box.appendChild(el('p', '', L.d));

    var main = el('a', 'kkdp-btn', L.dl + ' ' + NAMES[os]); main.href = url(os); main.rel = 'noopener';
    box.appendChild(main);

    var oth = el('p', 'kkdp-oth', L.o + ' ');
    ['win', 'mac', 'linux'].filter(function (k) { return k !== os; }).forEach(function (k, i) {
      if (i) oth.appendChild(document.createTextNode(' · '));
      var a = el('a', '', NAMES[k]); a.href = url(k); a.rel = 'noopener'; oth.appendChild(a);
    });
    box.appendChild(oth);

    var lab = el('label', 'kkdp-chk'); var cb = el('input'); cb.type = 'checkbox';
    lab.appendChild(cb); lab.appendChild(document.createTextNode(' ' + L.h)); box.appendChild(lab);
    var cl = el('button', 'kkdp-close', L.c); cl.type = 'button'; box.appendChild(cl);

    function close() {
      if (cb.checked) { try { localStorage.setItem(KEY, '1'); } catch (e) { } }
      ov.remove(); document.removeEventListener('keydown', key);
    }
    function key(e) { if (e.key === 'Escape') close(); }
    cl.addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', key);
    ov.appendChild(box); document.body.appendChild(ov); main.focus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
