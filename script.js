/ 1. SECURITY: Disable Right-Click
document.addEventListener('contextmenu', function(e) {
    if(e.target.classList.contains('secure-img')) {
        e.preventDefault(); 
    }
});

// 2. SECURITY: Disable Drag and Drop
document.addEventListener('dragstart', function(e) {
    if(e.target.classList.contains('secure-img')) {
        e.preventDefault(); 
    }
});

// 3. SMART FILTERING: Category Menu functionality
const filterButtons = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        button.classList.add('active');

        const filterValue = button.getAttribute('data-filter');

        galleryItems.forEach(item => {
            if (filterValue === 'all' || item.classList.contains(filterValue)) {
                item.style.display = 'block'; 
            } else {
                item.style.display = 'none';  
            }
        });
    });
});
