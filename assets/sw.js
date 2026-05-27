// sw.js : Service Worker minimal pour valider l'installation PWA
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installation terminée');
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // On laisse passer toutes les requêtes normalement vers Supabase et Github
    e.respondWith(fetch(e.request));
});