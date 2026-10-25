/* Mini-i18n für Karteikasten OAuth-Seiten und Developer-Seite: Deutsch (Schlüssel), Englisch, Portugiesisch (Brasilien).
   Nutzt dieselbe Spracheinstellung wie die Karteikasten-App (localStorage "kk_lang"). */
(function () {
  'use strict';
  var LS = 'kk_lang', IDX = { en: 0, 'pt-BR': 1 }, D = {};
  function detect() {
    var s = null; try { s = localStorage.getItem(LS); } catch (e) { }
    if (s === 'de' || s === 'en' || s === 'pt-BR') return s;
    var n = String(navigator.language || 'de').toLowerCase();
    return n.indexOf('pt') === 0 ? 'pt-BR' : n.indexOf('en') === 0 ? 'en' : 'de';
  }
  var lang = detect(); window.kkLang = lang; document.documentElement.lang = lang;
  window.kkAdd = function (o) { Object.keys(o).forEach(function (k) { D[k.trim()] = o[k].map(function (v) { return v.trim(); }); }); };
  window.kkT = function (s, v) {
    var r = (lang !== 'de' && D[s]) ? D[s][IDX[lang]] : s;
    if (v) r = r.replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; });
    return r;
  };
  window.kkLocale = function () { return lang === 'en' ? 'en-GB' : lang === 'pt-BR' ? 'pt-BR' : 'de-DE'; };
  /* Text mit {platzhalter} in Knoten einfügen (Text oder DOM-Knoten) */
  window.kkTpl = function (parent, s, map) {
    kkT(s).split(/(\{\w+\})/).forEach(function (p) {
      var m = /^\{(\w+)\}$/.exec(p);
      if (m && map[m[1]] != null) parent.appendChild(typeof map[m[1]] === 'object' ? map[m[1]] : document.createTextNode(String(map[m[1]])));
      else if (p) parent.appendChild(document.createTextNode(p));
    });
  };
  /* Übersetzt statische Texte/Attribute im Teilbaum (nur exakte Treffer) */
  window.kkTranslateTree = function (root) {
    if (lang === 'de') return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) { var pe = n.parentNode && n.parentNode.nodeName; if (pe !== 'SCRIPT' && pe !== 'STYLE' && pe !== 'CODE' && pe !== 'PRE') list.push(n); }
    list.forEach(function (t) { var k = t.nodeValue.trim(); if (k && D[k]) t.nodeValue = t.nodeValue.replace(k, D[k][IDX[lang]]); });
    (root.querySelectorAll ? root.querySelectorAll('[placeholder],[aria-label],[title],[alt]') : []).forEach(function (e) {
      ['placeholder', 'aria-label', 'title', 'alt'].forEach(function (a) { var v = e.getAttribute(a); if (v && D[v]) e.setAttribute(a, D[v][IDX[lang]]); });
    });
  };
  window.kkLangSelect = function () {
    var s = document.createElement('select'); s.setAttribute('aria-label', 'Sprache / Language / Idioma'); s.className = 'langsel';
    [['de', 'Deutsch'], ['en', 'English'], ['pt-BR', 'Português']].forEach(function (o) { var x = document.createElement('option'); x.value = o[0]; x.textContent = o[1]; s.appendChild(x); });
    s.value = lang; s.addEventListener('change', function () { try { localStorage.setItem(LS, s.value); } catch (e) { } location.reload(); });
    return s;
  };
  document.addEventListener('DOMContentLoaded', function () { document.title = kkT(document.title); kkTranslateTree(document.body); });

  kkAdd({
    /* --- Berechtigungen --- */
    'Dein Profil ansehen': ['View your profile', 'Ver seu perfil'],
    'Name und Benutzername. Keine E-Mail-Adresse, kein Passwort.': ['Name and username. No email address, no password.', 'Nome e nome de usuário. Sem e-mail e sem senha.'],
    'Deine Listen ansehen': ['View your lists', 'Ver suas listas'],
    'Namen und Sprachen deiner Vokabellisten.': ['Names and languages of your vocabulary lists.', 'Nomes e idiomas das suas listas de vocabulário.'],
    'Neue Listen erstellen': ['Create new lists', 'Criar novas listas'],
    'Die App kann zusätzliche Listen in deinem Konto anlegen.': ['The app can add new lists to your account.', 'O app pode adicionar novas listas à sua conta.'],
    'Listen bearbeiten': ['Edit lists', 'Editar listas'],
    'Listen umbenennen und Sprachen ändern.': ['Rename lists and change languages.', 'Renomear listas e alterar idiomas.'],
    'Listen löschen': ['Delete lists', 'Excluir listas'],
    'Die App kann ganze Listen mit allen Vokabeln entfernen.': ['The app can remove entire lists with all their words.', 'O app pode remover listas inteiras com todas as palavras.'],
    'Vokabeln lesen': ['Read vocabulary', 'Ler vocabulário'],
    'Alle Wörter, Übersetzungen und Kommentare deiner Listen.': ['All words, translations and comments in your lists.', 'Todas as palavras, traduções e comentários das suas listas.'],
    'Vokabeln erstellen und bearbeiten': ['Create and edit vocabulary', 'Criar e editar vocabulário'],
    'Wörter hinzufügen und ändern.': ['Add and change words.', 'Adicionar e alterar palavras.'],
    'Lernfortschritt ansehen': ['View learning progress', 'Ver progresso de aprendizagem'],
    'Boxen, richtige und falsche Antworten und letzte Übung.': ['Boxes, correct and wrong answers and last practice.', 'Caixas, respostas certas e erradas e última prática.'],
    'Deine Entwickler-Apps verwalten': ['Manage your developer apps', 'Gerenciar seus apps de desenvolvedor'],
    'Apps im Karteikasten-Developer-Bereich erstellen und bearbeiten.': ['Create and edit apps in the Karteikasten Developer area.', 'Criar e editar apps na área Karteikasten Developer.'],
    'Profil lesen': ['Read profile', 'Ler perfil'], 'Name und Benutzername des Nutzers': ['The user\'s name and username', 'Nome e nome de usuário do usuário'],
    'Listen lesen': ['Read lists', 'Ler listas'], 'Listen mit Namen und Sprachen': ['Lists with names and languages', 'Listas com nomes e idiomas'],
    'Listen erstellen': ['Create lists', 'Criar listas'], 'Neue Listen anlegen': ['Create new lists', 'Criar novas listas'],
    'Umbenennen, Sprachen ändern': ['Rename, change languages', 'Renomear, alterar idiomas'],
    'Ganze Listen entfernen (sensibel)': ['Remove entire lists (sensitive)', 'Remover listas inteiras (sensível)'],
    'Wörter, Übersetzungen, Kommentare': ['Words, translations, comments', 'Palavras, traduções, comentários'],
    'Wörter hinzufügen und ändern': ['Add and change words', 'Adicionar e alterar palavras'],
    'Lernfortschritt lesen': ['Read learning progress', 'Ler progresso de aprendizagem'], 'Boxen und Trefferquote': ['Boxes and hit rate', 'Caixas e taxa de acertos'],
    /* --- gemeinsam --- */
    'Lädt': ['Loading', 'Carregando'], 'Datenschutz': ['Privacy', 'Privacidade'], 'Nutzungsbedingungen': ['Terms of use', 'Termos de uso'],
    'Zurück': ['Back', 'Voltar'], 'Zu Karteikasten': ['Go to Karteikasten', 'Ir para o Karteikasten'], 'Unbekannter Fehler.': ['Unknown error.', 'Erro desconhecido.'],
    'Zugriff erlauben – Karteikasten': ['Allow access – Karteikasten', 'Permitir acesso – Karteikasten'],
    'Verbundene Apps – Karteikasten': ['Connected apps – Karteikasten', 'Apps conectados – Karteikasten'],
    /* --- Zustimmungsseite --- */
    'Das hat nicht geklappt': ['Something went wrong', 'Algo deu errado'],
    'Anmeldung nötig': ['Sign-in required', 'Login necessário'],
    'Die Anmeldung konnte nicht abgeschlossen werden. Melde dich in Karteikasten an und öffne die Anfrage der App erneut.': ['Sign-in could not be completed. Sign in to Karteikasten and open the app\'s request again.', 'Não foi possível concluir o login. Entre no Karteikasten e abra novamente a solicitação do app.'],
    'Unbekannte App': ['Unknown app', 'App desconhecido'],
    '{name} möchte auf dein Karteikasten-Konto zugreifen': ['{name} wants to access your Karteikasten account', '{name} quer acessar sua conta do Karteikasten'],
    'Angemeldet als {who} · {link}': ['Signed in as {who} · {link}', 'Conectado como {who} · {link}'],
    'dein Konto': ['your account', 'sua conta'],
    'Konto wechseln': ['Use a different account', 'Usar outra conta'],
    'Diese App ist nicht im Karteikasten-Developer-Verzeichnis registriert. Aus Sicherheitsgründen kann ihr kein Zugriff erlaubt werden.': ['This app is not registered in the Karteikasten Developer directory. For security reasons it cannot be granted access.', 'Este app não está registrado no diretório Karteikasten Developer. Por segurança, não é possível conceder acesso a ele.'],
    'Diese App wurde gesperrt.': ['This app has been blocked.', 'Este app foi bloqueado.'],
    'Diese App möchte:': ['This app would like to:', 'Este app gostaria de:'],
    'Du kannst einzelne Berechtigungen abwählen.': ['You can untick individual permissions.', 'Você pode desmarcar permissões individuais.'],
    'Diese App wurde nicht von Karteikasten geprüft. Erlaube nur Apps und Webseiten, denen du vertraust.': ['This app has not been reviewed by Karteikasten. Only allow apps and websites you trust.', 'Este app não foi verificado pelo Karteikasten. Permita apenas apps e sites em que você confia.'],
    'Du wirst danach zu {host} weitergeleitet.': ['You will then be redirected to {host}.', 'Depois você será redirecionado para {host}.'],
    'der App': ['the app', 'o app'],
    'Entwickler: {name}': ['Developer: {name}', 'Desenvolvedor: {name}'],
    'Webseite': ['Website', 'Site'], 'Bedingungen': ['Terms', 'Termos'],
    'Ablehnen': ['Deny', 'Negar'], 'Erlauben': ['Allow', 'Permitir'],
    'Wähle mindestens eine Berechtigung oder lehne die Anfrage ab.': ['Select at least one permission or deny the request.', 'Selecione pelo menos uma permissão ou negue a solicitação.'],
    'Du kannst den Zugriff jederzeit unter {link} widerrufen.': ['You can revoke access at any time under {link}.', 'Você pode revogar o acesso a qualquer momento em {link}.'],
    'Verbundene Apps': ['Connected apps', 'Apps conectados'],
    'Die Entscheidung konnte nicht übermittelt werden ({m}). Bitte starte die Anmeldung in der App erneut.': ['Your decision could not be submitted ({m}). Please start the sign-in again in the app.', 'Não foi possível enviar sua decisão ({m}). Inicie o login novamente no app.'],
    'Fehler': ['Error', 'Erro'],
    'Es fehlt die Autorisierungs-ID. Starte die Anmeldung über die App erneut.': ['The authorization ID is missing. Start the sign-in again from the app.', 'O ID de autorização está ausente. Inicie o login novamente pelo app.'],
    'Ungültige Anfrage': ['Invalid request', 'Solicitação inválida'], 'Anfrage ungültig': ['Request invalid', 'Solicitação inválida'],
    'Die Anfrage ist abgelaufen oder ungültig.': ['The request has expired or is invalid.', 'A solicitação expirou ou é inválida.'],
    /* --- Verbundene Apps --- */
    'Apps und Webseiten, die auf dein Karteikasten-Konto zugreifen dürfen.': ['Apps and websites that may access your Karteikasten account.', 'Apps e sites que podem acessar sua conta do Karteikasten.'],
    'Noch keine Apps verbunden.': ['No apps connected yet.', 'Nenhum app conectado ainda.'],
    'Verbunden seit {d}': ['Connected since {d}', 'Conectado desde {d}'],
    'Berechtigungen speichern': ['Save permissions', 'Salvar permissões'], 'Zugriff widerrufen': ['Revoke access', 'Revogar acesso'],
    'Gespeichert. Änderungen gelten sofort.': ['Saved. Changes take effect immediately.', 'Salvo. As alterações valem imediatamente.'],
    'Speichern fehlgeschlagen: {m}': ['Saving failed: {m}', 'Falha ao salvar: {m}'],
    'Zugriff für „{n}“ wirklich widerrufen? Die App wird abgemeldet.': ['Really revoke access for “{n}”? The app will be signed out.', 'Revogar mesmo o acesso de “{n}”? O app será desconectado.'],
    'Zugriff für „{n}“ wurde widerrufen.': ['Access for “{n}” has been revoked.', 'O acesso de “{n}” foi revogado.'],
    'Widerruf fehlgeschlagen: {m}': ['Revoking failed: {m}', 'Falha ao revogar: {m}'],
    'Die Liste konnte nicht geladen werden: {m}': ['The list could not be loaded: {m}', 'Não foi possível carregar a lista: {m}'],
    'Zurück zu Karteikasten': ['Back to Karteikasten', 'Voltar ao Karteikasten'], 'Karteikasten Developer': ['Karteikasten Developer', 'Karteikasten Developer'],
    /* --- Developer-Seite: Navigation, Start --- */
    'Hauptnavigation': ['Main navigation', 'Navegação principal'], 'Start': ['Home', 'Início'], 'Dokumentation': ['Documentation', 'Documentação'], 'Meine Apps': ['My apps', 'Meus apps'],
    'Mit Karteikasten fortfahren': ['Continue with Karteikasten', 'Continuar com o Karteikasten'], 'Abmelden': ['Sign out', 'Sair'], 'Angemeldet': ['Signed in', 'Conectado'],
    'Für Entwickler': ['For developers', 'Para desenvolvedores'], 'Baue mit Karteikasten': ['Build with Karteikasten', 'Crie com o Karteikasten'],
    'Lass Nutzer sich mit ihrem Karteikasten-Konto anmelden und gib deiner App – mit ihrer Erlaubnis – Zugriff auf Listen, Vokabeln und Lernfortschritt.': ['Let users sign in with their Karteikasten account and give your app – with their permission – access to lists, vocabulary and learning progress.', 'Deixe os usuários entrarem com a conta do Karteikasten e dê ao seu app – com a permissão deles – acesso a listas, vocabulário e progresso de aprendizagem.'],
    'Dokumentation lesen': ['Read the documentation', 'Ler a documentação'],
    'Standard-OAuth 2.0 mit PKCE. Nutzer sehen eine Zustimmungsseite mit Logo und Namen deiner App und entscheiden, was sie erlauben.': ['Standard OAuth 2.0 with PKCE. Users see a consent page with your app\'s logo and name and decide what to allow.', 'OAuth 2.0 padrão com PKCE. Os usuários veem uma página de consentimento com o logotipo e o nome do seu app e decidem o que permitir.'],
    'REST-API': ['REST API', 'API REST'],
    'Listen lesen, erstellen, bearbeiten und löschen. Vokabeln lesen, erstellen und ändern. Lernfortschritt abrufen.': ['Read, create, edit and delete lists. Read, create and change vocabulary. Retrieve learning progress.', 'Ler, criar, editar e excluir listas. Ler, criar e alterar vocabulário. Consultar o progresso de aprendizagem.'],
    'Sicher & kontrollierbar': ['Secure & controllable', 'Seguro e controlável'],
    'Nutzer können Berechtigungen einzeln abwählen und den Zugriff jederzeit widerrufen. Zum Erstellen von Apps ist 2FA Pflicht.': ['Users can untick individual permissions and revoke access at any time. 2FA is required to create apps.', 'Os usuários podem desmarcar permissões individuais e revogar o acesso a qualquer momento. Para criar apps, a 2FA é obrigatória.'],
    'So funktioniert es': ['How it works', 'Como funciona'],
    'Melde dich mit deinem Karteikasten-Konto an und lege unter „Meine Apps“ eine App an.': ['Sign in with your Karteikasten account and create an app under “My apps”.', 'Entre com sua conta do Karteikasten e crie um app em “Meus apps”.'],
    'Trage Weiterleitungs-URI, Logo und die benötigten Berechtigungen ein.': ['Enter the redirect URI, logo and the permissions you need.', 'Informe o URI de redirecionamento, o logotipo e as permissões necessárias.'],
    'Baue den Login-Button nach der Dokumentation ein – fertig.': ['Add the login button as described in the documentation – done.', 'Adicione o botão de login conforme a documentação – pronto.'],
    /* --- Dokumentation --- */
    '1. Anmelden mit Karteikasten (OAuth 2.0 + PKCE)': ['1. Sign in with Karteikasten (OAuth 2.0 + PKCE)', '1. Entrar com o Karteikasten (OAuth 2.0 + PKCE)'],
    'Registriere deine App unter „Meine Apps“. Du erhältst eine client_id. Leite Nutzer dann zum Autorisierungs-Endpunkt:': ['Register your app under “My apps”. You will get a client_id. Then send users to the authorization endpoint:', 'Registre seu app em “Meus apps”. Você receberá um client_id. Depois, envie os usuários ao endpoint de autorização:'],
    'Nicht angemeldete Nutzer melden sich bei Karteikasten an oder erstellen ein Konto. Danach sehen sie die Zustimmungsseite. Mit dem Code holst du die Tokens:': ['Users who are not signed in sign in to Karteikasten or create an account. Then they see the consent page. Use the code to get the tokens:', 'Usuários não conectados entram no Karteikasten ou criam uma conta. Depois veem a página de consentimento. Com o código você obtém os tokens:'],
    'Vertrauliche Clients (Server) authentifizieren sich zusätzlich mit client_secret (HTTP Basic). Refresh: grant_type=refresh_token. PKCE ist Pflicht. Weiterleitungs-URIs müssen exakt übereinstimmen.': ['Confidential clients (servers) also authenticate with client_secret (HTTP Basic). Refresh: grant_type=refresh_token. PKCE is required. Redirect URIs must match exactly.', 'Clientes confidenciais (servidores) também se autenticam com client_secret (HTTP Basic). Refresh: grant_type=refresh_token. PKCE é obrigatório. Os URIs de redirecionamento devem coincidir exatamente.'],
    'Discovery: ': ['Discovery: ', 'Discovery: '],
    '2. Berechtigungen': ['2. Permissions', '2. Permissões'],
    'Du deklarierst beim Anlegen, welche Berechtigungen deine App maximal braucht. Nutzer sehen sie auf der Zustimmungsseite und können einzelne abwählen. Fordere nur an, was du brauchst.': ['When creating the app you declare the maximum permissions it needs. Users see them on the consent page and can untick individual ones. Only request what you need.', 'Ao criar o app, você declara as permissões máximas de que ele precisa. Os usuários as veem na página de consentimento e podem desmarcar algumas. Peça apenas o que precisa.'],
    'Bezeichnung': ['Label', 'Descrição'], 'Umfang': ['Scope', 'Alcance'],
    '3. REST-API': ['3. REST API', '3. API REST'], 'Basis-URL: ': ['Base URL: ', 'URL base: '],
    'Profil (profile.read)': ['Profile (profile.read)', 'Perfil (profile.read)'], 'Alle Listen (lists.read)': ['All lists (lists.read)', 'Todas as listas (lists.read)'],
    'Liste erstellen: {"name","lang_a","lang_b"} (lists.create)': ['Create a list: {"name","lang_a","lang_b"} (lists.create)', 'Criar lista: {"name","lang_a","lang_b"} (lists.create)'],
    'Eine Liste (lists.read)': ['One list (lists.read)', 'Uma lista (lists.read)'], 'Liste ändern (lists.update)': ['Change a list (lists.update)', 'Alterar lista (lists.update)'], 'Liste löschen (lists.delete)': ['Delete a list (lists.delete)', 'Excluir lista (lists.delete)'],
    'Vokabeln lesen (vocab.read; mit Fortschritt, wenn progress.read erlaubt)': ['Read vocabulary (vocab.read; with progress if progress.read is allowed)', 'Ler vocabulário (vocab.read; com progresso, se progress.read for permitido)'],
    'Vokabel(n) hinzufügen: {"a","b","phonetic","comment","chapter","starred"} oder Array, max. 500 (vocab.write)': ['Add word(s): {"a","b","phonetic","comment","chapter","starred"} or an array, max. 500 (vocab.write)', 'Adicionar palavra(s): {"a","b","phonetic","comment","chapter","starred"} ou array, máx. 500 (vocab.write)'],
    'Vokabel ändern (vocab.write)': ['Change a word (vocab.write)', 'Alterar palavra (vocab.write)'],
    'Fortschritt aller Listen (progress.read)': ['Progress of all lists (progress.read)', 'Progresso de todas as listas (progress.read)'], 'Fortschritt einer Liste (progress.read)': ['Progress of one list (progress.read)', 'Progresso de uma lista (progress.read)'],
    '4. Fehler & Limits': ['4. Errors & limits', '4. Erros e limites'],
    'Fehler: {"error":{"code","message"}}. 401 Token ungültig · 403 fehlende Berechtigung oder widerrufen · 429 Rate-Limit (120 Anfragen/Minute je Nutzer und App) · 409 gleichzeitige Änderung (erneut versuchen).': ['Errors: {"error":{"code","message"}}. 401 invalid token · 403 missing permission or revoked · 429 rate limit (120 requests/minute per user and app) · 409 concurrent change (try again).', 'Erros: {"error":{"code","message"}}. 401 token inválido · 403 permissão ausente ou revogada · 429 limite de requisições (120/minuto por usuário e app) · 409 alteração simultânea (tente novamente).'],
    'Limits: 200 Listen, 5000 Vokabeln je Liste. Änderungen über die API erscheinen in der Karteikasten-App nach dem nächsten Laden/Synchronisieren.': ['Limits: 200 lists, 5000 words per list. Changes made through the API appear in the Karteikasten app after the next reload/sync.', 'Limites: 200 listas, 5000 palavras por lista. As alterações feitas pela API aparecem no app Karteikasten após o próximo carregamento/sincronização.'],
    /* --- Meine Apps --- */
    'Melde dich mit deinem Karteikasten-Konto an.': ['Sign in with your Karteikasten account.', 'Entre com sua conta do Karteikasten.'],
    'Konnte nicht geladen werden: {m}': ['Could not be loaded: {m}', 'Não foi possível carregar: {m}'], 'Erneut versuchen': ['Try again', 'Tentar novamente'],
    'Zum Erstellen und Ändern von Apps muss die Zwei-Faktor-Authentifizierung aktiviert sein. Aktiviere sie in Karteikasten unter Einstellungen → Konto.': ['To create and change apps, two-factor authentication must be enabled. Enable it in Karteikasten under Settings → Account.', 'Para criar e alterar apps, a autenticação de dois fatores deve estar ativada. Ative-a no Karteikasten em Configurações → Conta.'],
    'Karteikasten öffnen': ['Open Karteikasten', 'Abrir o Karteikasten'], '+ Neue App': ['+ New app', '+ Novo app'], 'Du hast noch keine Apps.': ['You don\'t have any apps yet.', 'Você ainda não tem apps.'],
    'öffentlich (PKCE)': ['public (PKCE)', 'público (PKCE)'], 'vertraulich': ['confidential', 'confidencial'], 'gesperrt': ['blocked', 'bloqueado'], 'Bearbeiten': ['Edit', 'Editar'],
    'Client-ID: ': ['Client ID: ', 'ID do cliente: '], 'Berechtigungen: ': ['Permissions: ', 'Permissões: '], 'Weiterleitung: ': ['Redirect: ', 'Redirecionamento: '],
    'App bearbeiten': ['Edit app', 'Editar app'], 'Neue App': ['New app', 'Novo app'], 'Speichern': ['Save', 'Salvar'], 'App erstellen': ['Create app', 'Criar app'], 'Abbrechen': ['Cancel', 'Cancelar'], 'Fertig': ['Done', 'Concluído'],
    'Vorschau der Zustimmungsseite': ['Preview of the consent page', 'Prévia da página de consentimento'], 'Vorschau Zustimmungsseite': ['Consent page preview', 'Prévia da página de consentimento'],
    'Diese App wurde nicht von Karteikasten geprüft.': ['This app has not been reviewed by Karteikasten.', 'Este app não foi verificado pelo Karteikasten.'],
    'Name der App': ['App name', 'Nome do app'], 'Darf „Karteikasten“ nicht enthalten.': ['Must not contain “Karteikasten”.', 'Não pode conter “Karteikasten”.'],
    'Kurzbeschreibung': ['Short description', 'Descrição curta'], 'Entwickler / Organisation': ['Developer / organisation', 'Desenvolvedor / organização'],
    'Datenschutzerklärung (URL)': ['Privacy policy (URL)', 'Política de privacidade (URL)'], 'Nutzungsbedingungen (URL)': ['Terms of use (URL)', 'Termos de uso (URL)'],
    'Logo (PNG/JPG/WebP, max. 256 KB, quadratisch)': ['Logo (PNG/JPG/WebP, max. 256 KB, square)', 'Logotipo (PNG/JPG/WebP, máx. 256 KB, quadrado)'],
    'Weiterleitungs-URIs (eine pro Zeile)': ['Redirect URIs (one per line)', 'URIs de redirecionamento (um por linha)'],
    'https, exakte Übereinstimmung, keine Wildcards. http nur für localhost.': ['https, exact match, no wildcards. http only for localhost.', 'https, correspondência exata, sem curingas. http apenas para localhost.'],
    'App-Typ': ['App type', 'Tipo de app'], 'Der Typ lässt sich nachträglich nicht ändern.': ['The type cannot be changed later.', 'O tipo não pode ser alterado depois.'],
    'Öffentlich – Browser/Mobile-App (PKCE, kein Secret)': ['Public – browser/mobile app (PKCE, no secret)', 'Público – navegador/app móvel (PKCE, sem secret)'],
    'Vertraulich – eigener Server (mit Secret)': ['Confidential – your own server (with secret)', 'Confidencial – servidor próprio (com secret)'],
    'Berechtigungen': ['Permissions', 'Permissões'],
    'Client-Secret (wird nur jetzt angezeigt): ': ['Client secret (shown only now): ', 'Client secret (exibido apenas agora): '], 'Neues Secret: ': ['New secret: ', 'Novo secret: '],
    'Secret erneuern': ['Renew secret', 'Renovar secret'], 'App löschen': ['Delete app', 'Excluir app'],
    'Neues Secret erzeugen? Das alte wird ungültig.': ['Generate a new secret? The old one becomes invalid.', 'Gerar um novo secret? O antigo deixará de valer.'],
    'App „{n}“ endgültig löschen? Alle Nutzerzugriffe enden.': ['Permanently delete app “{n}”? All user access will end.', 'Excluir definitivamente o app “{n}”? Todos os acessos dos usuários serão encerrados.'],
    'Logo: PNG, JPG oder WebP bis 256 KB.': ['Logo: PNG, JPG or WebP up to 256 KB.', 'Logotipo: PNG, JPG ou WebP de até 256 KB.'],
    'Der Developer-OAuth-Client ist noch nicht eingetragen (app.js → CONFIG.CLIENT_ID).': ['The developer OAuth client has not been entered yet (app.js → CONFIG.CLIENT_ID).', 'O cliente OAuth do desenvolvedor ainda não foi informado (app.js → CONFIG.CLIENT_ID).'],
    'Anmeldung abgebrochen.': ['Sign-in cancelled.', 'Login cancelado.'], 'Anmeldung fehlgeschlagen.': ['Sign-in failed.', 'Falha no login.'], 'Anmeldung fehlgeschlagen: {m}': ['Sign-in failed: {m}', 'Falha no login: {m}'],
    'Ungültiger Anmeldestatus. Bitte erneut anmelden.': ['Invalid sign-in state. Please sign in again.', 'Estado de login inválido. Entre novamente.'], 'Nicht angemeldet.': ['Not signed in.', 'Não conectado.'],
    'Dokumentation – Karteikasten Developer': ['Documentation – Karteikasten Developer', 'Documentação – Karteikasten Developer'], 'Meine Apps – Karteikasten Developer': ['My apps – Karteikasten Developer', 'Meus apps – Karteikasten Developer'],
    /* --- Fehlercodes der Funktionen --- */
    'err:2fa_required': ['Two-factor authentication (2FA) must be enabled in Karteikasten to create and change apps.', 'A autenticação de dois fatores (2FA) deve estar ativada no Karteikasten para criar e alterar apps.'],
    'err:reserved_name': ['The name must not contain “Karteikasten” (risk of confusion).', 'O nome não pode conter “Karteikasten” (risco de confusão).'],
    'err:invalid_name': ['Name: 2–60 characters.', 'Nome: de 2 a 60 caracteres.'], 'err:invalid_website': ['The website must be an https URL.', 'O site deve ser uma URL https.'],
    'err:invalid_url': ['Please enter a valid https URL.', 'Informe uma URL https válida.'], 'err:invalid_redirect': ['Invalid redirect URIs (https, no wildcards, no #).', 'URIs de redirecionamento inválidos (https, sem curingas, sem #).'],
    'err:invalid_scopes': ['Choose at least one permission.', 'Escolha pelo menos uma permissão.'], 'err:limit': ['Limit reached (max. 10 apps per account).', 'Limite atingido (máx. 10 apps por conta).'],
    'err:invalid_logo': ['Logo: PNG, JPG or WebP only, max. 256 KB.', 'Logotipo: apenas PNG, JPG ou WebP, máx. 256 KB.'], 'err:invalid_token': ['Session expired. Please sign in again.', 'Sessão expirada. Entre novamente.'],
    'err:wrong_client': ['Only allowed via the Karteikasten Developer site.', 'Permitido apenas pelo site Karteikasten Developer.'], 'err:not_found': ['App not found.', 'App não encontrado.'],
    'err:server_error': ['Internal error.', 'Erro interno.']
  });
})();
