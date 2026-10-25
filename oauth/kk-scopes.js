/* Gemeinsame Beschriftung der Karteikasten-Berechtigungen (Zustimmungsseite, Verbundene Apps) */
window.KK_SCOPES = {
  'profile.read':  { t: 'Dein Profil ansehen',           d: 'Name und Benutzername. Keine E-Mail-Adresse, kein Passwort.' },
  'lists.read':    { t: 'Deine Listen ansehen',          d: 'Namen und Sprachen deiner Vokabellisten.' },
  'lists.create':  { t: 'Neue Listen erstellen',         d: 'Die App kann zusätzliche Listen in deinem Konto anlegen.' },
  'lists.update':  { t: 'Listen bearbeiten',             d: 'Listen umbenennen und Sprachen ändern.' },
  'lists.delete':  { t: 'Listen löschen',                d: 'Die App kann ganze Listen mit allen Vokabeln entfernen.', danger: true },
  'vocab.read':    { t: 'Vokabeln lesen',                d: 'Alle Wörter, Übersetzungen und Kommentare deiner Listen.' },
  'vocab.write':   { t: 'Vokabeln erstellen und bearbeiten', d: 'Wörter hinzufügen und ändern.' },
  'progress.read': { t: 'Lernfortschritt ansehen',       d: 'Boxen, richtige und falsche Antworten und letzte Übung.' },
  'developer.manage': { t: 'Deine Entwickler-Apps verwalten', d: 'Apps im Karteikasten-Developer-Bereich erstellen und bearbeiten.' }
};
