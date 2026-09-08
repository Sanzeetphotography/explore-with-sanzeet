/* ============================================================
   SANZEET PHOTOGRAPHY
   MAIN JAVASCRIPT
   VERSION 2.0
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyBmNYT07wtBxRdMmVgubRWUPEY3H6DQ608",
    authDomain: "sanzeet-photography.firebaseapp.com",
    projectId: "sanzeet-photography",
    storageBucket: "sanzeet-photography.firebasestorage.app",
    messagingSenderId: "307593623383",
    appId: "1:307593623383:web:ebc7de8415ce57703cf012",
    measurementId: "G-DHQVQF0D6Y"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();


/* ============================================================
   GLOBAL STATE
   ============================================================ */

let currentUser = null;
let allPhotos = [];
let visiblePhotos = [];
let currentPhotoIndex = 0;
let activeCategory = "all";
let searchQuery = "";


/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    initializeAuthentication();
    initializeGallery();
    initializeLightbox();
    initializeSearch();
    initializeCategoryFilters();
    initializeMobileMenu();
    initializeSecurity();
    initializeAdmin();
});


/* ============================================================
   AUTHENTICATION
   ============================================================ */

function initializeAuthentication() {

    auth.onAuthStateChanged((user) => {

        currentUser = user || null;

        const userNameDisplay =
            document.getElementById("userNameDisplay");

        const googleLoginBtn =
            document.getElementById("googleLoginBtn");

        if (user) {

            if (userNameDisplay) {
                const firstName =
                    user.displayName
                        ? user.displayName.split(" ")[0]
                        : "Explorer";

                userNameDisplay.innerText =
                    `Hi, ${firstName}`;
                
                userNameDisplay.style.display = "inline-block";
            }

            if (googleLoginBtn) {
                googleLoginBtn.style.display = "none";
            }

        } else {

            if (userNameDisplay) {
                userNameDisplay.style.display = "none";
            }

            if (googleLoginBtn) {
                googleLoginBtn.style.display = "inline-block";
            }
        }
    });


    const googleLoginBtn =
        document.getElementById("googleLoginBtn");

    if (googleLoginBtn) {

        googleLoginBtn.addEventListener("click", async () => {

            try {

                await auth.signInWithPopup(googleProvider);

                alert("Welcome to Sanzeet Photography 🌿");

            } catch (error) {

                console.error(error);

                alert(
                    "Login failed. Please try again."
                );
            }

        });
    }
}


/* ============================================================
   GALLERY INITIALIZATION
   ============================================================ */

function initializeGallery() {

    const gallery =
        document.getElementById("mainGallery");

    if (!gallery) return;

    loadGallery();
}


/* ============================================================
   LOAD PHOTOS FROM FIRESTORE
   ============================================================ */

async function loadGallery() {

    const gallery =
        document.getElementById("mainGallery");

    if (!gallery) return;

    gallery.innerHTML = `
        <div style="
            min-height:300px;
            display:grid;
            place-items:center;
            color:rgba(255,255,255,.5);
            font-size:12px;
            letter-spacing:.15em;
        ">
            LOADING FIELD ARCHIVE...
        </div>
    `;

    try {

        let snapshot;

        try {

            snapshot = await db
                .collection("photos")
                .orderBy("timestamp", "desc")
                .get();

        } catch (error) {

            console.warn(
                "Timestamp ordering failed. Loading without ordering.",
                error
            );

            snapshot = await db
                .collection("photos")
                .get();
        }


        allPhotos = [];

        snapshot.forEach((doc) => {

            const data = doc.data();

            allPhotos.push({
                id: doc.id,
                ...data
            });

        });


        applyFilters();

    } catch (error) {

        console.error("Gallery loading error:", error);

        gallery.innerHTML = `
            <div style="
                min-height:300px;
                display:grid;
                place-items:center;
                text-align:center;
                color:rgba(255,255,255,.6);
            ">
                <div>
                    <strong style="
                        display:block;
                        color:white;
                        font-size:24px;
                        margin-bottom:10px;
                    ">
                        Gallery couldn't load.
                    </strong>

                    Please check your Firebase connection.
                </div>
            </div>
        `;
    }
}


/* ============================================================
   FILTER SYSTEM
   ============================================================ */

function initializeCategoryFilters() {

    const buttons =
        document.querySelectorAll(".category-tab");

    buttons.forEach((button) => {

        button.addEventListener("click", () => {

            buttons.forEach((btn) =>
                btn.classList.remove("active")
            );

            button.classList.add("active");

            activeCategory =
                button.dataset.filter || "all";

            applyFilters();

        });

    });


    /* Read category from URL */

    const params =
        new URLSearchParams(window.location.search);

    const urlCategory =
        params.get("category");

    if (urlCategory) {

        activeCategory =
            urlCategory.toLowerCase();

        buttons.forEach((button) => {

            button.classList.toggle(
                "active",
                button.dataset.filter === activeCategory
            );

        });
    }
}


