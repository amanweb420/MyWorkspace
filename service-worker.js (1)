
/* =========================================
   MYWORKSPACE - PWA SERVICE WORKER
   Version 2
   ========================================= */

const CACHE_NAME = "myworkspace-v2";


const APP_FILES = [
    "./",
    "./index.html",
    "./dashboard.html",
    "./student-services.html",
    "./student-links.html",
    "./links.html",
    "./file-tools.html",
    "./image-compressor.html",
    "./my-goal.html",
    "./my-routine.html",
    "./goal-history.html",
    "./class-12-board.html",
    "./physics.html",
    "./physics-chapter-01-test.html",
    "./physics-chapter-01-level-2.html",
    "./manifest.json",
    "./style.css",
    "./script.js",
    "./file-tools.js",
    "./routine-gate.js",
    "./icon-512.png"
];



/* =========================================
   1. INSTALL
   ========================================= */

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            const results = await Promise.allSettled(
                APP_FILES.map((file) => cache.add(file))
            );

            const failedFiles = results
                .map((result, index) => ({
                    result,
                    file: APP_FILES[index]
                }))
                .filter((item) => item.result.status === "rejected")
                .map((item) => item.file);

            if (failedFiles.length) {
                console.warn(
                    "MyWorkspace: कुछ फाइलें कैश नहीं हुईं:",
                    failedFiles
                );
            }
        })
    );

    self.skipWaiting();
});

/* =========================================
   2. ACTIVATE
   ========================================= */

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) =>
                        key.startsWith("myworkspace-") &&
                        key !== CACHE_NAME
                    )
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

/* =========================================
   3. FETCH - OFFLINE SUPPORT
   ========================================= */

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    // केवल इसी वेबसाइट की फाइलों को संभालें।
    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(request).then(async (cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            try {
                const response = await fetch(request);

                // सफल सामान्य HTTP responses कैश करें।
                if (response.ok && response.type === "basic") {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(request, response.clone());
                }

                return response;
            } catch (error) {
                // Offline में कैश की गई फाइल उपलब्ध न हो।
                if (request.mode === "navigate") {
                    const cachedPage = await caches.match(
                        "./dashboard.html"
                    );

                    if (cachedPage) {
                        return cachedPage;
                    }
                }

                return new Response(
                    "यह पेज अभी Offline उपलब्ध नहीं है। इंटरनेट चालू करके दोबारा कोशिश करें।",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain; charset=utf-8"
                        }
                    }
                );
            }
        })
    );
});

