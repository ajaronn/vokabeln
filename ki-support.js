/* Karteikasten · KI-Support-Chat
   - schwebender Knopf (überall), Buttons im Hilfe- und Support-Fenster
   - Chat mit Logo, Emoji-Auswahl, Bild-Upload, Weiterleitung an den Support
   Die Anfragen gehen an die Supabase-Funktion "ki-support" (dort liegt der Gemini-Schlüssel). */
(function () {
  'use strict';

  var PROJECT = 'qujcvvxdvpqnsfgvleid';
  var FUNCTION_URL = 'https://' + PROJECT + '.supabase.co/functions/v1/ki-support';
  var SUPPORT_URL = 'https://' + PROJECT + '.supabase.co/functions/v1/support-message';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1amN2dnhkdnBxbnNmZ3ZsZWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODQ3OTcsImV4cCI6MjEwNTY2MDc5N30.aNsVqELIJTSDIuJOEj6CL_ii2NL6JUBjZRDb3ZtcTWY';
  var SITE = 'https://ajaronn.github.io/vokabeln/';
  var SUPPORT_MAIL = 'karteikasten@icloud.com';
  var LOGO = SITE + 'icon-192.png';
  try { if (document.currentScript && document.currentScript.src) LOGO = new URL('icon-192.png', document.currentScript.src).href; } catch (e) { }
  var MAX_CHARS = 400;
  var COOLDOWN_MS = 2500;
  var IMG_MAX_SIDE = 1280;

  var EMOJIS = ['😀','😃','😄','😁','😅','😂','🙂','😉','😊','😍','🤔','😮','😢','😭','😡','😴','👍','👎','👏','🙏','💪','🎉','🔥','⭐','❤️','✅','❌','❓','❗','📚','✏️','📝','🧠','💡','🔒','🔑','⏰','📱','💻','🌍'];

  var T = {
    de: {
      btn: 'Frag den KI support',
      btnHint: 'Sofort-Antworten zur App – oder durchsuche unten die Hilfe.',
      btnHint2: 'Sofort-Antworten zur App – oder schreib uns unten eine Nachricht.',
      title: 'KI-Support',
      close: 'Schließen',
      welcome: 'Hallo! Ich beantworte Fragen zur Bedienung von Karteikasten. Du kannst auch ein Bild anhängen. Was möchtest du wissen?',
      ph: 'Deine Frage …',
      send: 'Senden', attach: 'Bild anhängen', emoji: 'Emoji einfügen', removeImg: 'Bild entfernen',
      think: 'Schreibt …',
      sugg: ['Wie lege ich eine Liste an?', 'Wie funktioniert der Smart-Lernpfad?', 'Wie sichere ich meine Daten?'],
      note: 'KI-Antworten können Fehler enthalten. Gib hier keine Passwörter oder privaten Daten ein. Fragen und Bilder werden zur Beantwortung an Google (Gemini) gesendet.',
      contact: 'Support kontaktieren',
      eLimit: 'Die KI ist für heute ausgelastet. Bitte versuche es später noch einmal oder schreib dem Support.',
      eSlow: 'Das ging etwas zu schnell. Bitte warte kurz und versuche es dann erneut.',
      eFail: 'Die KI ist gerade nicht erreichbar. Bitte versuche es später noch einmal oder schreib dem Support.',
      eNet: 'Keine Verbindung. Prüfe dein Internet und versuche es erneut.',
      eImg: 'Dieses Bild kann ich nicht verwenden. Bitte wähle ein Foto oder einen Screenshot (JPG, PNG, WebP).',
      imgOnly: '(Bild ohne Text)',
      dTitle: 'Nachricht an den Support',
      dMail: 'Deine E-Mail-Adresse (für die Antwort)',
      dSend: 'An Support senden', dCancel: 'Abbrechen',
      dBadMail: 'Bitte gib eine gültige E-Mail-Adresse ein.',
      dShort: 'Bitte schreibe eine Nachricht.',
      dSending: 'Wird gesendet …',
      dSent: 'Danke! Deine Nachricht wurde an den Support gesendet. Du bekommst eine Antwort per E-Mail.',
      dFail: 'Senden fehlgeschlagen. Bitte schreibe direkt an ' + SUPPORT_MAIL + '.',
      dCancelled: 'Okay, ich habe nichts gesendet.',
      legalLinks: [['Datenschutzerklärung', 'datenschutz.html'], ['Nutzungsbedingungen', 'nutzungsbedingungen.html']]
    },
    en: {
      btn: 'Ask the AI support',
      btnHint: 'Instant answers about the app – or search the help below.',
      btnHint2: 'Instant answers about the app – or write us a message below.',
      title: 'AI support',
      close: 'Close',
      welcome: 'Hi! I answer questions about using Karteikasten. You can also attach an image. What would you like to know?',
      ph: 'Your question …',
      send: 'Send', attach: 'Attach image', emoji: 'Insert emoji', removeImg: 'Remove image',
      think: 'Typing …',
      sugg: ['How do I create a list?', 'How does the Smart learning path work?', 'How do I back up my data?'],
      note: 'AI answers can contain mistakes. Do not enter passwords or private data. Questions and images are sent to Google (Gemini) to be answered.',
      contact: 'Contact support',
      eLimit: 'The AI has reached its limit for today. Please try again later or write to support.',
      eSlow: 'That was a bit fast. Please wait a moment and try again.',
      eFail: 'The AI is not available right now. Please try again later or write to support.',
      eNet: 'No connection. Check your internet and try again.',
      eImg: "I can't use this image. Please choose a photo or screenshot (JPG, PNG, WebP).",
      imgOnly: '(image without text)',
      dTitle: 'Message to support',
      dMail: 'Your email address (for the reply)',
      dSend: 'Send to support', dCancel: 'Cancel',
      dBadMail: 'Please enter a valid email address.',
      dShort: 'Please write a message.',
      dSending: 'Sending …',
      dSent: 'Thanks! Your message was sent to support. You will get a reply by email.',
      dFail: 'Sending failed. Please write directly to ' + SUPPORT_MAIL + '.',
      dCancelled: 'Okay, I did not send anything.',
      legalLinks: [['Privacy policy', 'datenschutz.html'], ['Terms of use', 'nutzungsbedingungen.html']]
    },
    'pt-BR': {
      btn: 'Pergunte ao supporte de IA',
      btnHint: 'Respostas imediatas sobre o app – ou pesquise na ajuda abaixo.',
      btnHint2: 'Respostas imediatas sobre o app – ou escreva-nos uma mensagem abaixo.',
      title: 'Suporte com IA',
      close: 'Fechar',
      welcome: 'Olá! Respondo dúvidas sobre o uso do Karteikasten. Você também pode anexar uma imagem. O que você quer saber?',
      ph: 'Sua pergunta …',
      send: 'Enviar', attach: 'Anexar imagem', emoji: 'Inserir emoji', removeImg: 'Remover imagem',
      think: 'Escrevendo …',
      sugg: ['Como crio uma lista?', 'Como funciona o Smart-Lernpfad?', 'Como faço backup dos dados?'],
      note: 'As respostas da IA podem conter erros. Não digite senhas ou dados privados. Perguntas e imagens são enviadas ao Google (Gemini) para serem respondidas.',
      contact: 'Contatar o suporte',
      eLimit: 'A IA atingiu o limite de hoje. Tente novamente mais tarde ou escreva ao suporte.',
      eSlow: 'Foi rápido demais. Aguarde um instante e tente novamente.',
      eFail: 'A IA não está disponível agora. Tente novamente mais tarde ou escreva ao suporte.',
      eNet: 'Sem conexão. Verifique sua internet e tente novamente.',
      eImg: 'Não consigo usar esta imagem. Escolha uma foto ou captura de tela (JPG, PNG, WebP).',
      imgOnly: '(imagem sem texto)',
      dTitle: 'Mensagem ao suporte',
      dMail: 'Seu e-mail (para a resposta)',
      dSend: 'Enviar ao suporte', dCancel: 'Cancelar',
      dBadMail: 'Informe um e-mail válido.',
      dShort: 'Escreva uma mensagem.',
      dSending: 'Enviando …',
      dSent: 'Obrigado! Sua mensagem foi enviada ao suporte. Você receberá a resposta por e-mail.',
      dFail: 'Falha ao enviar. Escreva diretamente para ' + SUPPORT_MAIL + '.',
      dCancelled: 'Certo, não enviei nada.',
      legalLinks: [['Política de privacidade', 'datenschutz.html'], ['Termos de uso', 'nutzungsbedingungen.html']]
    }
  };

  function lang() { return (window.kkLang === 'en' || window.kkLang === 'pt-BR') ? window.kkLang : 'de'; }
  function t() { return T[lang()]; }
  function plainBtn() { return t().btn.replace(/^\S+\s/, ''); }

  var ICON_SEND = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
  var ICON_CLIP = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.4 11.1l-9.2 9.2a5.5 5.5 0 0 1-7.8-7.8l9.2-9.2a3.7 3.7 0 0 1 5.2 5.2l-9.2 9.2a1.8 1.8 0 0 1-2.6-2.6l8.5-8.5"/></svg>';
  var ICON_SMILE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/></svg>';
  var ICON_BUBBLE = '<svg viewBox="0 0 100 84" fill="none" stroke="#111" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M32 8H68Q92 8 92 32V36Q92 60 68 60H57L41 77L45 60H32Q8 60 8 36V32Q8 8 32 8Z"/></svg>';

  var history = [];      // {role:'user'|'model', text}
  var busy = false;
  var lastSend = 0;
  var pendingImg = null; // {dataUrl, b64}
  var overlay, logEl, inputEl, sendBtn, suggEl, previewEl, emojiEl, fileEl, built = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function iconBtn(cls, id, svg) {
    var b = el('button', cls); b.type = 'button'; if (id) b.id = id; b.innerHTML = svg; return b;
  }

  // ---------- Anmeldung (nur lesen, damit Support-Antworten zum Konto passen) ----------
  function session() {
    try {
      var raw = localStorage.getItem('sb-' + PROJECT + '-auth-token');
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (s && s.currentSession) s = s.currentSession;
      if (!s || !s.access_token) return null;
      var pl = JSON.parse(atob(s.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!pl.exp || pl.exp * 1000 < Date.now() + 15000) return { token: '', email: (s.user && s.user.email) || '' };
      return { token: s.access_token, email: (s.user && s.user.email) || pl.email || '' };
    } catch (e) { return null; }
  }

  // Sehr kleiner, sicherer Text-Renderer: **fett**, Zeilenumbrüche, Listen. Kein innerHTML.
  function renderRich(target, text) {
    target.textContent = '';
    String(text).replace(/\r/g, '').split('\n').forEach(function (line) {
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
      '.kkai-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;border-bottom:1px solid var(--border,#C9BB94);background:var(--surface,#FBF6EA)}',
      '.kkai-who{display:flex;align-items:center;gap:10px;min-width:0}',
      '.kkai-head h2{margin:0;font-size:18px}',
      '.kkai-hava{flex:none;width:36px;height:36px;border-radius:10px;object-fit:cover}',
      '.kkai-x{padding:8px 14px;border:1px solid var(--border,#C9BB94);background:var(--surface,#FBF6EA);color:inherit;border-radius:var(--radius,6px);font:inherit;font-size:15px;cursor:pointer}',
      '.kkai-log{flex:1;min-height:0;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}',
      '.kkai-msg{max-width:88%;padding:10px 12px;border-radius:12px;font-size:16px;line-height:1.45;word-break:break-word}',
      '.kkai-bot{align-self:flex-start;background:var(--surface,#FBF6EA);border:1px solid var(--border,#C9BB94)}',
      '.kkai-me{align-self:flex-end;background:var(--rust,#A8442E);color:var(--rust-contrast,#FBF6EA)}',
      '.kkai-pic{display:block;max-width:100%;max-height:180px;border-radius:8px;margin-bottom:6px}',
      '.kkai-brow{display:flex;align-items:flex-end;gap:8px;align-self:flex-start;max-width:94%}',
      '.kkai-brow .kkai-msg{max-width:none;min-width:0}',
      '.kkai-ava{flex:none;width:34px;height:34px;border-radius:9px;object-fit:cover;background:var(--surface,#FBF6EA)}',
      '.kkai-err{align-self:flex-start;background:transparent;border:1px dashed var(--error,#A8442E);color:var(--error,#A8442E)}',
      '.kkai-line{margin:0}.kkai-gap{height:6px}.kkai-li{display:flex;gap:6px;margin:2px 0}.kkai-bul{flex:none;min-width:1.2em}',
      '.kkai-card{align-self:stretch;background:var(--surface,#FBF6EA);border:1px solid var(--rust,#A8442E);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px}',
      '.kkai-card .kkai-in{width:100%;min-height:44px;max-height:none}',
      '.kkai-card textarea.kkai-in{min-height:110px;resize:vertical}',
      '.kkai-cardmsg{font-size:14px;min-height:18px}.kkai-cardmsg.kkai-bad{color:var(--error,#A8442E)}',
      '.kkai-cardrow{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}',
      '.kkai-btn2{padding:10px 14px;border-radius:var(--radius,6px);border:1px solid var(--border,#C9BB94);background:var(--surface,#FBF6EA);color:inherit;font:inherit;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}',
      '.kkai-btn2.kkai-prim{background:var(--rust,#A8442E);border-color:var(--rust,#A8442E);color:var(--rust-contrast,#FBF6EA);font-weight:700}',
      '.kkai-btn2:disabled{opacity:.55;cursor:default}',
      '.kkai-sugg{display:flex;flex-wrap:wrap;gap:8px;padding:0 14px 8px}',
      '.kkai-chip{padding:8px 12px;border:1px solid var(--border,#C9BB94);background:var(--surface,#FBF6EA);color:inherit;border-radius:999px;font:inherit;font-size:14px;cursor:pointer;text-align:left}',
      '.kkai-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}',
      '.kkai-links a{color:inherit;font-size:14px;font-weight:700}',
      '.kkai-foot{padding:8px 14px calc(10px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--border,#C9BB94);background:var(--surface,#FBF6EA)}',
      '.kkai-prev{display:flex;align-items:center;gap:10px;margin-bottom:8px}',
      '.kkai-prev.kkai-hidden{display:none}',
      '.kkai-prev img{width:54px;height:54px;object-fit:cover;border-radius:8px;border:1px solid var(--border,#C9BB94)}',
      '.kkai-emo{display:grid;grid-template-columns:repeat(8,1fr);gap:2px;margin-bottom:8px;padding:6px;border:1px solid var(--border,#C9BB94);border-radius:var(--radius,6px);background:var(--bg,#F0E5C8)}',
      '.kkai-emo.kkai-hidden{display:none}',
      '.kkai-emo button{border:none;background:none;font-size:22px;line-height:1;padding:6px 0;cursor:pointer;border-radius:6px}',
      '.kkai-row{display:flex;gap:6px;align-items:flex-end}',
      '.kkai-ib{flex:none;width:40px;height:44px;display:flex;align-items:center;justify-content:center;border:none;background:none;color:inherit;opacity:.8;cursor:pointer;border-radius:var(--radius,6px);padding:0}',
      '.kkai-ib:disabled{opacity:.35}',
      '.kkai-in{flex:1;box-sizing:border-box;min-height:44px;max-height:120px;padding:10px 12px;font:inherit;font-size:16px;color:inherit;background:var(--bg,#F0E5C8);border:1px solid var(--border,#C9BB94);border-radius:var(--radius,6px);resize:none}',
      '.kkai-send{flex:none;width:46px;height:44px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:var(--radius,6px);border:1px solid var(--rust,#A8442E);background:var(--rust,#A8442E);color:var(--rust-contrast,#FBF6EA);cursor:pointer}',
      '.kkai-send:disabled{opacity:.55;cursor:default}',
      '.kkai-note{margin:8px 0 0;font-size:12px;opacity:.75;line-height:1.35}',
      '.kkai-contact{display:inline-block;margin-top:6px;background:none;border:none;padding:0;color:inherit;text-decoration:underline;font:inherit;font-size:13px;cursor:pointer}',
      '#kkaiFab{position:fixed;right:14px;bottom:calc(var(--kk-dock-h,68px) + 14px);z-index:70;width:56px;height:56px;border-radius:50%;border:none;padding:0;display:flex;align-items:center;justify-content:center;background:var(--rust,#A8442E);box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer;-webkit-tap-highlight-color:transparent}',
      '#kkaiFab:active{transform:scale(.95)}',
      '#kkaiFab svg{width:34px;height:34px}',
      'body:has(#kkaiOv:not(.kkai-hidden)) #kkaiFab{display:none}',
      '@media print{#kkaiFab{display:none}}',
      '#kkaiOpen,#kkaiOpen2{width:100%;margin:0 0 6px}',
      '.kkai-openhint{margin:0 0 12px;font-size:13px;opacity:.8}',
      '.kkai-dots span{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:currentColor;opacity:.4;animation:kkaiB 1s infinite}',
      '.kkai-dots span:nth-child(2){animation-delay:.15s}.kkai-dots span:nth-child(3){animation-delay:.3s}',
      '@keyframes kkaiB{0%,80%,100%{opacity:.2}40%{opacity:1}}'
    ].join('');
    document.head.appendChild(s);
  }

  function scrollDown() { if (logEl) logEl.scrollTop = logEl.scrollHeight; }

  function withAvatar(m) {
    var row = el('div', 'kkai-brow');
    var img = el('img', 'kkai-ava'); img.src = LOGO; img.alt = ''; img.setAttribute('aria-hidden', 'true');
    row.appendChild(img); row.appendChild(m);
    return row;
  }

  function addMsg(kind, text, extra) {
    var m = el('div', 'kkai-msg ' + (kind === 'me' ? 'kkai-me' : kind === 'err' ? 'kkai-err' : 'kkai-bot'));
    if (kind === 'me' && extra) { var pic = el('img', 'kkai-pic'); pic.src = extra; pic.alt = ''; m.appendChild(pic); }
    if (kind === 'bot') renderRich(m, text); else m.appendChild(document.createTextNode(text));
    if (kind === 'bot' && extra === true) {
      var links = el('div', 'kkai-links');
      t().legalLinks.forEach(function (l) {
        var a = el('a', null, l[0]);
        a.href = SITE + l[1]; a.target = '_blank'; a.rel = 'noopener';
        links.appendChild(a);
      });
      m.appendChild(links);
    }
    var out = kind === 'bot' ? withAvatar(m) : m;
    logEl.appendChild(out);
    scrollDown();
    return out;
  }

  function showTyping() {
    var m = el('div', 'kkai-msg kkai-bot');
    m.setAttribute('aria-label', t().think);
    var d = el('span', 'kkai-dots');
    d.appendChild(el('span')); d.appendChild(el('span')); d.appendChild(el('span'));
    m.appendChild(d);
    var row = withAvatar(m);
    logEl.appendChild(row);
    scrollDown();
    return row;
  }

  function setBusy(b) {
    busy = b;
    sendBtn.disabled = b;
    inputEl.disabled = b;
  }

  // ---------- Bild-Upload (wird im Browser verkleinert) ----------
  function prepareImage(file) {
    return new Promise(function (res, rej) {
      if (!file || !/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) || file.size > 25 * 1024 * 1024) return rej();
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth, h = img.naturalHeight;
          if (!w || !h) throw new Error('size');
          var sc = Math.min(1, IMG_MAX_SIDE / Math.max(w, h));
          var c = document.createElement('canvas');
          c.width = Math.round(w * sc); c.height = Math.round(h * sc);
          var cx = c.getContext('2d');
          cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
          cx.drawImage(img, 0, 0, c.width, c.height);
          var q = 0.82, d = c.toDataURL('image/jpeg', q);
          while (d.length > 1500000 && q > 0.4) { q -= 0.14; d = c.toDataURL('image/jpeg', q); }
          if (d.length > 1700000) throw new Error('big');
          URL.revokeObjectURL(url);
          res({ dataUrl: d, b64: d.split(',')[1] });
        } catch (e) { URL.revokeObjectURL(url); rej(); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(); };
      img.src = url;
    });
  }

  function setPending(p) {
    pendingImg = p;
    previewEl.textContent = '';
    if (!p) { previewEl.classList.add('kkai-hidden'); return; }
    var im = el('img'); im.src = p.dataUrl; im.alt = '';
    var rm = el('button', 'kkai-btn2', t().removeImg); rm.type = 'button';
    rm.addEventListener('click', function () { setPending(null); });
    previewEl.appendChild(im); previewEl.appendChild(rm);
    previewEl.classList.remove('kkai-hidden');
  }

  // ---------- Emoji-Auswahl ----------
  function insertAtCursor(s) {
    var v = inputEl.value;
    var a = inputEl.selectionStart == null ? v.length : inputEl.selectionStart;
    var b = inputEl.selectionEnd == null ? a : inputEl.selectionEnd;
    if (v.length - (b - a) + s.length > MAX_CHARS) return;
    inputEl.value = v.slice(0, a) + s + v.slice(b);
    try { inputEl.setSelectionRange(a + s.length, a + s.length); } catch (e) { }
    autosize();
  }

  // ---------- Nachricht an den Support ----------
  function sendToSupport(text, email) {
    var ctx = 'Seite: ' + location.pathname + '\nSprache: ' + lang() + '\nGerät: ' + (navigator.userAgent || '').slice(0, 140) + '\nQuelle: KI-Support-Chat';
    var transcript = history.slice(-6).map(function (m) { return (m.role === 'user' ? 'Nutzer: ' : 'KI: ') + m.text; }).join('\n').slice(0, 1200);
    var message = text + '\n\n---- Aus dem KI-Support-Chat ----\n' + transcript + '\n\n---- Automatisch mitgesendet ----\n' + ctx;
    var body = JSON.stringify({ lang: lang(), email: email, message: message, context: ctx });
    function go(token) {
      return fetch(SUPPORT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + token }, body: body })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && !(j && j.error), status: r.status }; }); });
    }
    var s = session(), tok = (s && s.token) || ANON_KEY;
    return go(tok).then(function (res) { return (res.status === 401 && tok !== ANON_KEY) ? go(ANON_KEY) : res; }).then(function (res) { return res.ok; }).catch(function () { return false; });
  }

  function addDraft(draft) {
    var L = t(), s = session();
    var card = el('div', 'kkai-card');
    card.appendChild(el('strong', null, L.dTitle));
    var ta = el('textarea', 'kkai-in'); ta.maxLength = 1000; ta.value = draft; ta.setAttribute('aria-label', L.dTitle);
    var mail = el('input', 'kkai-in'); mail.type = 'email'; mail.autocomplete = 'email'; mail.setAttribute('inputmode', 'email');
    mail.placeholder = L.dMail; mail.setAttribute('aria-label', L.dMail); mail.value = (s && s.email) || '';
    var msg = el('div', 'kkai-cardmsg'); msg.setAttribute('aria-live', 'polite');
    var row = el('div', 'kkai-cardrow');
    var cancel = el('button', 'kkai-btn2', L.dCancel); cancel.type = 'button';
    var send = el('button', 'kkai-btn2 kkai-prim'); send.type = 'button';
    send.innerHTML = ICON_SEND; send.appendChild(document.createTextNode(L.dSend));
    cancel.addEventListener('click', function () { card.remove(); addMsg('bot', L.dCancelled); });
    send.addEventListener('click', function () {
      var text = ta.value.trim(), em = mail.value.trim();
      msg.className = 'kkai-cardmsg kkai-bad';
      if (text.length < 5) { msg.textContent = L.dShort; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { msg.textContent = L.dBadMail; return; }
      msg.className = 'kkai-cardmsg'; msg.textContent = L.dSending;
      send.disabled = true; cancel.disabled = true;
      sendToSupport(text, em).then(function (ok) {
        if (ok) { card.remove(); addMsg('bot', L.dSent); history.push({ role: 'model', text: L.dSent }); }
        else { send.disabled = false; cancel.disabled = false; msg.className = 'kkai-cardmsg kkai-bad'; msg.textContent = L.dFail; }
      });
    });
    row.appendChild(cancel); row.appendChild(send);
    card.appendChild(ta); card.appendChild(mail); card.appendChild(msg); card.appendChild(row);
    logEl.appendChild(card);
    scrollDown();
  }

  // ---------- Fragen an die KI ----------
  function ask(text) {
    text = String(text || '').trim().slice(0, MAX_CHARS);
    var img = pendingImg;
    if ((!text && !img) || busy) return;
    if (!text) text = t().imgOnly;
    var now = Date.now();
    if (now - lastSend < COOLDOWN_MS) { addMsg('err', t().eSlow); return; }
    lastSend = now;
    if (suggEl) { suggEl.remove(); suggEl = null; }
    emojiEl.classList.add('kkai-hidden');
    addMsg('me', text, img && img.dataUrl);
    history.push({ role: 'user', text: text });
    inputEl.value = '';
    autosize();
    setPending(null);
    setBusy(true);
    var typing = showTyping();

    fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY },
      body: JSON.stringify({ lang: lang(), messages: history.slice(-6), image: img ? { mime: 'image/jpeg', data: img.b64 } : undefined })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, j: j }; });
    }).then(function (res) {
      typing.remove();
      if (res.ok && res.j && res.j.reply) {
        history.push({ role: 'model', text: res.j.reply });
        addMsg('bot', res.j.reply, !!res.j.legal);
        if (res.j.supportDraft) addDraft(String(res.j.supportDraft));
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
    var who = el('div', 'kkai-who');
    var hava = el('img', 'kkai-hava'); hava.src = LOGO; hava.alt = ''; hava.setAttribute('aria-hidden', 'true');
    var h = el('h2'); h.id = 'kkaiTitle';
    who.appendChild(hava); who.appendChild(h);
    var x = el('button', 'kkai-x'); x.type = 'button'; x.id = 'kkaiClose';
    x.addEventListener('click', close);
    head.appendChild(who); head.appendChild(x);

    logEl = el('div', 'kkai-log'); logEl.setAttribute('aria-live', 'polite');
    suggEl = el('div', 'kkai-sugg');

    var foot = el('div', 'kkai-foot');
    previewEl = el('div', 'kkai-prev kkai-hidden');
    emojiEl = el('div', 'kkai-emo kkai-hidden');
    EMOJIS.forEach(function (e) {
      var b = el('button', null, e); b.type = 'button';
      b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      b.addEventListener('click', function () { insertAtCursor(e); });
      emojiEl.appendChild(b);
    });

    fileEl = document.createElement('input');
    fileEl.type = 'file'; fileEl.accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif'; fileEl.style.display = 'none';
    fileEl.addEventListener('change', function () {
      var f = fileEl.files && fileEl.files[0];
      fileEl.value = '';
      if (!f) return;
      prepareImage(f).then(setPending).catch(function () { addMsg('err', t().eImg); });
    });

    var row = el('div', 'kkai-row');
    var attachBtn = iconBtn('kkai-ib', 'kkaiAttach', ICON_CLIP);
    attachBtn.addEventListener('click', function () { fileEl.click(); });
    var emoBtn = iconBtn('kkai-ib', 'kkaiEmoBtn', ICON_SMILE);
    emoBtn.addEventListener('click', function () { emojiEl.classList.toggle('kkai-hidden'); });
    inputEl = el('textarea', 'kkai-in'); inputEl.rows = 1; inputEl.maxLength = MAX_CHARS;
    inputEl.setAttribute('enterkeyhint', 'send');
    inputEl.addEventListener('input', autosize);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(inputEl.value); }
    });
    sendBtn = iconBtn('kkai-send', 'kkaiSend', ICON_SEND);
    sendBtn.addEventListener('click', function () { ask(inputEl.value); });
    row.appendChild(attachBtn); row.appendChild(emoBtn); row.appendChild(inputEl); row.appendChild(sendBtn);

    var note = el('p', 'kkai-note'); note.id = 'kkaiNote';
    var contact = el('button', 'kkai-contact'); contact.type = 'button'; contact.id = 'kkaiContact';
    contact.addEventListener('click', function () {
      close();
      var hb = document.getElementById('supportOpenBtn');
      if (hb) hb.click();
    });
    foot.appendChild(previewEl); foot.appendChild(emojiEl); foot.appendChild(row); foot.appendChild(fileEl);
    foot.appendChild(note); foot.appendChild(contact);

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
    sendBtn.setAttribute('aria-label', L.send); sendBtn.title = L.send;
    var a = document.getElementById('kkaiAttach'); a.setAttribute('aria-label', L.attach); a.title = L.attach;
    var e = document.getElementById('kkaiEmoBtn'); e.setAttribute('aria-label', L.emoji); e.title = L.emoji;
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
    if (emojiEl) emojiEl.classList.add('kkai-hidden');
    document.documentElement.style.overflow = '';
  }

  // Button im Hilfe-Fenster und im Support-Fenster einfügen
  function makeOpenBtn(id, hintId, beforeNode, parent, closeFirst) {
    var btn = el('button', 'btn-primary'); btn.type = 'button'; btn.id = id;
    btn.addEventListener('click', function () {
      if (closeFirst) { var cb = document.getElementById(closeFirst); if (cb) cb.click(); }
      open();
    });
    var hint = el('p', 'kkai-openhint'); hint.id = hintId;
    parent.insertBefore(btn, beforeNode || null);
    parent.insertBefore(hint, beforeNode || null);
  }

  function inject() {
    css();
    var okHelp = !!document.getElementById('kkaiOpen');
    var okSup = !!document.getElementById('kkaiOpen2');
    var help = document.getElementById('kxHelpOv');
    if (help && !okHelp) {
      var search = document.getElementById('kxHelpSearch');
      var parent = search ? search.parentNode : help.firstElementChild;
      makeOpenBtn('kkaiOpen', 'kkaiOpenHint', search, parent, null);
      okHelp = true;
    }
    var sup = document.getElementById('supportOverlay');
    if (sup && !okSup) {
      var title = document.getElementById('supportTitle');
      if (title && title.parentNode) {
        makeOpenBtn('kkaiOpen2', 'kkaiOpenHint2', title.nextSibling, title.parentNode, 'supportCancelBtn');
        okSup = true;
      }
    }
    refreshBtn();
    return okHelp && okSup;
  }

  function refreshBtn() {
    [['kkaiOpen', 'kkaiOpenHint'], ['kkaiOpen2', 'kkaiOpenHint2']].forEach(function (ids) {
      var b = document.getElementById(ids[0]), h = document.getElementById(ids[1]);
      if (b) b.textContent = t().btn;
      if (h) h.textContent = ids[0] === 'kkaiOpen2' ? t().btnHint2 : t().btnHint;
    });
    var f = document.getElementById('kkaiFab');
    if (f) f.setAttribute('aria-label', plainBtn());
  }

  // Sprache der App kann sich ändern: Beschriftungen aktualisieren
  setInterval(function () {
    refreshBtn();
    if (built && overlay && !overlay.classList.contains('kkai-hidden')) fillTexts();
  }, 1500);

  // Schwebender Knopf, überall sichtbar (wie der alte Botpress-Knopf)
  function injectFab() {
    if (document.getElementById('kkaiFab') || !document.body) return;
    css();
    var b = el('button'); b.type = 'button'; b.id = 'kkaiFab';
    b.setAttribute('aria-label', plainBtn());
    b.innerHTML = ICON_BUBBLE;
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
