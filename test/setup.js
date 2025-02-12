// Test setup and mocks
require('@testing-library/jest-dom');

// Mock canvas
HTMLCanvasElement.prototype.getContext = () => ({
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(100),
        width: 10,
        height: 10
    })),
    putImageData: jest.fn(),
    clearRect: jest.fn()
});

// Mock IndexedDB
const indexedDB = {
    open: jest.fn()
};

// Mock Service Worker
const serviceWorker = {
    register: jest.fn().mockResolvedValue({
        active: true,
        addEventListener: jest.fn()
    })
};

// Mock Broadcast Channel
class MockBroadcastChannel {
    constructor() {
        this.listeners = new Map();
    }
    
    addEventListener(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type).add(callback);
    }
    
    removeEventListener(type, callback) {
        if (this.listeners.has(type)) {
            this.listeners.get(type).delete(callback);
        }
    }
    
    postMessage(message) {
        if (this.listeners.has('message')) {
            this.listeners.get('message').forEach(callback => {
                callback({ data: message });
            });
        }
    }
}

// Mock Web Workers
class MockWorker {
    constructor(stringUrl) {
        this.url = stringUrl;
        this.onmessage = null;
    }

    postMessage(msg) {
        if (this.onmessage) {
            setTimeout(() => {
                this.onmessage({ data: msg });
            }, 0);
        }
    }

    terminate() {}
}

// Mock File API
const File = jest.fn().mockImplementation((data, name, options) => ({
    name,
    size: data.length,
    type: options.type
}));

// Mock FileReader
class MockFileReader {
    readAsDataURL() {
        setTimeout(() => {
            this.result = 'data:image/png;base64,fake';
            this.onload && this.onload();
        }, 0);
    }
}

// Setup global mocks
global.indexedDB = indexedDB;
global.navigator.serviceWorker = serviceWorker;
global.BroadcastChannel = MockBroadcastChannel;
global.Worker = MockWorker;
global.File = File;
global.FileReader = MockFileReader;

// Mock Workbox
global.workbox = {
    routing: {
        registerRoute: jest.fn()
    },
    strategies: {
        NetworkFirst: jest.fn(),
        CacheFirst: jest.fn(),
        StaleWhileRevalidate: jest.fn()
    },
    precaching: {
        precacheAndRoute: jest.fn()
    }
};

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: key => store[key],
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: key => {
            delete store[key];
        }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock window.URL
window.URL.createObjectURL = jest.fn(() => 'blob:test');
window.URL.revokeObjectURL = jest.fn();

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
});