function initializeSearch() {

    const searchInput =
        document.getElementById("searchInput");

    if (!searchInput) return;

    searchInput.addEventListener(
        "input",
        (event) => {

            searchQuery =
                event.target.value
                    .toLowerCase()
                    .trim();

            applyFilters();
        }
    );
}


function applyFilters() {

    visiblePhotos =
        allPhotos.filter((photo) => {

            const category =
                String(photo.category || "")
                    .toLowerCase()
                    .trim();

            const title =
                String(
                    photo.title ||
                    photo.name ||
                    ""
                ).toLowerCase();

            const location =
                String(
                    photo.location || ""
                ).toLowerCase();

            const story =
                String(
                    photo.story || ""
                ).toLowerCase();


            const categoryMatch =
                activeCategory === "all" ||
                category === activeCategory;


            const searchMatch =
                !searchQuery ||
                category.includes(searchQuery) ||
                title.includes(searchQuery) ||
                location.includes(searchQuery) ||
                story.includes(searchQuery);


            return categoryMatch && searchMatch;
        });


    renderGallery();
}


/* ============================================================
   RENDER GALLERY
   ============================================================ */

function renderGallery() {

    const gallery =
        document.getElementById("mainGallery");

    const count =
        document.getElementById("visibleCount");

    const empty =
        document.getElementById("emptyGallery");

    if (!gallery) return;


    gallery.innerHTML = "";


    if (count) {
        count.innerText =
            visiblePhotos.length;
    }


    if (visiblePhotos.length === 0) {

        if (empty) {
            empty.style.display = "block";
        }

        return;

    } else {

        if (empty) {
            empty.style.display = "none";
        }
    }


    visiblePhotos.forEach(
        (photo, index) => {

            const card =
                createGalleryCard(
                    photo,
                    index
                );

            gallery.appendChild(card);
        }
    );
}


/* ============================================================
   CREATE GALLERY CARD
   ============================================================ */

function createGalleryCard(photo, index) {

    const card =
        document.createElement("article");

    card.className =
        "gallery-card";

    card.dataset.category =
        String(photo.category || "")
            .toLowerCase();

    const category =
        cleanText(
            photo.category ||
            "Nature"
        );

    const title =
        cleanText(
            photo.title ||
            photo.name ||
            "Untitled Frame"
        );

    const location =
        cleanText(
            photo.location ||
            "Field Archive"
        );

    const imageUrl =
        optimizeCloudinaryImage(
            photo.url,
            1000
        );

    const number =
        String(index + 1)
            .padStart(2, "0");


    card.innerHTML = `

        <img
            src="${escapeAttribute(imageUrl)}"
            alt="${escapeAttribute(title)}"
            loading="lazy"
            draggable="false"
            class="secure-img"
        >

        <div class="card-overlay">

            <div class="card-top">

                <span class="card-category">
                    ${escapeHTML(category)}
                </span>

                <span class="card-index">
                    ${number}
                </span>

            </div>

            <div class="card-bottom">

                <div>

                    <div class="card-title">
                        ${escapeHTML(title)}
                    </div>

                    <div class="card-meta">
                        ${escapeHTML(location)}
                    </div>

                </div>

                <div class="view-mark">
                    ↗
                </div>

            </div>

        </div>
    `;


    card.addEventListener(
        "click",
        () => {

            openViewer(index);

        }
    );


    return card;
}


/* ============================================================
   CLOUDINARY IMAGE OPTIMIZATION
   ============================================================ */

function optimizeCloudinaryImage(url, width = 1000) {

    if (!url) return "";

    if (
        !url.includes("res.cloudinary.com") ||
        !url.includes("/upload/")
    ) {
        return url;
    }

    return url.replace(
        "/upload/",
        `/upload/q_auto,f_auto,w_${width}/`
    );
}


/* ============================================================
   LIGHTBOX / VIEWER
   ============================================================ */

function initializeLightbox() {

    const lightbox =
        document.getElementById("lightbox");

    const closeBtn =
        document.getElementById("closeLightbox");

    const prevBtn =
        document.getElementById("prevPhoto");

    const nextBtn =
        document.getElementById("nextPhoto");

    if (!lightbox) return;


    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            closeViewer
        );

    }


    if (prevBtn) {

        prevBtn.addEventListener(
            "click",
            previousPhoto
        );

    }


    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            nextPhoto
        );

    }


    lightbox.addEventListener(
        "click",
        (event) => {

            if (
                event.target === lightbox
            ) {
                closeViewer();
            }

        }
    );


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                !lightbox.classList.contains("open")
            ) return;


            if (event.key === "Escape") {
                closeViewer();
            }

            if (event.key === "ArrowLeft") {
                previousPhoto();
            }

            if (event.key === "ArrowRight") {
                nextPhoto();
            }

        }
    );


    initializeTouchSwipe();
}


