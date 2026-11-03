
const CACHE_NAME = "ncsl-dredger-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icon.svg"
];

// Cache the application files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

// Activate the new cache
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names
                    .filter(name =>
                        name.startsWith("ncsl-dredger-") &&
                        name !== CACHE_NAME
                    )
                    .map(name => caches.delete(name))
            )
        ).then(() => self.clients.claim())
    );
});

// Use cached app files when offline
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const requestURL = new URL(event.request.url);

    if (requestURL.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request);
        })
    );
});
