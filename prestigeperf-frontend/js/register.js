$(document).ready(function () {
    const url = 'http://localhost:3000/';

    // ─── Real-time AJAX Validation ────────────────────────────
    // Check username availability
    $('#username').on('blur', function () {
        const username = $(this).val().trim();
        if (username.length >= 3) {
            $.ajax({
                method: 'GET',
                url: `${url}api/v1/check-username/${username}`,
                success: function (data) {
                    if (data.exists) {
                        $('#username').addClass('is-invalid');
                        $('#username-error').remove();
                        $('#username').after('<label id="username-error" class="error">Username already taken.</label>');
                    } else {
                        $('#username').removeClass('is-invalid');
                        $('#username-error').remove();
                    }
                }
            });
        }
    });

    // Check email availability
    $('#email').on('blur', function () {
        const email = $(this).val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email)) {
            $.ajax({
                method: 'GET',
                url: `${url}api/v1/check-email/${email}`,
                success: function (data) {
                    if (data.exists) {
                        $('#email').addClass('is-invalid');
                        $('#email-error').remove();
                        $('#email').after('<label id="email-error" class="error">Email already registered.</label>');
                    } else {
                        $('#email').removeClass('is-invalid');
                        $('#email-error').remove();
                    }
                }
            });
        }
    });

    // ─── jQuery Validate ───────────────────────────────────────
    $('#registerForm').validate({
        onkeyup: true,
        onfocusout: true,
        onclick: false,
        rules: {
            username: {
                required: true,
                minlength: 3
            },
            full_name: {
                required: true,
                minlength: 2
            },
            email: {
                required: true,
                email: true
            },
            contact_number: { 
                required: true, 
                digits: true, 
                minlength: 10, 
                maxlength: 13 
            },
            address: { 
                required: true, 
                minlength: 5 
            },
            password: {
                required: true,
                minlength: 6
            },
            confirm_password: {
                required: true,
                equalTo: '#password'
            }
        },
        messages: {
            username: {
                required: 'Username is required.',
                minlength: 'At least 3 characters.'
            },
            full_name: {
                required: 'Full name is required.',
                minlength: 'At least 2 characters.'
            },
            email: {
                required: 'Email is required.',
                email: 'Enter a valid email address.'
            },
            contact_number: { 
                required: 'Contact number is required.', 
                digits: 'Must be numbers only.', 
                minlength: 'At least 10 digits.', 
                maxlength: 'Maximum 13 digits.' 
            },
            address: { 
                required: 'Address is required.', 
                minlength: 'At least 5 characters.' 
            },
            password: {
                required: 'Password is required.',
                minlength: 'At least 6 characters.'
            },
            confirm_password: {
                required: 'Please confirm your password.',
                equalTo: 'Passwords do not match.'
            }
        },
        errorElement: 'label',
        errorClass: 'error',
        errorPlacement: function (error, element) {
            error.insertAfter(element.closest('.pp-auth-input-wrap').find('.form-control'));
        },
        submitHandler: function () {
            // Check for existing validation errors first
            if ($('#username').hasClass('is-invalid') || $('#email').hasClass('is-invalid')) {
                Swal.fire({
                    toast: true,
                    position: 'bottom-right',
                    icon: 'error',
                    text: 'Please fix the errors above.',
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                    background: '#faf7f4',
                    color: '#1a0d14',
                    iconColor: '#8b1a4a'
                });
                return;
            }

            const username    = $('#username').val().trim();
            const full_name   = $('#full_name').val().trim();
            const email       = $('#email').val().trim();
            const contact_number = $('#contact_number').val().trim();
            const address = $('#address').val().trim();
            const password    = $('#password').val();

            $.ajax({
                method: 'POST',
                url: `${url}api/v1/register`,
                data: JSON.stringify({ username, full_name, email, contact_number, address, password }),
                processData: false,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                success: function () {
                    Swal.fire({
                        toast: true,
                        position: 'bottom-right',
                        icon: 'success',
                        text: 'Account created! Redirecting...',
                        showConfirmButton: false,
                        timer: 1500,
                        timerProgressBar: true,
                        background: '#faf7f4',
                        color: '#1a0d14',
                        iconColor: '#8b1a4a'
                    });
                    setTimeout(() => window.location.href = 'login.html', 1500);
                },
                error: function (err) {
                    Swal.fire({
                        toast: true,
                        position: 'bottom-right',
                        icon: 'error',
                        text: err.responseJSON?.message || 'Registration failed.',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true,
                        background: '#faf7f4',
                        color: '#1a0d14',
                        iconColor: '#8b1a4a'
                    });
                }
            });
        }
    });

    // ─── Toggle Password Visibility ───────────────────────────
    function makeEyeToggle(btnId, inputId, iconId) {
        $('#' + btnId).on('click', function () {
            const pw = $('#' + inputId);
            const isHidden = pw.attr('type') === 'password';
            pw.attr('type', isHidden ? 'text' : 'password');

            const icon = $('#' + iconId);
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
    }

    makeEyeToggle('btn-toggle-pw',  'password',         'eye-icon');
    makeEyeToggle('btn-toggle-cpw', 'confirm_password', 'eye-icon-confirm');

});