/* ============================================================
   OPEN VIEWER
   ============================================================ */

function openViewer(index) {

    if (!visiblePhotos.length) return;

    currentPhotoIndex = index;

    const lightbox =
        document.getElementById("lightbox");

    if (!lightbox) return;

    lightbox.classList.add("open");

    document.body.style.overflow = "hidden";

    renderViewerPhoto();

}


/* ============================================================
   RENDER VIEWER PHOTO
   ============================================================ */

function renderViewerPhoto() {

    const photo =
        visiblePhotos[currentPhotoIndex];

    if (!photo) return;


    const image =
        document.getElementById("lightbox-img");

    const title =
        document.getElementById("lightbox-title");

    const story =
        document.getElementById("lightbox-story");

    const number =
        document.getElementById("lightbox-number");

    const category =
        document.getElementById("lightbox-text");


    const storyText =
        photo.story ||
        photo.description ||
        "A moment captured in the field.";


    if (image) {

        image.src =
            optimizeCloudinaryImage(
                photo.url,
                1800
            );

        image.alt =
            photo.title ||
            photo.category ||
            "Sanzeet Photography";

    }


    if (title) {

        title.innerText =
            photo.title ||
            photo.name ||
            "Untitled Frame";

    }


    if (story) {

        story.innerText =
            storyText;

    }


    if (number) {

        number.innerText =
            `${String(currentPhotoIndex + 1).padStart(2, "0")} / ${String(visiblePhotos.length).padStart(2, "0")}`;

    }


    if (category) {

        category.innerText =
            String(
                photo.category ||
                "NATURE"
            ).toUpperCase();

    }


    updateStoryPanel(photo);

}


/* ============================================================
   NEXT / PREVIOUS
   ============================================================ */

function nextPhoto() {

    if (!visiblePhotos.length) return;

    currentPhotoIndex =
        (currentPhotoIndex + 1)
        % visiblePhotos.length;

    renderViewerPhoto();

}


function previousPhoto() {

    if (!visiblePhotos.length) return;

    currentPhotoIndex =
        (
            currentPhotoIndex -
            1 +
            visiblePhotos.length
        ) % visiblePhotos.length;

    renderViewerPhoto();

}


/* ============================================================
   CLOSE VIEWER
   ============================================================ */

function closeViewer() {

    const lightbox =
        document.getElementById("lightbox");

    if (!lightbox) return;

    lightbox.classList.remove("open");

    document.body.style.overflow = "";

    const storyPanel =
        document.getElementById("storyPanel");

    if (storyPanel) {
        storyPanel.classList.remove("show");
    }
}


/* ============================================================
   STORY PANEL
   ============================================================ */

function updateStoryPanel(photo) {

    const title =
        document.getElementById("storyTitle");

    const content =
        document.getElementById("storyContent");

    const location =
        document.getElementById("storyLocation");

    const date =
        document.getElementById("storyDate");


    if (title) {

        title.innerText =
            photo.title ||
            photo.name ||
            "Untitled Frame";

    }


    if (content) {

        content.innerText =
            photo.story ||
            photo.description ||
            "No story has been added to this photograph yet.";

    }


    if (location) {

        location.innerText =
            photo.location
                ? `Location — ${photo.location}`
                : "";

    }


    if (date) {

        date.innerText =
            photo.date ||
            photo.year
                ? `Date — ${photo.date || photo.year}`
                : "";

    }
}


/* ============================================================
   STORY BUTTON
   ============================================================ */

document.addEventListener(
    "click",
    (event) => {

        if (
            event.target &&
            event.target.id === "storyBtn"
        ) {

            const panel =
                document.getElementById("storyPanel");

            if (panel) {

                panel.classList.toggle("show");

            }
        }

    }
);


/* ============================================================
   SHARE
   ============================================================ */

document.addEventListener(
    "click",
    async (event) => {

        if (
            !event.target ||
            event.target.id !== "shareBtn"
        ) return;


        const photo =
            visiblePhotos[currentPhotoIndex];

        if (!photo) return;


        const shareText =
            `${photo.title || "Sanzeet Photography"} — ${photo.category || "Nature Photography"}`;


        try {

            if (
                navigator.share
            ) {

                await navigator.share({
                    title: shareText,
                    text: shareText,
                    url: window.location.href
                });

            } else {

                await navigator.clipboard.writeText(
                    window.location.href
                );

                alert(
                    "Gallery link copied."
                );
            }

        } catch (error) {

            console.log(
                "Share cancelled."
            );
        }

    }
);


