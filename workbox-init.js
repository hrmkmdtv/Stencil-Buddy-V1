// Service Worker and Workbox initialization
const workboxInit = {
    isSupported: 'serviceWorker' in navigator && 'workbox' in window,
    registration: null,
    broadcastChannel: null,

    async init() {
        if (!this.isSupported) {
            console.warn('Service Workers are not supported');
            return;
        }

        try {
            this.setupBroadcastChannel();
            await this.registerServiceWorker();
            this.setupUpdateHandling();
            this.setupOfflineDetection();
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    },

    setupBroadcastChannel() {
        this.broadcastChannel = new BroadcastChannel('workbox');
        this.broadcastChannel.addEventListener('message', event => {
            switch (event.data.type) {
                case 'CACHE_UPDATED':
                    this.handleCacheUpdate(event.data);
                    break;
                case 'SYNC_SUCCESS':
                    this.handleSyncSuccess(event.data);
                    break;
                case 'OFFLINE_READY':
                    this.showOfflineReady();
                    break;
            }
        });
    },

    async registerServiceWorker() {
        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            // Handle service worker lifecycle
            if (this.registration.active) {
                console.log('Service Worker is active');
            }

            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateAvailable();
                    }
                });
            });
        } catch (error) {
            throw new Error(`Service Worker registration failed: ${error.message}`);
        }
    },

    setupUpdateHandling() {
        // Check for updates every hour
        setInterval(() => {
            this.registration?.update();
        }, 60 * 60 * 1000);

        // Handle reload after update
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    },

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.showOnlineStatus(true);
            this.syncOfflineChanges();
        });

        window.addEventListener('offline', () => {
            this.showOnlineStatus(false);
        });
    },

    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <p>A new version is available!</p>
                <div class="update-actions">
                    <button onclick="workboxInit.applyUpdate()">Update Now</button>
                    <button onclick="this.closest('.update-banner').remove()">Later</button>
                </div>
            </div>
        `;
        document.body.appendChild(updateBanner);
    },

    async applyUpdate() {
        if (!this.registration?.waiting) return;

        // Send skip waiting message
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Remove update banner
        document.querySelector('.update-banner')?.remove();
    },

    showOnlineStatus(isOnline) {
        const statusBanner = document.createElement('div');
        statusBanner.className = `status-banner ${isOnline ? 'online' : 'offline'}`;
        statusBanner.textContent = isOnline ? 
            'Back online - syncing changes...' : 
            'You are offline - changes will be saved locally';

        document.body.appendChild(statusBanner);
        setTimeout(() => statusBanner.remove(), 3000);
    },

    async syncOfflineChanges() {
        if (!this.registration) return;

        try {
            await this.registration.sync.register('projectsSync');
        } catch (error) {
            console.error('Sync registration failed:', error);
        }
    },

    handleCacheUpdate({updatedURL}) {
        console.log(`Resource updated: ${updatedURL}`);
        // Optionally refresh content if needed
    },

    handleSyncSuccess({url}) {
        console.log(`Successfully synced: ${url}`);
        // Show success notification
    },

    showOfflineReady() {
        const notification = document.createElement('div');
        notification.className = 'offline-ready';
        notification.innerHTML = `
            <div class="notification-content">
                <p>App is ready for offline use!</p>
                <button onclick="this.closest('.offline-ready').remove()">Got it</button>
            </div>
        `;
        document.body.appendChild(notification);
    },

    async cacheProject(project) {
        if (!this.registration) return;

        const projectURL = `/projects/${project.id}`;
        this.registration.active.postMessage({
            type: 'CACHE_PROJECT',
            url: projectURL,
            project: project
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    workboxInit.init();
});
