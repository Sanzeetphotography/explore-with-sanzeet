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

// Initialize Firebase & Database
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); 

document.addEventListener('DOMContentLoaded', () => {
    
    const loginBtn = document.getElementById('adminLoginBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const photoUploadInput = document.getElementById('photoUploadInput');
    const gallery = document.getElementById('mainGallery');

    // 1. PAGE KHULTE HI DATABASE SE PHOTOS LAANA (Sabke phone par dikhane ke liye)
    db.collection("photos").orderBy("timestamp", "desc").get().then((querySnapshot) => {
        gallery.innerHTML = ''; 
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const newItem = document.createElement('div');
            newItem.className = `gallery-item ${data.category}`;
            newItem.innerHTML = `<img src="${data.url}" alt="${data.category}" class="secure-img">`;
            gallery.appendChild(newItem);
        });
    });

    // 2. LOGIN SYSTEM
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

    // 3. SMART UPLOAD SYSTEM
    if(uploadBtn && photoUploadInput) {
        uploadBtn.addEventListener('click', () => {
            photoUploadInput.click();
        });

        photoUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(!file) return;

            const options = "nature, animal, birds, mountains, forest, historical, earth, ocean, aesthetic";
            let category = prompt(`HD Photo select ho gayi!\n\nKripya iski category type karein:\n(${options})`);
            
            if(!category) {
                alert("Upload cancel ho gaya. Category batana zaroori hai.");
                return;
            }

            category = category.toLowerCase().trim();
            alert(`Uploading to ${category}... Please wait.`);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "sanzeet_upload"); 
            formData.append("folder", `photos/${category}`);

            // A: Pehle Cloudinary par photo bhejein
            fetch("https://api.cloudinary.com/v1_1/dijtjmuxq/image/upload", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if(data.secure_url) {
                    const downloadURL = data.secure_url;
                    
                    // B: Link Database mein save karein
                    db.collection("photos").add({
                        url: downloadURL,
                        category: category,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    })
                    .then(() => {
                        alert("Success! Photo upload ho gayi aur ab sabko dikhegi.");
                        
                        // C: Aapki screen par turant dikhane ke liye
                        const newItem = document.createElement('div');
                        newItem.className = `gallery-item ${category}`;
                        newItem.innerHTML = `<img src="${downloadURL}" alt="${category}" class="secure-img">`;
                        gallery.prepend(newItem);
                        photoUploadInput.value = '';
                    })
                    .catch((dbError) => {
                        alert("Database error: " + dbError.message);
                    });

                } else {
                    alert("Upload error ho gaya.");
                }
            })
            .catch((error) => {
                alert("Upload fail ho gaya: " + error.message);
            });
        });
    }

    // 4. FILTER SYSTEM
    const selectContainer = document.getElementById('selectContainer');
    const categoryList = document.getElementById('categoryList');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (selectContainer && categoryList) {
        selectContainer.addEventListener('click', (e) => {
            if (!e.target.classList.contains('filter-btn')) {
                categoryList.classList.toggle('show');
            }
        });
    }

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
            categoryList.classList.remove('show');
        });
    });

    // 5. SECURITY (No Right-Click)
    document.addEventListener('contextmenu', function(e) {
        if(e.target.classList.contains('secure-img')) e.preventDefault(); 
    });
    document.addEventListener('dragstart', function(e) {
        if(e.target.classList.contains('secure-img')) e.preventDefault(); 
    });
});
