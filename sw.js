// Service Worker für Karteikasten – zeigt Push-Benachrichtigungen an,
// auch wenn die App/der Tab geschlossen ist.

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var data = { title: 'Karteikasten', body: 'Lerne deine Vokabeln!' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) { }

  var options = {
    body: data.body || 'Lerne deine Vokabeln!',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='18' fill='%23A8442E'/%3E%3Ctext x='50' y='68' font-size='58' text-anchor='middle' fill='%23FBF6EA' font-family='Georgia,serif'%3E%F0%9F%83%8F%3C/text%3E%3C/svg%3E",
    badge: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='18' fill='%23A8442E'/%3E%3C/svg%3E",
    tag: 'karteikasten-reminder'
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Karteikasten', options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if ('focus' in clientList[i]) return clientList[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
