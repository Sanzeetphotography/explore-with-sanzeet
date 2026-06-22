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
const googleProvider = new firebase.auth.GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
    
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const uploadBtn = document.getElementById('uploadBtn');
    const photoUploadInput = document.getElementById('photoUploadInput');
    const gallery = document.getElementById('mainGallery');
    const loader = document.getElementById('loader');
    
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxText = document.getElementById('lightbox-text');
    const closeLightbox = document.getElementById('closeLightbox');

    let currentUser = null;

    if(loader) { setTimeout(() => { loader.style.display = 'none'; }, 5000); }

    // 🌟 VIP FEATURE: Check who is logged in
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if(user) {
            if(googleLoginBtn) googleLoginBtn.style.display = 'none';
            if(userNameDisplay) {
                userNameDisplay.innerText = `Hi, ${user.displayName ? user.displayName.split(' ')[0] : 'Admin'}! 👋`;
                userNameDisplay.style.display = 'inline-block';
            }
        } else {
            if(googleLoginBtn) googleLoginBtn.style.display = 'inline-block';
            if(userNameDisplay) userNameDisplay.style.display = 'none';
        }
        // Load gallery when user state is checked (to show correct likes)
        if(gallery) loadGallery();
    });

    // 🌟 VIP FEATURE: Google Login System
    if(googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            auth.signInWithPopup(googleProvider).then((result) => {
                alert(`Welcome ${result.user.displayName}! Ab aap photos like kar sakte hain.`);
            }).catch((error) => alert("Login failed: " + error.message));
        });
    }

    if(gallery) {
        function createGalleryItem(docId, data) {
            const newItem = document.createElement('div');
            newItem.className = `gallery-item ${data.category}`;
            
            const fastThumbnailUrl = data.url.replace('/upload/', '/upload/q_auto,f_auto,w_600/');
            
            // Asli Views aur Likes Database se
            const viewsCount = data.views || 0;
            const likesArray = data.likes || [];
            const likesCount = likesArray.length;
            const hasLiked = currentUser && likesArray.includes(currentUser.uid);
            const heartIcon = hasLiked ? '❤️' : '🤍'; // Pura laal dil agar like kiya hai, warna khali

            newItem.innerHTML = `
                <img src="${fastThumbnailUrl}" alt="${data.category}" class="secure-img" loading="lazy">
                <div class="overlay">
                    <span>Captured by Sanzeet</span>
                    <div class="stats-icons">
                        <span class="like-btn" style="cursor:pointer; font-size:1.1rem; transition:0.3s;" title="Like this photo">${heartIcon} ${likesCount}</span> 
                        <span title="Total Views">👁️ ${viewsCount}</span>
                    </div>
                    <div class="action-btns">
                        <button class="action-btn share-btn" title="Share">🟢 Share</button>
                        <button class="action-btn download-btn" title="Download">⬇️ Get HD</button>
                    </div>
                </div>
            `;
            
            // 🌟 ASLI LIKE BUTTON 🌟
            const likeBtn = newItem.querySelector('.like-btn');
            likeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                if(!currentUser) {
                    alert("Like karne ke liye pehle 'G Login' button dabakar login karein! 🔐");
                    return;
                }
                const photoRef = db.collection("photos").doc(docId);
                if(hasLiked) {
                    photoRef.update({ likes: firebase.firestore.FieldValue.arrayRemove(currentUser.uid) }).then(() => loadGallery());
                } else {
                    photoRef.update({ likes: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) }).then(() => loadGallery());
                }
            });

            // 🌟 ASLI VIEWS SYSTEM 🌟 (Jab photo open hogi, views badh jayenge)
            newItem.querySelector('img').addEventListener('click', () => {
                if(lightbox) {
                    lightbox.style.display = 'flex';
                    lightboxImg.src = data.url;
                    lightboxText.innerText = `Category: ${data.category}`;
                    
                    // View update in database
                    db.collection("photos").doc(docId).update({ views: firebase.firestore.FieldValue.increment(1) });
                }
            });

            const shareBtn = newItem.querySelector('.share-btn');
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                window.open(`https://api.whatsapp.com/send?text=Check out this amazing nature photo! 🌿📷 %0A%0A${data.url}`, '_blank');
            });

            const downloadBtn = newItem.querySelector('.download-btn');
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const watermarkedUrl = data.url.replace('/upload/', '/upload/fl_attachment,l_text:Arial_25_bold_italic:Sanzeet%20Photography,co_white,o_70,e_shadow:50,g_south_east,x_20,y_20/');
                window.open(watermarkedUrl, '_blank');
            });

            return newItem;
        }

        function loadGallery() {
            db.collection("photos").orderBy("timestamp", "desc").get().then((querySnapshot) => {
                gallery.innerHTML = ''; 
                querySnapshot.forEach((doc) => {
                    gallery.appendChild(createGalleryItem(doc.id, doc.data()));
                });
                if(loader) loader.style.display = 'none'; 
            });
        }

        const searchInput = document.getElementById('searchInput');
        if(searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                const searchText = e.target.value.toLowerCase().trim();
                const items = document.querySelectorAll('.gallery-item');
                items.forEach(item => { item.style.display = item.className.toLowerCase().includes(searchText) ? 'block' : 'none'; });
            });
        }

        const selectContainer = document.getElementById('selectContainer');
        const selectHeading = document.getElementById('selectHeading');
        const categoryList = document.getElementById('categoryList');
        
        if(selectContainer) selectContainer.addEventListener('click', () => { categoryList.classList.toggle('show'); });
        document.addEventListener('click', (e) => { if (selectContainer && !selectContainer.contains(e.target)) categoryList.classList.remove('show'); });

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); 
                filterBtns.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                if(selectHeading) selectHeading.innerText = button.innerText.toUpperCase() + ' ▼';
                if(categoryList) categoryList.classList.remove('show');
                
                const filterValue = button.getAttribute('data-filter');
                const items = document.querySelectorAll('.gallery-item');
                items.forEach(item => { item.style.display = (filterValue === 'all' || item.classList.contains(filterValue)) ? 'block' : 'none'; });
            });
        });
    } 

    if(closeLightbox) closeLightbox.addEventListener('click', () => { lightbox.style.display = 'none'; });
    if(lightbox) lightbox.addEventListener('click', (e) => { if(e.target === lightbox) lightbox.style.display = 'none'; });

    if(adminLoginBtn) {
        adminLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = prompt("Admin Email:");
            const password = prompt("Password:");
            if(email && password) {
                auth.signInWithEmailAndPassword(email, password).then(() => {
                    alert("Welcome Boss!");
                    adminLoginBtn.style.display = 'none'; 
                    if(uploadBtn) uploadBtn.style.display = 'inline-block'; 
                }).catch(() => alert("Ghalat Email ya Password!"));
            }
        });
    }

    if(uploadBtn && photoUploadInput) {
        uploadBtn.addEventListener('click', () => photoUploadInput.click());
        photoUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(!file) return;
            let category = prompt("Category (nature, animal, birds, mountains, forest, historical, earth, ocean, aesthetic):");
            if(!category) return;
            category = category.toLowerCase().trim();
            alert(`Uploading... Please wait.`);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "sanzeet_upload"); 
            formData.append("folder", `photos/${category}`);

            fetch("https://api.cloudinary.com/v1_1/dijtjmuxq/image/upload", { method: "POST", body: formData })
            .then(res => res.json()).then(data => {
                if(data.secure_url) {
                    db.collection("photos").add({
                        url: data.secure_url, category: category, views: 0, likes: [], timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        alert("Success! Photo upload ho gayi.");
                        if(gallery && typeof loadGallery === 'function') loadGallery();
                        photoUploadInput.value = '';
                    });
                }
            });
        });
    }
    document.addEventListener('contextmenu', e => { if(e.target.classList.contains('secure-img')) e.preventDefault(); });
});
