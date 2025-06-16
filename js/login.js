document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and forms
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            // Add active class to clicked tab and corresponding form
            this.classList.add('active');
            const formId = `${this.dataset.tab}-form`;
            document.getElementById(formId).classList.add('active');
        });
    });

    // Login form submission handling
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        //const rememberMe = document.getElementById('remember-me').checked;

        // Basic validation
        if (!username || !password) {
            showError(loginForm, 'Vyplňte prosím všechna povinná pole.');
            return;
        }

        // Send AJAX request
        const formData = new FormData();
        formData.append('action', 'login');
        formData.append('username', username);
        formData.append('password', password);
        const csrfToken = loginForm.querySelector('input[name="csrf_token"]').value;
        formData.append('csrf_token', csrfToken);
        //formData.append('remember', rememberMe);

        fetch('auth_handlers.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showSuccess(loginForm, data.message);

                    // Redirect after a short delay
                    setTimeout(() => {
                        window.location.href = data.redirect || 'index.php';
                    }, 1000);
                } else {
                    showError(loginForm, data.message);
                }
            })
            .catch(error => {
                showError(loginForm, 'Došlo k chybě při přihlašování. Zkuste to prosím znovu.');
                console.error('Error:', error);
            });
    });

    // Registration form submission handling
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const agreeTerms = document.getElementById('agree-terms').checked;

        // Basic validation
        if (!username || !password || !passwordConfirm) {
            showError(registerForm, 'Vyplňte prosím všechna povinná pole.');
            return;
        }

        if (password !== passwordConfirm) {
            showError(registerForm, 'Hesla se neshodují.');
            return;
        }

        if (!agreeTerms) {
            showError(registerForm, 'Pro registraci musíte souhlasit s obchodními podmínkami.');
            return;
        }

        // Password strength validation
        if (password.length < 8) {
            showError(registerForm, 'Heslo musí mít alespoň 8 znaků.');
            return;
        }

        // Send AJAX request
        const formData = new FormData();
        formData.append('action', 'register');
        formData.append('username', username);
        formData.append('password', password);
        const csrfTokenReg = registerForm.querySelector('input[name="csrf_token"]').value;
        formData.append('csrf_token', csrfTokenReg);

        fetch('auth_handlers.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showSuccess(registerForm, data.message);

                    // Switch to login tab after successful registration
                    setTimeout(() => {
                        tabs[0].click();
                        document.getElementById('login-username').value = username;
                    }, 1500);
                } else {
                    showError(registerForm, data.message);
                }
            })
            .catch(error => {
                showError(registerForm, 'Došlo k chybě při registraci. Zkuste to prosím znovu.');
                console.error('Error:', error);
            });
    });

    // Error message helper function
    function showError(form, message) {
        showToast(message, 'error');
    }

    // Success message helper function
    function showSuccess(form, message) {
        showToast(message, 'success');
    }

});