"use strict";

const alwaysCached = [
    '/prototypes/service_worker/',
    '/prototypes/service_worker/style.css',
    '/prototypes/service_worker/script.js',
    '/prototypes/service_worker/images/index.json',
];

const dbRequest = indexedDB.open('random-image-generator', 1);

dbRequest.onupgradeneeded = event => {
    const db = event.target.result;

    db.createObjectStore("image-cache");
};

var db;
dbRequest.onsuccess = event => {
    db = event.target.result;
};

self.addEventListener('install', event => {
    console.info('Service worker installing...');
    event.waitUntil(
        caches.open('random-image-generator').then(cache => {
            return cache.addAll(alwaysCached)
            .then(() => {
                if (db){
                    return populateDbResourceList();
                }
                const promise = new Promise((resolve, reject) => {
                    const oldOnSuccess = dbRequest.onsuccess;
                    dbRequest.onsuccess = (event) => {
                        oldOnSuccess(event);
                        return resolve(populateDbResourceList());
                    }
                });
                return promise;
            });
        })
    );
});

self.addEventListener('activate', event => {
    console.info('Service worker activated!');
    caches.keys().then(keys => console.log('caches: ', keys));
});

self.addEventListener('fetch', event => {
    console.log('fetch occurred: ', event.request);
    event.respondWith(fetchResource(event));
});

self.addEventListener('message', event => {
    console.log('message received: ', event);
    if (event.target === self){
        switch(event.data.type){
            case "image_add":
                return addImageToCache(event.data.payload);
            case "image_remove":
                return removeImageFromCache(event.data.payload);
            default:
        }
    }
});

async function populateDbResourceList(){
    const imageListResponse = await fetch('/prototypes/service_worker/images/index.json');
    const imageList = await imageListResponse.json();

    const imageListStore = db.transaction('image-cache', 'readwrite').objectStore('image-cache');
    const dbImageList = await new Promise((resolve, reject) => {
        const request = imageListStore.getAllKeys();
        request.onsuccess = () => {
            resolve(request.result);
        };
    });

    for (let i = 0; i < imageList.length; i++){
        const key = imageList[i];
        if (!dbImageList.includes(key)){
            imageListStore.add(false, key);
        }
    }

    for (let i = 0; i < dbImageList.length; i++){
        const key = dbImageList[i];
        if (!imageList.includes(key)){
            imageListStore.delete(key);
        }
    }
}

function fetchResource(event){
    if (db) {
        console.log('database connection open');
        fetchResource = function(event){
            return shouldCacheResource(event)
            .then(shouldCache => {
                if (!shouldCache){
                    caches.open('random-image-generator').then(cache => cache.delete(event.request));
                    console.log('caching off, fetching new request...');
                    return fetch(event.request);
                }
                return caches
                .match(event.request)
                .then(response => {
                    if (response){
                        return response;
                    }
                    console.log('fetching new request to cache...');
                    return fetch(event.request)
                    .then(response => {
                        return caches.open('random-image-generator')
                        .then(cache => {
                            cache.put(event.request, response.clone());
                            return response;
                        })
                    });
                });
            });
        }
        return fetchResource(event);
    }
    return caches
    .match(event.request)
    .then(response => {
        if (response){
            return response;
        }
        console.log('fetching new request...');
        return fetch(event.request);
    });
}

async function shouldCacheResource(event){
    //  query db for image from event.request.url, using new URL to get image name
    const pathname = new URL(event.request.url).pathname;
    let shouldCache = alwaysCached.includes(pathname);
    if (!shouldCache){
        shouldCache = await new Promise((resolve, reject) => {
            const imageName = pathname.split('/').slice(-1)[0];
            const imageListStore = db.transaction('image-cache', 'readwrite').objectStore('image-cache');
            const request = imageListStore.get(imageName);
            request.onsuccess = event => {
                resolve(request.result);
            };
        });
    }
    return shouldCache;
}

function addImageToCache(image){
    if (db){
        db.transaction('image-cache', 'readwrite').objectStore('image-cache').put(true, image);
    }
    const path = '/prototypes/service_worker/images/' + image;
    caches.open('random-image-generator').then(cache => cache.add(path));
}

function removeImageFromCache(image){
    if (db){
        db.transaction('image-cache', 'readwrite').objectStore('image-cache').put(false, image);
    }
    const path = '/prototypes/service_worker/images/' + image;
    caches.open('random-image-generator').then(cache => cache.delete(path));
}
