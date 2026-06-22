$(document).ready(function () {
    const url = 'http://localhost:3000/';

    // ─── jQuery Validate — Email Step ─────────────────────────
    $('#emailForm').validate({
        onkeyup: false,
        onfocusout: false,
        onclick: false,
        rules: {
            email: {
                required: true,
                email: true
            }
        },
        messages: {
            email: {
                required: 'Email is required.',
                email: 'Enter a valid email address.'
            }
        },
        errorElement: 'label',
        errorClass: 'error',
        errorPlacement: function (error, element) {
            error.insertAfter(element);
        },
        submitHandler: function () {
            const email = $('#email').val().trim();
            $('#step-email').addClass('pp-step-exit');
            setTimeout(function () {
                $('#step-email').hide().removeClass('pp-step-exit');
                $('#email-display').text(email);
                $('#step-password').addClass('pp-step-enter').show();
                setTimeout(function () {
                    $('#step-password').removeClass('pp-step-enter');
                    $('#password').focus();
                }, 10);
            }, 300);
        }
    });

    // ─── jQuery Validate — Password Step ──────────────────────
    $('#loginForm').validate({
        onkeyup: true,
        onfocusout: true,
        onclick: false,
        rules: {
            password: {
                required: true,
                minlength: 6
            }
        },
        messages: {
            password: {
                required: 'Password is required.',
                minlength: 'At least 6 characters.'
            }
        },
        errorElement: 'label',
        errorClass: 'error',
        errorPlacement: function (error, element) {
            error.insertAfter(element);
        },
        submitHandler: function () {
            doLogin();
        }
    });

    // ─── Back button ──────────────────────────────────────────
    $('#btn-back').on('click', function () {
        $('#step-password').addClass('pp-step-exit');
        setTimeout(function () {
            $('#step-password').hide().removeClass('pp-step-exit');
            $('#password').val('');
            $('#password').removeClass('error');
            $('#loginForm').validate().resetForm();
            $('.error').removeClass('error');
            $('#step-email').addClass('pp-step-enter').show();
            setTimeout(function () {
                $('#step-email').removeClass('pp-step-enter');
                $('#email').focus();
            }, 10);
        }, 300);
    });

    // ─── Toggle Password Visibility ───────────────────────────
    $('#btn-toggle-pw').on('click', function () {
        const pw = $('#password');
        const isHidden = pw.attr('type') === 'password';
        pw.attr('type', isHidden ? 'text' : 'password');

        const icon = $('#eye-icon');
        if (isHidden) {
            icon.html(`
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 002.25 12c1.5 4.5 5.25 7.5 9.75 7.5a10.45 10.45 0 005.77-1.73M6.53 6.53A9.77 9.77 0 0112 4.5c4.5 0 8.25 3 9.75 7.5a10.49 10.49 0 01-4.08 5.47M6.53 6.53L3 3m3.53 3.53l4.72 4.72M9.75 9.75a3 3 0 014.5 4.5m0 0L21 21m-6.75-6.75l-4.72-4.72"/>
            `);
        } else {
            icon.html(`
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12C3.75 7.5 7.5 4.5 12 4.5s8.25 3 9.75 7.5c-1.5 4.5-5.25 7.5-9.75 7.5S3.75 16.5 2.25 12z"/>
                <circle cx="12" cy="12" r="3" stroke-linecap="round"/>
            `);
        }
    });

    // ─── Login AJAX ───────────────────────────────────────────
    function doLogin() {
        const email = $('#email').val().trim();
        const password = $('#password').val();

        $.ajax({
            method: 'POST',
            url: `${url}api/v1/login`,
            data: JSON.stringify({ email, password }),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            success: function (data) {
                sessionStorage.setItem('token', JSON.stringify(data.token));
                sessionStorage.setItem('userId', JSON.stringify(data.user.id));
                sessionStorage.setItem('role', data.user.role);
                sessionStorage.setItem('user', JSON.stringify(data.user));

                const guestCart = JSON.parse(sessionStorage.getItem('cart')) || [];

                if (guestCart.length > 0) {
                    const items = guestCart.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity
                    }));

                    $.ajax({
                        method: 'POST',
                        url: `${url}api/v1/cart/merge`,
                        data: JSON.stringify({ items }),
                        processData: false,
                        contentType: 'application/json; charset=utf-8',
                        dataType: 'json',
                        headers: { Authorization: `Bearer ${data.token}` },
                        success: function () {
                            sessionStorage.removeItem('cart');
                            Swal.fire({
                                toast: true,
                                position: 'bottom-right',
                                icon: 'success',
                                text: 'Login success! Cart merged.',
                                showConfirmButton: false,
                                timer: 1000,
                                timerProgressBar: true,
                                background: '#faf7f4',
                                color: '#1a0d14',
                                iconColor: '#8b1a4a'
                            });
                            setTimeout(() => {
                                window.location.href = data.user.role === 'admin' ? 'dashboard.html' : 'home.html';
                            }, 1000);
                        },
                        error: function () {
                            setTimeout(() => {
                                window.location.href = data.user.role === 'admin' ? 'dashboard.html' : 'home.html';
                            }, 1000);
                        }
                    });
                } else {
                    Swal.fire({
                        toast: true,
                        position: 'bottom-right',
                        icon: 'success',
                        text: 'Welcome back!',
                        showConfirmButton: false,
                        timer: 1000,
                        timerProgressBar: true,
                        background: '#faf7f4',
                        color: '#1a0d14',
                        iconColor: '#8b1a4a'
                    });
                    setTimeout(() => {
                        window.location.href = data.user.role === 'admin' ? 'dashboard.html' : 'home.html';
                    }, 1000);
                }
            },
            error: function (err) {
                // Show error under password field
                const validator = $('#loginForm').validate();
                validator.showErrors({
                    password: err.responseJSON?.message || 'Invalid email or password.'
                });
            }
        });
    }
});