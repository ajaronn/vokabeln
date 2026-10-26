/* Karteikasten – Login-Brücke Browser -> Desktop-App. Läuft NUR im normalen Browser-Tab, das die App geöffnet hat.
   Einbinden (in <head>, möglichst VOR den anderen Scripts): <script src="desktop-auth.js"></script> */
(function () {
  'use strict';
  if (/KKDesktop/.test(navigator.userAgent)) return;
  var KEY = 'kk_desktop_login', TTL = 15 * 60 * 1000, PORTS = { main: 48217, dev: 48218 }, ss;
  try { ss = window.sessionStorage; } catch (e) { return; }
  var m = /[?&]kkdesktop=(main|dev)(?:&|$)/.exec(location.search), n = /[?&]n=([a-f0-9]{32})(?:&|$)/.exec(location.search);
  if (m && n) { try { ss.setItem(KEY, JSON.stringify({ t: Date.now(), p: m[1], n: n[1] })); } catch (e) { } }
  var st = null; try { st = JSON.parse(ss.getItem(KEY) || 'null'); } catch (e) { }
  if (!st || Date.now() - st.t > TTL) { try { ss.removeItem(KEY); } catch (e) { } return; }

  var T = {
    de: 'Melde dich hier an. Danach kehrst du automatisch zur Karteikasten-App zurück.',
    en: 'Sign in here. You will then return to the Karteikasten app automatically.',
    'pt-BR': 'Faça login aqui. Depois você volta automaticamente ao app Karteikasten.'
  };
  var lang = 'de';
  try { var s = localStorage.getItem('kk_lang'); if (s === 'de' || s === 'en' || s === 'pt-BR') lang = s; else throw 0; }
  catch (e) { var nl = String(navigator.language || 'de').toLowerCase(); lang = nl.indexOf('pt') === 0 ? 'pt-BR' : nl.indexOf('en') === 0 ? 'en' : 'de'; }
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.createElement('div'); b.textContent = T[lang];
    b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99998;background:#A8442E;color:#FBF6EA;font:600 15px Georgia,serif;text-align:center;padding:10px 14px';
    document.body.appendChild(b);
  });

  function find() {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (/^sb-.+-auth-token$/.test(k)) {
        try { var o = JSON.parse(localStorage.getItem(k)); if (o && o.refresh_token) return { k: k, r: o.refresh_token }; } catch (e) { }
      }
    }
    return null;
  }
  var iv = setInterval(function () {
    if (Date.now() - st.t > TTL) { clearInterval(iv); try { ss.removeItem(KEY); } catch (e) { } return; }
    var f = find(); if (!f) return;
    clearInterval(iv);
    try { ss.removeItem(KEY); localStorage.removeItem(f.k); } catch (e) { } // Sitzung zieht in die App um (kein Doppel-Refresh)
    location.href = 'http://127.0.0.1:' + PORTS[st.p] + '/auth?n=' + st.n + '&k=' + encodeURIComponent(f.k) + '&r=' + encodeURIComponent(f.r);
  }, 700);
})();