/* ============================================================
   DOWNLOAD
   ============================================================ */

document.addEventListener(
    "click",
    (event) => {

        if (
            !event.target ||
            event.target.id !== "downloadBtn"
        ) return;


        const photo =
            visiblePhotos[currentPhotoIndex];

        if (!photo || !photo.url) return;


        let downloadUrl =
            photo.url;


        if (
            photo.url.includes(
                "res.cloudinary.com"
            )
        ) {

            downloadUrl =
                photo.url.replace(
                    "/upload/",
                    "/upload/fl_attachment,q_auto,f_auto/"
                );
        }


        incrementPhotoDownload(
            photo.id
        );


        window.open(
            downloadUrl,
            "_blank"
        );

    }
);


/* ============================================================
   VIEW COUNT
   ============================================================ */

async function incrementPhotoView(photoId) {

    if (!photoId) return;

    try {

        await db
            .collection("photos")
            .doc(photoId)
            .update({
                views:
                    firebase.firestore.FieldValue
                        .increment(1)
            });

    } catch (error) {

        console.warn(
            "View count update failed:",
            error
        );

    }
}


/* ============================================================
   DOWNLOAD COUNT
   ============================================================ */

async function incrementPhotoDownload(photoId) {

    if (!photoId) return;

    try {

        await db
            .collection("photos")
            .doc(photoId)
            .update({
                downloads:
                    firebase.firestore.FieldValue
                        .increment(1)
            });

    } catch (error) {

        console.warn(
            "Download count update failed:",
            error
        );

    }
}


/* ============================================================
   TOUCH SWIPE
   ============================================================ */

function initializeTouchSwipe() {

    const lightbox =
        document.getElementById("lightbox");

    if (!lightbox) return;


    let startX = 0;
    let startY = 0;


    lightbox.addEventListener(
        "touchstart",
        (event) => {

            const touch =
                event.changedTouches[0];

            startX =
                touch.screenX;

            startY =
                touch.screenY;

        },
        { passive: true }
    );


    lightbox.addEventListener(
        "touchend",
        (event) => {

            const touch =
                event.changedTouches[0];

            const diffX =
                touch.screenX - startX;

            const diffY =
                touch.screenY - startY;


            if (
                Math.abs(diffX) > 60 &&
                Math.abs(diffX) > Math.abs(diffY)
            ) {

                if (diffX < 0) {
                    nextPhoto();
                } else {
                    previousPhoto();
                }

            }

        },
        { passive: true }
    );
}


/* ============================================================
   MOBILE MENU
   ============================================================ */

function initializeMobileMenu() {

    const button =
        document.getElementById(
            "mobileMenuBtn"
        );

    if (!button) return;

    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "mobile-menu-open"
            );

        }
    );
}


/* ============================================================
   SECURITY / IMAGE PROTECTION
   ============================================================ */

function initializeSecurity() {

    document.addEventListener(
        "contextmenu",
        (event) => {

            if (
                event.target &&
                event.target.tagName === "IMG"
            ) {

                event.preventDefault();

            }

        }
    );


    document.addEventListener(
        "dragstart",
        (event) => {

            if (
                event.target &&
                event.target.tagName === "IMG"
            ) {

                event.preventDefault();

            }

        }
    );
}


/* ============================================================
   ADMIN LOGIN
   ============================================================ */

function initializeAdmin() {

    const adminLoginBtn =
        document.getElementById(
            "adminLoginBtn"
        );

    if (!adminLoginBtn) return;


    adminLoginBtn.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            const email =
                prompt("Admin Email:");

            if (!email) return;


            const password =
                prompt("Admin Password:");

            if (!password) return;


            try {

                await auth.signInWithEmailAndPassword(
                    email,
                    password
                );


                alert(
                    "Welcome to Admin Dashboard."
                );


                if (
                    window.location.pathname
                        .includes("index.html") ||
                    window.location.pathname === "/"
                ) {

                    window.location.href =
                        "admin.html";
                }


            } catch (error) {

                console.error(error);

                alert(
                    "Invalid admin email or password."
                );

            }

        }
    );
}


/* ============================================================
   HELPERS
   ============================================================ */

function cleanText(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value).trim();
}


function escapeHTML(value) {

    return cleanText(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeAttribute(value) {

    return escapeHTML(value);
}


/* ============================================================
   PREVENT BROKEN IMAGE LAYOUT
   ============================================================ */

document.addEventListener(
    "error",
    (event) => {

        if (
            event.target &&
            event.target.tagName === "IMG"
        ) {

            event.target.style.background =
                "#111411";

        }

    },
    true
);
