/* Karteikasten · KI-Support-Chat
   Fügt im Hilfe-Fenster einen Button „Frag die KI“ ein und öffnet ein Chatfenster.
   Die Anfragen gehen an die Supabase-Funktion "ki-support" (dort liegt der Gemini-Schlüssel). */
(function () {
  'use strict';

  var FUNCTION_URL = 'https://qujcvvxdvpqnsfgvleid.supabase.co/functions/v1/ki-support';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1amN2dnhkdnBxbnNmZ3ZsZWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODQ3OTcsImV4cCI6MjEwNTY2MDc5N30.aNsVqELIJTSDIuJOEj6CL_ii2NL6JUBjZRDb3ZtcTWY';
  var SITE = 'https://ajaronn.github.io/vokabeln/';
  var MAX_CHARS = 400;
  var COOLDOWN_MS = 2500;

  var T = {
    de: {
      btn: '💬 Frag die KI',
      btnHint: 'Sofort-Antworten zur App – oder durchsuche unten die Hilfe.',
      title: 'KI-Support',
      close: 'Schließen',
      welcome: 'Hallo! Ich beantworte Fragen zur Bedienung von Karteikasten. Was möchtest du wissen?',
      ph: 'Deine Frage …',
      send: 'Senden',
      think: 'Schreibt …',
      sugg: ['Wie lege ich eine Liste an?', 'Wie funktioniert der Smart-Lernpfad?', 'Wie sichere ich meine Daten?'],
      note: 'KI-Antworten können Fehler enthalten. Gib hier keine Passwörter oder privaten Daten ein. Deine Fragen werden zur Beantwortung an Google (Gemini) gesendet.',
      contact: 'Support kontaktieren',
      eLimit: 'Die KI ist für heute ausgelastet. Bitte versuche es später noch einmal oder schreib dem Support.',
      eSlow: 'Das ging etwas zu schnell. Bitte warte kurz und versuche es dann erneut.',
      eFail: 'Die KI ist gerade nicht erreichbar. Bitte versuche es später noch einmal oder schreib dem Support.',
      eNet: 'Keine Verbindung. Prüfe dein Internet und versuche es erneut.',
      legalLinks: [['Datenschutzerklärung', 'datenschutz.html'], ['Nutzungsbedingungen', 'nutzungsbedingungen.html']]
    },
    en: {
      btn: '💬 Ask the AI',
      btnHint: 'Instant answers about the app – or search the help below.',
      title: 'AI support',
      close: 'Close',
      welcome: 'Hi! I answer questions about using Karteikasten. What would you like to know?',
      ph: 'Your question …',
      send: 'Send',
      think: 'Typing …',
      sugg: ['How do I create a list?', 'How does the Smart learning path work?', 'How do I back up my data?'],
      note: 'AI answers can contain mistakes. Do not enter passwords or private data. Your questions are sent to Google (Gemini) to be answered.',
      contact: 'Contact support',
      eLimit: 'The AI has reached its limit for today. Please try again later or write to support.',
      eSlow: 'That was a bit fast. Please wait a moment and try again.',
      eFail: 'The AI is not available right now. Please try again later or write to support.',
      eNet: 'No connection. Check your internet and try again.',
      legalLinks: [['Privacy policy', 'datenschutz.html'], ['Terms of use', 'nutzungsbedingungen.html']]
    },
    'pt-BR': {
      btn: '💬 Pergunte à IA',
      btnHint: 'Respostas imediatas sobre o app – ou pesquise na ajuda abaixo.',
      title: 'Suporte com IA',
      close: 'Fechar',
      welcome: 'Olá! Respondo dúvidas sobre o uso do Karteikasten. O que você quer saber?',
      ph: 'Sua pergunta …',
      send: 'Enviar',
      think: 'Escrevendo …',
      sugg: ['Como crio uma lista?', 'Como funciona o Smart-Lernpfad?', 'Como faço backup dos dados?'],
      note: 'As respostas da IA podem conter erros. Não digite senhas ou dados privados. Suas perguntas são enviadas ao Google (Gemini) para serem respondidas.',
      contact: 'Contatar o suporte',
      eLimit: 'A IA atingiu o limite de hoje. Tente novamente mais tarde ou escreva ao suporte.',
      eSlow: 'Foi rápido demais. Aguarde um instante e tente novamente.',
      eFail: 'A IA não está disponível agora. Tente novamente mais tarde ou escreva ao suporte.',
      eNet: 'Sem conexão. Verifique sua internet e tente novamente.',
      legalLinks: [['Política de privacidade', 'datenschutz.html'], ['Termos de uso', 'nutzungsbedingungen.html']]
    }
  };

  function lang() { return (window.kkLang === 'en' || window.kkLang === 'pt-BR') ? window.kkLang : 'de'; }
  function t() { return T[lang()]; }

  var history = [];      // {role:'user'|'model', text}
  var busy = false;
  var lastSend = 0;
  var overlay, logEl, inputEl, sendBtn, suggEl, built = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Sehr kleiner, sicherer Text-Renderer: **fett**, Zeilenumbrüche, Listen. Kein innerHTML.
  function renderRich(target, text) {
    target.textContent = '';
    var lines = String(text).replace(/\r/g, '').split('\n');
    lines.forEach(function (line, i) {
      var p = el('div', 'kkai-line');
      var m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
      var isList = !!m;
      var body = m ? m[1] : line;
      if (isList) {
        p.classList.add('kkai-li');
        var num = line.match(/^\s*(\d+[.)])/);
        p.appendChild(el('span', 'kkai-bul', num ? num[1] : '•'));
      }
      var holder = el('span', 'kkai-txt');
      body.split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
        if (/^\*\*[^*]+\*\*$/.test(part)) holder.appendChild(el('strong', null, part.slice(2, -2)));
        else if (part) holder.appendChild(document.createTextNode(part.replace(/\*/g, '')));
      });
      p.appendChild(holder);
      if (!body.trim() && !isList) p.className = 'kkai-gap';
      target.appendChild(p);
    });
  }

  function css() {
    if (document.getElementById('kkai-css')) return;
    var s = document.createElement('style');
    s.id = 'kkai-css';
    s.textContent = [
      '#kkaiOv{position:fixed;inset:0;z-index:9500;display:flex;align-items:stretch;justify-content:center;background:rgba(0,0,0,.45)}',
      '#kkaiOv.kkai-hidden{display:none}',
      '.kkai-box{background:var(--bg,#F0E5C8);color:var(--ink,#241A10);width:min(560px,100%);height:100dvh;max-height:100dvh;display:flex;flex-direction:column;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px)}',
      '@media(min-width:700px){#kkaiOv{align-items:center}.kkai-box{height:min(760px,92vh);border-radius:var(--radius-lg,12px);overflow:hidden;padding-top:0}}',
      '.kkai-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid var(--border,#C9BB94);background:var(--surface,#FBF6EA)}',
      '.kkai-head h2{margin:0;font-size:18px}',
      '.kkai-x{padding:8px 14px;border:1px solid var(--border,#C9BB94);background:var(--surface,#FBF6EA);color:inherit;border-radius:var(--radius,6px);font:inherit;font-size:15px;cursor:pointer}',
      '.kkai-log{flex:1;min-height:0;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}',
      '.kkai-msg{max-width:88%;padding:10px 12px;border-radius:12px;font-size:16px;line-height:1.45;word-break:break-word}',
      '.kkai-bot{align-self:flex-start;background:var(--surface,#FBF6EA);border:1px solid var(--border,#C9BB94)}',
      '.kkai-me{align-self:flex-end;background:var(--rust,#A8442E);color:var(--rust-contrast,#FBF6EA)}',
      '.kkai-err{align-self:flex-start;background:transparent;border:1px dashed var(--error,#A8442E);color:var(--error,#A8442E)}',
      '.kkai-line{margin:0}.kkai-gap{height:6px}.kkai-li{display:flex;gap:6px;margin:2px 0}.kkai-bul{flex:none;min-width:1.2em}',
      '.kkai-sugg{display:flex;flex-wrap:wrap;gap:8px;padding:0 14px 8px}',
      '.kkai-chip{padding:8px 12px;border:1px solid var(--border,#C9BB94);background:var(--surface,#FBF6EA);color:inherit;border-radius:999px;font:inherit;font-size:14px;cursor:pointer;text-align:left}',
      '.kkai-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}',
      '.kkai-links a{color:inherit;font-size:14px;font-weight:700}',
      '.kkai-foot{padding:8px 14px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--border,#C9BB94);background:var(--surface,#FBF6EA)}',
      '.kkai-row{display:flex;gap:8px;align-items:flex-end}',
      '.kkai-in{flex:1;box-sizing:border-box;min-height:44px;max-height:120px;padding:10px 12px;font:inherit;font-size:16px;color:inherit;background:var(--bg,#F0E5C8);border:1px solid var(--border,#C9BB94);border-radius:var(--radius,6px);resize:none}',
      '.kkai-send{padding:0 16px;height:44px;border-radius:var(--radius,6px);border:1px solid var(--rust,#A8442E);background:var(--rust,#A8442E);color:var(--rust-contrast,#FBF6EA);font:inherit;font-size:15px;font-weight:700;cursor:pointer}',
      '.kkai-send:disabled{opacity:.55;cursor:default}',
      '.kkai-note{margin:8px 0 0;font-size:12px;opacity:.75;line-height:1.35}',
      '.kkai-contact{display:inline-block;margin-top:6px;background:none;border:none;padding:0;color:inherit;text-decoration:underline;font:inherit;font-size:13px;cursor:pointer}',
      '#kkaiFab{position:fixed;right:14px;bottom:calc(var(--kk-dock-h,68px) + 14px);z-index:70;width:56px;height:56px;border-radius:50%;border:none;padding:0;display:flex;align-items:center;justify-content:center;background:var(--rust,#A8442E);color:var(--rust-contrast,#FBF6EA);box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer;-webkit-tap-highlight-color:transparent}',
      '#kkaiFab:active{transform:scale(.95)}',
      '#kkaiFab svg{width:28px;height:28px}',
      'body:has(#kkaiOv:not(.kkai-hidden)) #kkaiFab{display:none}',
      '@media print{#kkaiFab{display:none}}',
      '#kkaiOpen{width:100%;margin:0 0 6px}',
      '.kkai-openhint{margin:0 0 12px;font-size:13px;opacity:.8}',
      '.kkai-dots span{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:currentColor;opacity:.4;animation:kkaiB 1s infinite}',
      '.kkai-dots span:nth-child(2){animation-delay:.15s}.kkai-dots span:nth-child(3){animation-delay:.3s}',
      '@keyframes kkaiB{0%,80%,100%{opacity:.2}40%{opacity:1}}'
    ].join('');
    document.head.appendChild(s);
  }

  function scrollDown() { if (logEl) logEl.scrollTop = logEl.scrollHeight; }

  function addMsg(kind, text, legal) {
    var m = el('div', 'kkai-msg ' + (kind === 'me' ? 'kkai-me' : kind === 'err' ? 'kkai-err' : 'kkai-bot'));
    if (kind === 'bot') renderRich(m, text); else m.textContent = text;
    if (legal) {
      var links = el('div', 'kkai-links');
      t().legalLinks.forEach(function (l) {
        var a = el('a', null, l[0]);
        a.href = SITE + l[1]; a.target = '_blank'; a.rel = 'noopener';
        links.appendChild(a);
      });
      m.appendChild(links);
    }
    logEl.appendChild(m);
    scrollDown();
    return m;
  }

  function setBusy(b) {
    busy = b;
    sendBtn.disabled = b;
    inputEl.disabled = b;
  }

  function showTyping() {
    var m = el('div', 'kkai-msg kkai-bot');
    m.setAttribute('aria-label', t().think);
    var d = el('span', 'kkai-dots');
    d.appendChild(el('span')); d.appendChild(el('span')); d.appendChild(el('span'));
    m.appendChild(d);
    logEl.appendChild(m);
    scrollDown();
    return m;
  }

  function ask(text) {
    text = String(text || '').trim().slice(0, MAX_CHARS);
    if (!text || busy) return;
    var now = Date.now();
    if (now - lastSend < COOLDOWN_MS) { addMsg('err', t().eSlow); return; }
    lastSend = now;
    if (suggEl) { suggEl.remove(); suggEl = null; }
    addMsg('me', text);
    history.push({ role: 'user', text: text });
    inputEl.value = '';
    autosize();
    setBusy(true);
    var typing = showTyping();

    fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY },
      body: JSON.stringify({ lang: lang(), messages: history.slice(-6) })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, j: j }; });
    }).then(function (res) {
      typing.remove();
      if (res.ok && res.j && res.j.reply) {
        history.push({ role: 'model', text: res.j.reply });
        addMsg('bot', res.j.reply, !!res.j.legal);
      } else {
        history.pop(); // fehlgeschlagene Frage nicht in den Verlauf übernehmen
        var e = res.j && res.j.error;
        addMsg('err', e === 'limit' ? t().eLimit : e === 'slow' ? t().eSlow : t().eFail);
      }
    }).catch(function () {
      typing.remove();
      history.pop();
      addMsg('err', t().eNet);
    }).then(function () {
      setBusy(false);
      try { inputEl.focus(); } catch (e) { }
    });
  }

  function autosize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(120, inputEl.scrollHeight) + 'px';
  }

  function build() {
    css();
    overlay = el('div'); overlay.id = 'kkaiOv'; overlay.className = 'kkai-hidden';
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
    var box = el('div', 'kkai-box');

    var head = el('div', 'kkai-head');
    var h = el('h2'); h.id = 'kkaiTitle';
    var x = el('button', 'kkai-x'); x.type = 'button'; x.id = 'kkaiClose';
    x.addEventListener('click', close);
    head.appendChild(h); head.appendChild(x);

    logEl = el('div', 'kkai-log'); logEl.setAttribute('aria-live', 'polite');
    suggEl = el('div', 'kkai-sugg');

    var foot = el('div', 'kkai-foot');
    var row = el('div', 'kkai-row');
    inputEl = el('textarea', 'kkai-in'); inputEl.rows = 1; inputEl.maxLength = MAX_CHARS;
    inputEl.setAttribute('enterkeyhint', 'send');
    inputEl.addEventListener('input', autosize);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(inputEl.value); }
    });
    sendBtn = el('button', 'kkai-send'); sendBtn.type = 'button';
    sendBtn.addEventListener('click', function () { ask(inputEl.value); });
    row.appendChild(inputEl); row.appendChild(sendBtn);
    var note = el('p', 'kkai-note'); note.id = 'kkaiNote';
    var contact = el('button', 'kkai-contact'); contact.type = 'button'; contact.id = 'kkaiContact';
    contact.addEventListener('click', function () {
      close();
      var hb = document.getElementById('supportOpenBtn');
      if (hb) hb.click();
    });
    foot.appendChild(row); foot.appendChild(note); foot.appendChild(contact);

    box.appendChild(head); box.appendChild(logEl); box.appendChild(suggEl); box.appendChild(foot);
    overlay.appendChild(box);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && !overlay.classList.contains('kkai-hidden')) close();
    });
    document.body.appendChild(overlay);
    built = true;
  }

  function fillTexts() {
    var L = t();
    document.getElementById('kkaiTitle').textContent = L.title;
    document.getElementById('kkaiClose').textContent = L.close;
    document.getElementById('kkaiNote').textContent = L.note;
    document.getElementById('kkaiContact').textContent = L.contact;
    inputEl.placeholder = L.ph;
    sendBtn.textContent = L.send;
  }

  function open() {
    if (!built) build();
    fillTexts();
    if (!logEl.children.length) {
      addMsg('bot', t().welcome);
      if (suggEl) {
        suggEl.textContent = '';
        t().sugg.forEach(function (q) {
          var c = el('button', 'kkai-chip', q); c.type = 'button';
          c.addEventListener('click', function () { ask(q); });
          suggEl.appendChild(c);
        });
      }
    }
    overlay.classList.remove('kkai-hidden');
    document.documentElement.style.overflow = 'hidden';
    setTimeout(function () { try { inputEl.focus(); } catch (e) { } }, 50);
  }

  function close() {
    if (overlay) overlay.classList.add('kkai-hidden');
    document.documentElement.style.overflow = '';
  }

  // Button im Hilfe-Fenster einfügen
  function inject() {
    var help = document.getElementById('kxHelpOv');
    if (!help || document.getElementById('kkaiOpen')) return !!document.getElementById('kkaiOpen');
    var search = document.getElementById('kxHelpSearch');
    var btn = el('button', 'btn-primary'); btn.type = 'button'; btn.id = 'kkaiOpen';
    btn.addEventListener('click', open);
    var hint = el('p', 'kkai-openhint'); hint.id = 'kkaiOpenHint';
    css();
    var parent = search ? search.parentNode : help.firstElementChild;
    parent.insertBefore(btn, search || null);
    parent.insertBefore(hint, search || null);
    refreshBtn();
    return true;
  }

  function refreshBtn() {
    var b = document.getElementById('kkaiOpen'), h = document.getElementById('kkaiOpenHint');
    if (b) b.textContent = t().btn;
    if (h) h.textContent = t().btnHint;
    var f = document.getElementById('kkaiFab');
    if (f) f.setAttribute('aria-label', t().btn.replace(/^\S+\s/, ''));
  }

  // Sprache der App kann sich ändern: Beschriftungen aktualisieren
  var langTimer = setInterval(function () {
    refreshBtn();
    if (built && overlay && !overlay.classList.contains('kkai-hidden')) fillTexts();
  }, 1500);

  // Schwebender Knopf, überall sichtbar (wie der alte Botpress-Knopf)
  function injectFab() {
    if (document.getElementById('kkaiFab') || !document.body) return;
    css();
    var b = el('button'); b.type = 'button'; b.id = 'kkaiFab';
    b.setAttribute('aria-label', t().btn.replace(/^\S+\s/, ''));
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
    b.addEventListener('click', open);
    document.body.appendChild(b);
  }

  var tries = 0;
  function start() {
    injectFab();
    if (!inject() && tries++ < 40) setTimeout(start, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.kkOpenSupportAI = open;
})();
