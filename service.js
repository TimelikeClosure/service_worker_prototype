"use strict";

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
            return cache.addAll([
                '/prototypes/service_worker/',
                '/prototypes/service_worker/style.css',
                '/prototypes/service_worker/script.js',
                '/prototypes/service_worker/images/index.json',
            ])
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
}

function fetchResource(event){
    if (db) {
        console.log('database connection open');
        fetchResource = function(event){
            return caches
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
