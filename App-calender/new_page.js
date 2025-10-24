document.addEventListener('DOMContentLoaded', () => {
    const addPhotoBtn = document.getElementById('add-photo-btn');
    const photoInput = document.getElementById('photo-input');
    const imageContainer = document.getElementById('image-container');
    const backBtn = document.getElementById('back-to-calendar-btn');
    const STORAGE_KEY = 'saved-photo';

    function displayImage(imageDataUrl) {
        const img = document.createElement('img');
        img.src = imageDataUrl;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-photo-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', clearImage);

        imageContainer.innerHTML = '';
        imageContainer.appendChild(img);
        imageContainer.appendChild(deleteBtn);
        imageContainer.classList.add('has-image');
    }

    function clearImage() {
        imageContainer.innerHTML = '';
        imageContainer.classList.remove('has-image');
        photoInput.value = '';
        localStorage.removeItem(STORAGE_KEY);
    }

    const savedImage = localStorage.getItem(STORAGE_KEY);
    if (savedImage) {
        displayImage(savedImage);
    }

    addPhotoBtn.addEventListener('click', () => {
        photoInput.click();
    });

    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    photoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageDataUrl = e.target.result;
                localStorage.setItem(STORAGE_KEY, imageDataUrl);
                displayImage(imageDataUrl);
            };
            reader.readAsDataURL(file);
        }
    });
}); 