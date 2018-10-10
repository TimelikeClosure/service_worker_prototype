"use strict";

self.addEventListener('install', event => {
    console.info('Service worker installing...');
    event.waitUntil(
        caches.open('random-image-generator').then(cache => {
            return cache.addAll([
                '/prototypes/service_worker/',
                '/prototypes/service_worker/style.css',
                '/prototypes/service_worker/script.js',
                '/prototypes/service_worker/images/index.json',
            ]);
        })
    );
});

self.addEventListener('activate', event => {
    console.info('Service worker activated!');
    caches.keys().then(keys => console.log('caches: ', keys));
});

self.addEventListener('fetch', event => {
    console.log('fetch occurred: ', event.request);
    try {
        event.respondWith(
            caches
            .match(event.request)
            .then(response => {
                if (response){
                    return response;
                }
                console.log('fetching new request...');
                return fetch(event.request)
                .then(response => {
                    return caches.open('random-image-generator')
                    .then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    })
                });
            })
        );
    } catch (error) {
        console.error('error fetching resource: ', error);
        event.respondWith(fetch(event.request));
    }
});
