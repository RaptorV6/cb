document.addEventListener('DOMContentLoaded', function() {
    // User menu dropdown
    const userIcon = document.getElementById('user-icon');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (userIcon && dropdownMenu) {
        userIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('active');
        });

        document.addEventListener('click', function() {
            if (dropdownMenu.classList.contains('active')) {
                dropdownMenu.classList.remove('active');
            }
        });

        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});