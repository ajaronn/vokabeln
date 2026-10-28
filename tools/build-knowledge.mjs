#!/usr/bin/env node
// Baut die Wissensbasis für den KI-Support: Websites + FAQ + eigene Dateien (PDF/MD/TXT).
// Aufruf (im Projektordner):  node tools/build-knowledge.mjs
// Ergebnis: supabase/functions/support-ai/knowledge.md  (danach Function neu deployen)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'supabase/functions/support-ai/knowledge.md');
// Rechtliches (Datenschutz, Nutzungsbedingungen, Impressum) bewusst NICHT aufnehmen
const PAGES = ['index.html']; // weitere Seiten hier ergänzen
const LEGAL = /datenschutz|nutzungsbedingung|impressum|privacy|terms of|terms and|DSGVO|GDPR|AGB|haftung|rechtlich|politica de privacidade|termos de uso/i;
const EXTRA_DIR = path.join(root, 'knowledge');                                // eigene PDFs/MD/TXT hier ablegen

const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&shy;/g, '');
function htmlToText(html) {
  html = html.replace(/<(script|style|svg|noscript|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<input[^>]*placeholder="([^"]*)"[^>]*>/gi, ' [$1] ')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|label|button|summary|option)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const lines = decode(html).split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(l => l && !LEGAL.test(l));
  return [...new Set(lines)].join('\n'); // doppelte Zeilen entfernen
}

const parts = [];
for (const p of PAGES) {
  const f = path.join(root, p);
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  parts.push(`## Seite: ${p}\n\n${htmlToText(html)}`);
  if (p === 'index.html') { // eingebaute FAQ-Standardantworten aus dem Skript holen
    const m = html.match(/var FAQ_DEFAULTS=(\[[\s\S]*?\n\]);/);
    if (m) {
      try {
        const faq = new Function('return ' + m[1])();
        parts.push('## Standard-FAQ der App\n\n' + faq.filter(x => !LEGAL.test(x.category + x.question + x.answer)).map(x => `[${x.category}] F: ${x.question}\nA: ${x.answer}`).join('\n\n'));
      } catch (e) { console.warn('FAQ nicht lesbar:', e.message); }
    }
  }
}
if (fs.existsSync(EXTRA_DIR)) {
  for (const n of fs.readdirSync(EXTRA_DIR).sort()) {
    if (n.startsWith('LIESMICH')) continue;
    const f = path.join(EXTRA_DIR, n), ext = path.extname(n).toLowerCase();
    let text = '';
    if (ext === '.pdf') text = execFileSync('pdftotext', ['-layout', f, '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
    else if (['.md', '.txt'].includes(ext)) text = fs.readFileSync(f, 'utf8');
    else continue;
    parts.push(`## Zusatzinfo (Datei: ${n})\n\n${text.replace(/\n{3,}/g, '\n\n').trim()}`);
    console.log('+', n);
  }
}
const md = parts.join('\n\n---\n\n');
fs.writeFileSync(out, md);
fs.writeFileSync(out.replace(/\.md$/, '.ts'), '// AUTOMATISCH ERZEUGT von tools/build-knowledge.mjs – nicht von Hand ändern\nexport const KNOWLEDGE = ' + JSON.stringify(md) + ';\n');
console.log(`knowledge.md: ${(md.length / 1000).toFixed(0)}k Zeichen (~${Math.round(md.length / 3.5 / 1000)}k Token)`);
if (md.length > 600000) console.warn('Achtung: sehr groß. Dann lieber Suche (RAG) statt alles im Prompt.');
