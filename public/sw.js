self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { title: 'Zexofile Shop', message: event.data?.text() || '' }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Zexofile Shop', {
    body: data.message || 'New update from Zexofile Shop',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image: data.image_url || undefined,
    data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
