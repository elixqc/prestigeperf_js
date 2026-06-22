$(document).ready(function () {
    const url = 'http://localhost:3000/';
    const token = JSON.parse(sessionStorage.getItem('token'));

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Load header
    $.get("header.html?v=" + new Date().getTime(), function (data) {
        $("#header").html(data);
        $('#nav-login').hide();
        $('#nav-logout').show();
        $('#nav-profile').show();
        $('#nav-my-orders').show();
        const role = sessionStorage.getItem('role');
        if (role === 'admin') $('#nav-dashboard').show();

        $(document).on('click', '#btn-logout', function (e) {
            e.preventDefault();
            $.ajax({
                method: 'POST',
                url: `${url}api/v1/logout`,
                headers: { Authorization: `Bearer ${token}` },
                success: function () {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                },
                error: function () {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        });
    });

    $.get("footer.html", function (data) {
        $("#footer").html(data);
    });

    // Custom validation — current password required if new password is filled
    $.validator.addMethod('requireCurrentPassword', function (value, element) {
        const newPass = $('#new_password').val();
        if (newPass.length > 0 && value.length === 0) return false;
        return true;
    }, 'Current password is required when changing password!');

    $.validator.addMethod('requireNewPassword', function (value, element) {
        const currentPass = $('#current_password').val();
        if (currentPass.length > 0 && value.length === 0) return false;
        return true;
    }, 'New password is required!');
    
    $.validator.addMethod('passwordMatch', function (value, element) {
        return value === $('#new_password').val();
    }, 'Passwords do not match!');

    $.validator.addMethod('confirmRequired', function (value, element) {
        const newPass = $('#new_password').val();
        if (newPass.length > 0 && value.length === 0) return false;
        return true;
    }, 'Please confirm your new password!');

    // jQuery Validate
    $('#profileForm').validate({
        rules: {
            full_name: {
                required: true,
                minlength: 2
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
            current_password: {
                requireCurrentPassword: true
            },
            new_password: {
                minlength: 6,
                requireNewPassword: true
            },
            confirm_password: {
                passwordMatch: true,
                confirmRequired: true
            }
        },
        messages: {
            full_name: {
                required: 'Full name is required!',
                minlength: 'At least 2 characters!'
            },
            contact_number: {
                required: 'Contact number is required!',
                digits: 'Must be numbers only!',
                minlength: 'At least 10 digits!',
                maxlength: 'Maximum 13 digits!'
            },
            address: {
                required: 'Address is required!',
                minlength: 'At least 5 characters!'
            },
            current_password: {
                requireCurrentPassword: 'Current password is required when changing password!'
            },
            new_password: {
                minlength: 'Password must be at least 6 characters!',
                requireNewPassword: 'New password is required!'
            },
            confirm_password: {
                passwordMatch: 'Passwords do not match!',
                confirmRequired: 'Please confirm your new password!'
            }

        },
        errorElement: 'label',
        errorClass: 'error',
        errorPlacement: function (error, element) {
            error.insertAfter(element);
        }
    });

    // Load profile
    $.ajax({
        method: 'GET',
        url: `${url}api/v1/profile`,
        headers: { Authorization: `Bearer ${token}` },
        success: function (data) {
            const user = data.user;
            $('#username').val(user.username);
            $('#email').val(user.email);
            $('#full_name').val(user.full_name ?? '');
            $('#contact_number').val(user.contact_number ?? '');
            $('#address').val(user.address ?? '');
            $('#profile-username').text(user.username);
            $('#profile-role').text(user.role);

            if (user.profile_picture) {
                $('#profile-img').attr('src', `${url}images/${user.profile_picture}`);
            }
        },
        error: function () {
            Swal.fire({ icon: 'error', text: 'Failed to load profile!', position: 'bottom-right', showConfirmButton: false, timer: 1500 });
        }
    });

    // Image preview
    $('#profile_picture').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#picture-preview').attr('src', e.target.result).show();
                $('#profile-img').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // Update profile
    $('#btn-update').on('click', function () {
        if (!$('#profileForm').valid()) return;

        const formData = new FormData();
        formData.append('full_name', $('#full_name').val());
        formData.append('contact_number', $('#contact_number').val());
        formData.append('address', $('#address').val());

        if ($('#profile_picture')[0].files[0]) {
            formData.append('profile_picture', $('#profile_picture')[0].files[0]);
        }

        if ($('#current_password').val()) {
            formData.append('current_password', $('#current_password').val());
            formData.append('new_password', $('#new_password').val());
        }

        $.ajax({
            method: 'POST',
            url: `${url}api/v1/profile/update`,
            data: formData,
            processData: false,
            contentType: false,
            headers: { Authorization: `Bearer ${token}` },
            success: function () {
                Swal.fire({
                    toast: true,
                    position: 'bottom-right',
                    icon: 'success',
                    text: 'Profile updated successfully!',
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                    background: '#faf7f4',
                    color: '#1a0d14',
                    iconColor: '#8b1a4a',
                });
                $('#current_password').val('');
                $('#new_password').val('');
                $('#picture-preview').hide();
                $('#profileForm').validate().resetForm();
                $('.error').removeClass('error');
            },
            error: function (err) {
                Swal.fire({
                    icon: 'error',
                    text: err.responseJSON?.message || 'Update failed!',
                    position: 'bottom-right',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    });
});