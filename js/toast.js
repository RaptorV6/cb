document.addEventListener('DOMContentLoaded', function() {
    // Vytvoření kontejneru pro toast notifikace
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    // Globální funkce pro zobrazení toast notifikace
    window.showToast = function(message, type = 'success', duration = 3000) {
        // Vytvoření toast prvku
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Přidání obsahu toast notifikace
        toast.innerHTML = `
            ${message}
            <button class="toast-close">&times;</button>
        `;

        // Přidání toast notifikace do kontejneru
        toastContainer.appendChild(toast);

        // Přidání event listeneru pro zavírací tlačítko
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', function() {
            removeToast(toast);
        });

        // Automatické odstranění toast notifikace po určité době
        setTimeout(() => {
            if (document.body.contains(toast)) {
                removeToast(toast);
            }
        }, duration);
    };

    // Funkce pro odstranění toast notifikace
    function removeToast(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(120%)';

        // Smazat DOM element po dokončení animace
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 400);
    }

    // Kontrola URL parametrů pro zobrazení toast notifikace
    function checkUrlForMessages() {
        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has('toast_success')) {
            showToast(decodeURIComponent(urlParams.get('toast_success')), 'success');
            // Odstranění parametru z URL bez přesměrování
            removeParam('toast_success');
        }

        if (urlParams.has('toast_error')) {
            showToast(decodeURIComponent(urlParams.get('toast_error')), 'error');
            // Odstranění parametru z URL bez přesměrování
            removeParam('toast_error');
        }

        if (urlParams.has('toast_info')) {
            showToast(decodeURIComponent(urlParams.get('toast_info')), 'info');
            // Odstranění parametru z URL bez přesměrování
            removeParam('toast_info');
        }
    }

    // Funkce pro odstranění parametru z URL
    function removeParam(param) {
        const url = new URL(window.location.href);
        url.searchParams.delete(param);
        window.history.replaceState({}, '', url);
    }

    // Kontrola URL při načtení stránky
    checkUrlForMessages();
});