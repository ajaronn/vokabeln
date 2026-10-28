/* KI-Support-Chat für Karteikasten (ersetzt das Botpress-Widget).
   Spricht mit der Supabase-Edge-Function "support-ai"; der API-Schlüssel liegt nur dort. */
(function () {
  'use strict';
  var URL_ = 'https://qujcvvxdvpqnsfgvleid.supabase.co/functions/v1/support-ai';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1amN2dnhkdnBxbnNmZ3ZsZWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODQ3OTcsImV4cCI6MjEwNTY2MDc5N30.aNsVqELIJTSDIuJOEj6CL_ii2NL6JUBjZRDb3ZtcTWY';
  var STORE = 'kk_ai_chat_v1', msgs = [], busy = false;
  var L = (document.documentElement.lang || 'de').slice(0, 2);
  var T = { de: { title: 'KI-Assistent', hello: 'Hallo! Ich kenne Karteikasten und beantworte deine Fragen zur App. Was möchtest du wissen?', ph: 'Frage eingeben …', send: 'Senden', err: 'Fehler, versuche es später erneut.', lbl: 'KI-Hilfe', close: 'Schließen', reset: 'Neuer Chat', human: 'Support kontaktieren', ai: 'KI-Assistent fragen' },
            en: { title: 'AI assistant', hello: 'Hi! I know Karteikasten and can answer your questions about the app. What would you like to know?', ph: 'Type your question …', send: 'Send', err: 'Error, please try again later.', lbl: 'AI help', close: 'Close', reset: 'New chat', human: 'Contact support', ai: 'Ask the AI assistant' },
            pt: { title: 'Assistente de IA', hello: 'Olá! Conheço o Karteikasten e respondo às suas dúvidas sobre o app. O que quer saber?', ph: 'Digite sua pergunta …', send: 'Enviar', err: 'Erro, tente novamente mais tarde.', lbl: 'Ajuda IA', close: 'Fechar', reset: 'Novo chat', human: 'Falar com o suporte', ai: 'Perguntar à IA' } };
  function t(k) { var l = (window.kkLang || L || 'de').slice(0, 2); return (T[l] || T.de)[k]; }
  try { msgs = JSON.parse(sessionStorage.getItem(STORE) || '[]'); } catch (e) { msgs = []; }
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-24))); } catch (e) {} }

  var css = document.createElement('style');
  css.textContent =
    '#kkAiBtn{position:fixed;right:12px;bottom:calc(88px + env(safe-area-inset-bottom));z-index:2900;display:flex;align-items:center;gap:6px;padding:10px 14px;border-radius:999px;border:1.5px solid var(--rust,#A8442E);background:var(--rust,#A8442E);color:var(--rust-contrast,#FBF6EA);font:inherit;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}' +
    '#kkAiWin{position:fixed;right:12px;bottom:calc(88px + env(safe-area-inset-bottom));z-index:3100;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 110px));display:none;flex-direction:column;background:var(--surface,#FBF6EA);color:var(--ink,#241A10);border:1.5px solid var(--border,#C9BB94);border-radius:var(--radius-lg,12px);box-shadow:0 8px 30px rgba(0,0,0,.35);overflow:hidden}' +
    '#kkAiWin.open{display:flex}' +
    '#kkAiHead{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--border,#C9BB94);font-weight:700}' +
    '#kkAiHead span{flex:1}#kkAiHead button{border:1px solid var(--border,#C9BB94);background:var(--surface,#FBF6EA);color:inherit;border-radius:var(--radius,6px);padding:4px 10px;font:inherit;font-size:13px;cursor:pointer}' +
    '#kkAiLog{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px}' +
    '.kkAiM{max-width:88%;padding:8px 12px;border-radius:12px;font-size:15px;line-height:1.4;white-space:pre-wrap;word-wrap:break-word}' +
    '.kkAiM.bot{align-self:flex-start;background:var(--bg,#F0E5C8);border:1px solid var(--border,#C9BB94)}' +
    '.kkAiM.user{align-self:flex-end;background:var(--rust,#A8442E);color:var(--rust-contrast,#FBF6EA)}' +
    '.kkAiM.err{color:var(--error,#A8442E)}' +
    '#kkAiForm{display:flex;gap:8px;padding:10px;border-top:1px solid var(--border,#C9BB94)}' +
    '#kkAiIn{flex:1;min-width:0;padding:10px;font:inherit;font-size:16px;border:1px solid var(--border,#C9BB94);border-radius:var(--radius,6px);background:var(--surface,#FBF6EA);color:inherit}' +
    '#kkAiSend{padding:8px 14px;border-radius:var(--radius,6px);border:1px solid var(--rust,#A8442E);background:var(--rust,#A8442E);color:var(--rust-contrast,#FBF6EA);font:inherit;font-size:15px;cursor:pointer}' +
    '#kkAiSend:disabled{opacity:.6}#kkAiFoot{padding:0 10px 8px;font-size:12px;text-align:center}#kkAiFoot button{background:none;border:0;color:inherit;text-decoration:underline;opacity:.8;cursor:pointer;font:inherit}';
  document.head.appendChild(css);

  function el(tag, attrs, txt) { var e = document.createElement(tag); for (var k in (attrs || {})) e.setAttribute(k, attrs[k]); if (txt) e.textContent = txt; return e; }
  var btn = el('button', { id: 'kkAiBtn', type: 'button', 'aria-label': 'KI-Assistent', 'data-kk-nt': '' });
  var win = el('div', { id: 'kkAiWin', role: 'dialog', 'aria-label': 'KI-Assistent', 'data-kk-nt': '' });
  var head = el('div', { id: 'kkAiHead' }); var title = el('span'); var bReset = el('button', { type: 'button' }); var bClose = el('button', { type: 'button' });
  head.append(title, bReset, bClose);
  var log = el('div', { id: 'kkAiLog', 'aria-live': 'polite' });
  var form = el('form', { id: 'kkAiForm' }); var input = el('input', { id: 'kkAiIn', type: 'text', maxlength: '1000', autocomplete: 'off' }); var send = el('button', { id: 'kkAiSend', type: 'submit' });
  form.append(input, send);
  var foot = el('div', { id: 'kkAiFoot' }); var bHuman = el('button', { type: 'button' }); foot.append(bHuman);
  win.append(head, log, form, foot);

  function labels() {
    btn.textContent = '💬 ' + t('lbl'); title.textContent = t('title'); bReset.textContent = t('reset'); bClose.textContent = t('close');
    input.placeholder = t('ph'); send.textContent = t('send'); bHuman.textContent = t('human');
    var h = document.getElementById('kkAiHelpBtn'); if (h) h.textContent = t('ai');
  }
  function add(role, text, isErr) { var m = el('div', { class: 'kkAiM ' + role + (isErr ? ' err' : '') }, text); log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }
  function render() { log.textContent = ''; add('bot', t('hello')); msgs.forEach(function (m) { add(m.role === 'user' ? 'user' : 'bot', m.content); }); }
  function open() { win.classList.add('open'); btn.style.display = 'none'; render(); setTimeout(function () { input.focus(); }, 50); }
  function close() { win.classList.remove('open'); btn.style.display = ''; }
  window.kkAiOpen = open;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim(); if (!q || busy) return;
    input.value = ''; busy = true; send.disabled = true;
    msgs.push({ role: 'user', content: q }); add('user', q);
    var wait = add('bot', '…');
    fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: 'Bearer ' + ANON }, body: JSON.stringify({ messages: msgs.slice(-12) }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (!x.ok || !x.d.reply) { wait.textContent = (x.d && x.d.error && x.ok === false && /Zu viele/.test(x.d.error)) ? x.d.error : t('err'); wait.classList.add('err'); msgs.pop(); }
        else { wait.textContent = x.d.reply; msgs.push({ role: 'assistant', content: x.d.reply }); }
      })
      .catch(function () { wait.textContent = t('err'); wait.classList.add('err'); msgs.pop(); })
      .then(function () { busy = false; send.disabled = false; save(); log.scrollTop = log.scrollHeight; input.focus(); });
  });
  bClose.addEventListener('click', close);
  bReset.addEventListener('click', function () { msgs = []; save(); render(); });
  btn.addEventListener('click', open);
  bHuman.addEventListener('click', function () { var s = document.getElementById('supportOpenBtn'); close(); if (s) s.click(); });

  function init() {
    document.body.append(btn, win); labels();
    var hs = document.getElementById('kxHelpSupport');
    if (hs && !document.getElementById('kkAiHelpBtn')) {
      var hb = el('button', { id: 'kkAiHelpBtn', type: 'button', class: 'btn-primary', style: 'width:100%;margin-bottom:8px' });
      hb.addEventListener('click', function () { var ov = document.getElementById('kxHelpOv'); var c = document.getElementById('kxHelpClose'); if (c) c.click(); else if (ov) ov.classList.add('hidden'); open(); });
      hs.parentNode.insertBefore(hb, hs); labels();
    }
    setInterval(labels, 3000); // folgt der Sprachumschaltung der App
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
