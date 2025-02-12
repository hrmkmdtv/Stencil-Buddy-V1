const VERSION = '1.0.0';
const CACHE_NAME = `stencil-art-${VERSION}`;
const STATIC_CACHE = `stencil-art-static-${VERSION}`;
const DYNAMIC_CACHE = `stencil-art-dynamic-${VERSION}`;
const API_CACHE = `stencil-art-api-${VERSION}`;

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/offline.html',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/new.png',
    '/icons/recent.png',
    '/locales/en.json',
    '/fonts/roboto.woff2',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
];

const CACHE_STRATEGIES = {
    STATIC: 'static',
    NETWORK_FIRST: 'network-first',
    CACHE_FIRST: 'cache-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

const ROUTE_STRATEGIES = new Map([
    [/\/api\//, CACHE_STRATEGIES.NETWORK_FIRST],
    [/\.(png|jpg|jpeg|gif|svg|webp)$/, CACHE_STRATEGIES.CACHE_FIRST],
    [/\/locales\//, CACHE_STRATEGIES.STALE_WHILE_REVALIDATE],
    [/\/fonts\//, CACHE_STRATEGIES.CACHE_FIRST]
]);

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const staticCache = await caches.open(STATIC_CACHE);
        
        // Cache critical assets first
        const criticalAssets = STATIC_ASSETS.filter(url => 
            url === '/offline.html' || url === '/style.css'
        );
        await staticCache.addAll(criticalAssets);
        
        // Cache remaining assets
        const remainingAssets = STATIC_ASSETS.filter(url => 
            !criticalAssets.includes(url)
        );
        await staticCache.addAll(remainingAssets);
        
        // Skip waiting to activate immediately
        await self.skipWaiting();
    })());
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        // Claim clients immediately
        await self.clients.claim();
        
        // Clean up old caches
        const cacheKeys = await caches.keys();
        const oldCaches = cacheKeys.filter(key => {
            return key.startsWith('stencil-art-') && 
                   !key.includes(VERSION);
        });
        
        await Promise.all([
            ...oldCaches.map(key => caches.delete(key)),
            // Optionally migrate data from old caches to new ones
            migrateCacheData(oldCaches)
        ]);
    })());
});

// Migrate important data from old caches
async function migrateCacheData(oldCaches) {
    const newCache = await caches.open(DYNAMIC_CACHE);
    
    for (const oldCache of oldCaches) {
        const cache = await caches.open(oldCache);
        const keys = await cache.keys();
        
        for (const request of keys) {
            if (request.url.includes('/uploads/') || 
                request.url.includes('/projects/')) {
                const response = await cache.match(request);
                if (response) {
                    await newCache.put(request, response);
                }
            }
        }
    }
}

// Fetch event with strategy-based handling
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const strategy = getStrategyForUrl(url);

    event.respondWith((async () => {
        try {
            switch (strategy) {
                case CACHE_STRATEGIES.NETWORK_FIRST:
                    return await handleNetworkFirst(event.request);
                case CACHE_STRATEGIES.CACHE_FIRST:
                    return await handleCacheFirst(event.request);
                case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
                    return await handleStaleWhileRevalidate(event.request);
                default:
                    return await handleStaticAsset(event.request);
            }
        } catch (error) {
            return await handleOffline(event.request);
        }
    })());
});

function getStrategyForUrl(url) {
    for (const [pattern, strategy] of ROUTE_STRATEGIES) {
        if (pattern.test(url.pathname)) {
            return strategy;
        }
    }
    return CACHE_STRATEGIES.STATIC;
}

async function handleNetworkFirst(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(API_CACHE);
        await cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

async function handleCacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        updateCache(request); // Update cache in background
        return cachedResponse;
    }
    return await fetchAndCache(request);
}

async function handleStaleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    const networkPromise = fetchAndCache(request);
    
    if (cachedResponse) {
        // Return cached response immediately
        networkPromise.catch(console.error); // Handle background fetch error silently
        return cachedResponse;
    }
    
    return await networkPromise;
}

async function handleStaticAsset(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    return await fetchAndCache(request);
}

async function handleOffline(request) {
    // Check if request is for an image
    if (request.headers.get('Accept')?.includes('image/')) {
        return await caches.match('/icons/offline-image.png');
    }
    // Return offline page for HTML requests
    if (request.headers.get('Accept')?.includes('text/html')) {
        return await caches.match('/offline.html');
    }
    throw new Error('Offline');
}

// Background sync event
self.addEventListener('sync', event => {
    if (event.tag === 'syncData') {
        event.waitUntil(syncData());
    }
});

async function handleApiRequest(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        // Return cached response if available
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

async function handleImageRequest(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await caches.match('/offline.html');
        return cachedResponse;
    }
}

async function updateCache(request) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response);
        }
    } catch (error) {
        console.error('Cache update failed:', error);
    }
}

async function syncData() {
    const db = await openDatabase();
    const tx = db.transaction('resources', 'readwrite');
    const store = tx.objectStore('resources');
    const items = await store.getAll();

    for (const item of items) {
        if (item.url.startsWith('sync_')) {
            try {
                await syncItem(item);
                await store.delete(item.url);
            } catch (error) {
                console.error('Sync failed for item:', error);
            }
        }
    }
}

async function syncItem(item) {
    const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(item.data)
    });

    if (!response.ok) {
        throw new Error('Sync failed');
    }
}

async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('stencilArtOffline', 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}
