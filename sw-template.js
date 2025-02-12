importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const {
    routing,
    strategies,
    precaching,
    expiration,
    backgroundSync,
    cacheableResponse,
    broadcastUpdate
} = workbox;

// Use the precache manifest
precaching.precacheAndRoute(self.__WB_MANIFEST);

// Custom cache names
const CACHE_NAMES = {
    static: 'static-assets-v1',
    images: 'images-v1',
    api: 'api-cache-v1',
    fonts: 'fonts-v1',
    projects: 'user-projects-v1'
};

// Broadcast channel for updates
const broadcastChannel = new BroadcastChannel('workbox');

// Register routes
// Static assets
routing.registerRoute(
    ({request}) => request.destination === 'script' ||
                   request.destination === 'style',
    new strategies.StaleWhileRevalidate({
        cacheName: CACHE_NAMES.static,
        plugins: [
            new expiration.ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
            }),
            new broadcastUpdate.BroadcastUpdatePlugin({
                channelName: 'workbox',
                headersToCheck: ['etag', 'last-modified']
            })
        ]
    })
);

// Images
routing.registerRoute(
    ({request}) => request.destination === 'image',
    new strategies.CacheFirst({
        cacheName: CACHE_NAMES.images,
        plugins: [
            new expiration.ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                purgeOnQuotaError: true
            }),
            new cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200]
            })
        ]
    })
);

// API calls
routing.registerRoute(
    ({url}) => url.pathname.startsWith('/api/'),
    new strategies.NetworkFirst({
        cacheName: CACHE_NAMES.api,
        plugins: [
            new expiration.ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 5 * 60 // 5 minutes
            }),
            new backgroundSync.BackgroundSyncPlugin('apiQueue', {
                maxRetentionTime: 24 * 60 // 24 hours
            })
        ],
        networkTimeoutSeconds: 3
    })
);

// Project data
routing.registerRoute(
    ({url}) => url.pathname.startsWith('/projects/'),
    new strategies.StaleWhileRevalidate({
        cacheName: CACHE_NAMES.projects,
        plugins: [
            new expiration.ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
            }),
            new broadcastUpdate.BroadcastUpdatePlugin({
                channelName: 'workbox'
            })
        ]
    })
);

// Offline fallback
const offlineFallback = new precaching.PrecacheController();
offlineFallback.addToCacheList([
    { url: '/offline.html', revision: null },
    { url: '/icons/offline-image.png', revision: null }
]);

// Install handler
self.addEventListener('install', event => {
    event.waitUntil(offlineFallback.install());
});

// Custom offline response
const offlineResponse = async (request) => {
    if (request.destination === 'image') {
        return caches.match('/icons/offline-image.png');
    }
    return caches.match('/offline.html');
};

// Register offline fallback
routing.setCatchHandler(async ({request}) => {
    try {
        return await offlineResponse(request);
    } catch (error) {
        return Response.error();
    }
});

// Background sync for offline operations
const projectsSyncQueue = new backgroundSync.Queue('projectsSync', {
    maxRetentionTime: 24 * 60, // 24 hours
    onSync: async ({queue}) => {
        let entry;
        while (entry = await queue.shiftRequest()) {
            try {
                await fetch(entry.request.clone());
                broadcastChannel.postMessage({
                    type: 'SYNC_SUCCESS',
                    url: entry.request.url
                });
            } catch (error) {
                throw new Error('Sync failed');
            }
        }
    }
});

// Handle sync events
self.addEventListener('sync', event => {
    if (event.tag === 'projectsSync') {
        event.waitUntil(projectsSyncQueue.replayRequests());
    }
});

// Cache cleanup on activate
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(keys => {
                return Promise.all(
                    keys.map(key => {
                        if (!Object.values(CACHE_NAMES).includes(key)) {
                            return caches.delete(key);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

// Listen for messages from the client
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_PROJECT') {
        event.waitUntil(
            caches.open(CACHE_NAMES.projects).then(cache => {
                return cache.put(event.data.url, new Response(JSON.stringify(event.data.project)));
            })
        );
    }
});

// Custom navigation preload
routing.registerRoute(
    ({request}) => request.mode === 'navigate',
    new strategies.NetworkFirst({
        cacheName: CACHE_NAMES.static,
        plugins: [
            new expiration.ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
            })
        ],
        networkTimeoutSeconds: 3
    })
);
