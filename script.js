const firebaseConfig = {
    apiKey: "AIzaSyBmNYT07wtBxRdMmVgubRWUPEY3H6DQ608",
    authDomain: "sanzeet-photography.firebaseapp.com",
    projectId: "sanzeet-photography",
    storageBucket: "sanzeet-photography.firebasestorage.app",
    messagingSenderId: "307593623383",
    appId: "1:307593623383:web:ebc7de8415ce57703cf012",
    measurementId: "G-DHQVQF0D6Y"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); 

document.addEventListener('DOMContentLoaded', () => {
    
    const loginBtn = document.getElementById('adminLoginBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const photoUploadInput = document.getElementById('photoUploadInput');
    const gallery = document.getElementById('mainGallery');
    const loader = document.getElementById('loader');

    // LIGHTBOX ELEMENTS
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxText = document.getElementById('lightbox-text');
    const closeLightbox = document.getElementById('closeLightbox');

    // GALLERY RENDER FUNCTION (With Lazy Loading, Share & Download)
    function createGalleryItem(url, category) {
        const newItem = document.createElement('div');
        newItem.className = `gallery-item ${category}`;
        newItem.innerHTML = `
            <img src="${url}" alt="${category}" class="secure-img" loading="lazy">
            <div class="overlay">
                <span>Captured by Sanzeet</span><br>
                <small>#${category.toUpperCase()}</small>
                <div class="action-btns">
                    <button class="action-btn share-btn" title="Share on WhatsApp">🟢 Share</button>
                    <button class="action-btn download-btn" title="Download HD">⬇️ Get HD</button>
                </div>
            </div>
        `;
        
        // Open Lightbox on Click
        newItem.addEventListener('click', () => {
            lightbox.style.display = 'flex';
            lightboxImg.src = url;
            lightboxText.innerText = `Category: ${category}`;
        });

        // WhatsApp Share Function
        const shareBtn = newItem.querySelector('.share-btn');
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const msg = `Check out this amazing nature photo by Sanzeet! 🌿📷 %0A%0A${url}`;
            window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
        });

        // Download Function
        const downloadBtn = newItem.querySelector('.download-btn');
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            window.open(url, '_blank');
        });

        return newItem;
    }

    // CLOSE LIGHTBOX
    closeLightbox.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });
    lightbox.addEventListener('click', (e) => {
        if(e.target === lightbox) lightbox.style.display = 'none';
    });

    // DATABASE SE PHOTOS LAANA 
    db.collection("photos").orderBy("timestamp", "desc").get().then((querySnapshot) => {
        gallery.innerHTML = ''; 
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            gallery.appendChild(createGalleryItem(data.url, data.category));
        });
        loader.style.display = 'none'; 
    }).catch(() => {
        loader.style.display = 'none';
    });

    // SEARCH BAR ENGINE 🔍 (Fix kar diya gaya hai)
    const searchInput = document.getElementById('searchInput');
    if(searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const searchText = e.target.value.toLowerCase().trim();
            const currentGalleryItems = document.querySelectorAll('.gallery-item');
            
            currentGalleryItems.forEach(item => {
                if (item.className.toLowerCase().includes(searchText)) {
                    item.style.display = 'block'; 
                } else {
                    item.style.display = 'none';  
                }
            });
        });
    }

    // FILTER SYSTEM BY CATEGORY
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); 
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            const currentGalleryItems = document.querySelectorAll('.gallery-item');
            
            currentGalleryItems.forEach(item => {
                if (filterValue === 'all' || item.classList.contains(filterValue)) {
                    item.style.display = 'block'; 
                } else {
                    item.style.display = 'none';  
                }
            });
        });
    });

    // LOGIN SYSTEM
    if(loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = prompt("Admin Email daalein:");
            const password = prompt("Password daalein:");
            if(email && password) {
                auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    alert("Welcome Sanzeet!");
                    loginBtn.style.display = 'none'; 
                    uploadBtn.style.display = 'inline-block'; 
                })
                .catch(() => alert("Ghalat Email ya Password!"));
            }
        });
    }

    // SMART UPLOAD SYSTEM
    if(uploadBtn && photoUploadInput) {
        uploadBtn.addEventListener('click', () => photoUploadInput.click());

        photoUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(!file) return;

            let category = prompt("Photo ki category type karein:\n(nature, animal, birds, mountains, forest, historical, earth, ocean, aesthetic)");
            if(!category) return;
            category = category.toLowerCase().trim();
            alert(`Uploading... Please wait.`);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "sanzeet_upload"); 
            formData.append("folder", `photos/${category}`);

            fetch("https://api.cloudinary.com/v1_1/dijtjmuxq/image/upload", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if(data.secure_url) {
                    const downloadURL = data.secure_url;
                    db.collection("photos").add({
                        url: downloadURL,
                        category: category,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        alert("Success! Photo upload ho gayi.");
                        gallery.prepend(createGalleryItem(downloadURL, category));
                        photoUploadInput.value = '';
                    });
                }
            });
        });
    }

    // SECURITY (No Right-Click & No Dragging)
    document.addEventListener('contextmenu', e => { if(e.target.classList.contains('secure-img')) e.preventDefault(); });
    document.addEventListener('dragstart', e => { if(e.target.classList.contains('secure-img')) e.preventDefault(); });
});
