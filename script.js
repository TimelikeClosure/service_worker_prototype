document.addEventListener('DOMContentLoaded', initializeDOM);

function initializeDOM(){
    document.getElementById('image-generator').addEventListener('click', retrieveImage);
    if ("serviceWorker" in navigator){
        window.addEventListener('load', registerServiceWorker);
    } else {
        document.getElementById('status').innerText = 'Offline caching unavailable';
    }
}

async function retrieveImage(){
    const response = await fetch('images/index.json');
    const imageList = await response.json();
    const imageIndex = Math.floor(imageList.length * Math.random());
    const imageUrl = `images/${imageList[imageIndex]}`;

    const image = document.createElement('IMG');
    image.src = imageUrl;

    const addButton = document.createElement('BUTTON');
    addButton.innerText = "Save offline";
    addButton.addEventListener('click', () => messageServiceWorker({
        type: 'image_add',
        payload: imageList[imageIndex]
    }));
    const removeButton = document.createElement('BUTTON');
    removeButton.innerText = "Don't save offline";
    removeButton.addEventListener('click', () => messageServiceWorker({
        type: 'image_remove',
        payload: imageList[imageIndex]
    }));

    const imageContainer = document.createElement('DIV');
    imageContainer.append(image, addButton, removeButton);

    document.getElementById('image-target').prepend(imageContainer);
}

function registerServiceWorker(){
    document.getElementById('status').innerText = 'Installing offline caching...';
    navigator.serviceWorker.register('service.js')
    .then(() => {
        document.getElementById('status').innerText = 'Offline caching installed.';
    })
    .catch(err => {
        document.getElementById('status').innerText = 'Error installing caching service.';
        console.error(err);
    });
}

function messageServiceWorker(message){
    navigator.serviceWorker.controller.postMessage(message);
}
