document.addEventListener('DOMContentLoaded', initializeDOM);

function initializeDOM(){
    const generatorButton = document.getElementById('image-generator');
    generatorButton.addEventListener('click', retrieveImage);
}

async function retrieveImage(){
    const response = await fetch('images/index.json');
    const imageList = await response.json();
    const imageIndex = Math.floor(imageList.length * Math.random());
    const imageUrl = `images/${imageList[imageIndex]}`;

    const image = document.createElement('IMG');
    image.src = imageUrl;
    document.getElementById('image-target').prepend(image);
}
