// 1. SELECT Menu Dropdown Functionality
const selectContainer = document.getElementById('selectContainer');
const categoryList = document.getElementById('categoryList');

// Jab koi SELECT box par click karega, list dikhegi ya chhupegi
selectContainer.addEventListener('click', () => {
    categoryList.classList.toggle('show');
});

// 2. SMART FILTERING: Category filter code
const filterButtons = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // Event bubbling rokne ke liye taaki click par list turant band na ho
        e.stopPropagation(); 
        
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');

        const filterValue = button.getAttribute('data-filter');

        // Photos filter karna
        galleryItems.forEach(item => {
            if (filterValue === 'all' || item.classList.contains(filterValue)) {
                item.style.display = 'block'; 
            } else {
                item.style.display = 'none';  
            }
        });

        // Optional: Filter karne ke baad list wapas chhipa dein
        categoryList.classList.remove('show');
    });
});

// 3. SECURITY: Disable Right-Click (Photo chori rokne ke liye)
document.addEventListener('contextmenu', function(e) {
    if(e.target.classList.contains('secure-img')) {
        e.preventDefault(); 
    }
});

// 4. SECURITY: Disable Drag and Drop
document.addEventListener('dragstart', function(e) {
    if(e.target.classList.contains('secure-img')) {
        e.preventDefault(); 
    }
});
