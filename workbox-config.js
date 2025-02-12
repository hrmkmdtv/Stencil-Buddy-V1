module.exports = {
    globDirectory: '.',
    globPatterns: [
        '**/*.{html,css,js,json,woff2,png,jpg,svg}',
        'icons/*',
        'locales/*'
    ],
    swDest: 'sw.js',
    // Don't precache images in the uploads directory
    globIgnores: ['uploads/*'],
    // Cache external resources
    runtimeCaching: [{
        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
        handler: 'StaleWhileRevalidate',
        options: {
            cacheName: 'google-fonts-stylesheets'
        }
    }, {
        urlPattern: /^https:\/\/fonts\.gstatic\.com/,
        handler: 'CacheFirst',
        options: {
            cacheName: 'google-fonts-webfonts',
            cacheableResponse: {
                statuses: [0, 200]
            },
            expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
        }
    }],
    // Skip waiting and clients claim
    skipWaiting: true,
    clientsClaim: true,
    // Custom service worker code
    importScripts: [
        'workbox-sw.js'
    ],
    // Inject manifest into service worker
    injectManifest: {
        swSrc: 'sw-template.js',
        swDest: 'sw.js',
        injectionPoint: 'self.__WB_MANIFEST'
    }
};
