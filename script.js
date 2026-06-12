// FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyBmNYT07wtBxRdMmVgubRWUPEY3H6DQ608",
    authDomain: "sanzeet-photography.firebaseapp.com",
    projectId: "sanzeet-photography",
    storageBucket: "sanzeet-photography.firebasestorage.app",
    messagingSenderId: "307593623383",
    appId: "1:307593623383:web:ebc7de8415ce57703cf012",
    measurementId: "G-DHQVQF0D6Y"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    
    // LOGIN SYSTEM
    const loginBtn = document.getElementById('adminLoginBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const photoUploadInput = document.getElementById('photoUploadInput');
    const gallery = document.getElementById('mainGallery');

    if(loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = prompt("Admin Email daalein:");
            const password = prompt("Password daalein:");
            
            if(email && password) {
                auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    alert("Welcome Sanzeet! Aap log in ho gaye hain.");
                    loginBtn.style.display = 'none'; 
                    uploadBtn.style.display = 'inline-block'; 
                })
                .catch((error) => {
                    alert("Ghalat Email ya Password!");
                });
            }
        });
    }

    // 4. SMART UPLOAD SYSTEM (Full HD + Auto Category Prompt)
    if(uploadBtn && photoUploadInput) {
        // Upload button dabane par phone/PC ki gallery khulegi
        uploadBtn.addEventListener('click', () => {
            photoUploadInput.click();
        });

        // Jaise hi photo select hogi, yeh process shuru hoga
        photoUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(!file) return;

            // Options Dikhana
            const options = "nature, animal, birds, mountains, forest, historical, earth, ocean, aesthetic";
            let category = prompt(`HD Photo select ho gayi!\n\nKripya iski category type karein:\n(${options})`);
            
            if(!category) {
                alert("Upload cancel ho gaya. Category batana zaroori hai.");
                return;
            }

            category = category.toLowerCase().trim();
            
            alert(`Uploading to ${category}... Please wait. Original high-quality photo hai toh thoda time lag sakta hai.`);

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
    const downloadURL = data.secure_url;

    alert("Success! Photo Full HD me upload ho gayi.");

    const newItem = document.createElement('div');
    newItem.className = `gallery-item ${category}`;
    newItem.innerHTML = `<img src="${downloadURL}" alt="${category}" class="secure-img">`;

    gallery.prepend(newItem);

    photoUploadInput.value = '';
})
.catch((error) => {
    alert("Upload fail ho gaya: " + error.message);
});
                gallery.prepend(newItem);
                
                // Upload complete hone ke baad input clear karna
                photoUploadInput.value = '';
            }).catch((error) => {
                alert("Upload fail ho gaya: " + error.message);
            });
        });
    }

    // DROP-DOWN & FILTER SYSTEM
    const selectContainer = document.getElementById('selectContainer');
    const categoryList = document.getElementById('categoryList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (selectContainer && categoryList) {
        selectContainer.addEventListener('click', (e) => {
            if (!e.target.classList.contains('filter-btn')) {
                categoryList.classList.toggle('show');
            }
        });
    }

    // Filtering logic
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); 
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');

            // Find all gallery items dynamically (including newly uploaded ones)
            const currentGalleryItems = document.querySelectorAll('.gallery-item');
            
            currentGalleryItems.forEach(item => {
                if (filterValue === 'all' || item.classList.contains(filterValue)) {
                    item.style.display = 'block'; 
                } else {
                    item.style.display = 'none';  
                }
            });
            categoryList.classList.remove('show');
        });
    });

    // SECURITY (No Right-Click, No Drag)
    document.addEventListener('contextmenu', function(e) {
        if(e.target.classList.contains('secure-img')) e.preventDefault(); 
    });
    document.addEventListener('dragstart', function(e) {
        if(e.target.classList.contains('secure-img')) e.preventDefault(); 
    });
});
