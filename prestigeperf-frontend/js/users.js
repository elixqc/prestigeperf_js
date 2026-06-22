$(document).ready(function () {
    const url = 'http://localhost:3000/';
    const token = JSON.parse(sessionStorage.getItem('token'));
    const role = sessionStorage.getItem('role');

    if (!token) {
        Swal.fire({
            icon: 'error',
            text: 'Please login first.',
            position: 'bottom-right',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    } else if (role !== 'admin') {
        $('body').show();
        Swal.fire({
            icon: 'error',
            text: 'Access denied. Redirecting...',
            position: 'bottom-right',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            window.location.href = 'home.html';
        });
        return;
    }

    // Only reaches here if admin
    $('body').show();

    let table;


    // Load sidebar
    $.get("sidebar.html?v=" + new Date().getTime(), function (data) {
        $("#sidebar").html(data);

        const page = window.location.pathname.split('/').pop().replace('.html', '');
        $(`.pp-sidebar-link[data-page="${page}"]`).addClass('active');

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

    function loadUsers() {
        $.ajax({
            method: "GET",
            url: `${url}api/v1/users`,
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (data) {
                const rows = [];

                $.each(data.users, function (i, u) {
                    const statusBadge = u.is_active
                        ? `<span class="badge badge-success">Active</span>`
                        : `<span class="badge badge-secondary">Inactive</span>`;

                    const roleBadge = u.role === 'admin'
                        ? `<span class="badge badge-danger">Admin</span>`
                        : `<span class="badge badge-info">Customer</span>`;

                    const actions = `
                        <button class="btn btn-sm btn-warning btn-edit-role"
                            data-id="${u.user_id}"
                            data-username="${u.username}"
                            data-email="${u.email}"
                            data-role="${u.role}">Edit Role</button>
                        ${u.is_active
                            ? `<button class="btn btn-sm btn-danger btn-deactivate" data-id="${u.user_id}">Deactivate</button>`
                            : `<button class="btn btn-sm btn-success btn-activate" data-id="${u.user_id}">Activate</button>`}
                    `;

                    rows.push([
                        i + 1,
                        u.username,
                        u.email,
                        roleBadge,
                        statusBadge,
                        actions
                    ]);
                });

                if (table) {
                    table.clear();
                    table.rows.add(rows);
                    table.draw();
                } else {
                    table = $('#users-table').DataTable({
                        data: rows,
                        columns: [
                            { title: "#" },
                            { title: "Username" },
                            { title: "Email" },
                            { title: "Role" },
                            { title: "Status" },
                            { title: "Actions" }
                        ]
                    });
                }
            }
        });
    }

    loadUsers();

    // Open Edit Role modal
    $(document).on('click', '.btn-edit-role', function () {
        $('#user_id').val($(this).data('id'));
        $('#user_username').val($(this).data('username'));
        $('#user_email').val($(this).data('email'));
        $('#role').val($(this).data('role'));
        $('#roleModal').modal('show');
    });

    // Save role
    $('#btn-save-role').on('click', function () {
        const id = $('#user_id').val();
        const newRole = $('#role').val();

        $.ajax({
            method: 'PUT',
            url: `${url}api/v1/users/${id}/role`,
            data: { role: newRole },
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                $('#roleModal').modal('hide');
                Swal.fire({
                    icon: 'success',
                    text: 'Role updated!',
                    position: 'bottom-right',
                    showConfirmButton: false,
                    timer: 1500
                });
                loadUsers();
            },
            error: function (err) {
                Swal.fire({
                    icon: 'error',
                    text: err.responseJSON?.message || 'Something went wrong',
                    position: 'bottom-right',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    });

    // Reactivate user
    $(document).on('click', '.btn-activate', function () {
        const id = $(this).data('id');

        Swal.fire({
            title: 'Reactivate this user?',
            text: 'They will be able to log in again.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#8b1a4a',
            confirmButtonText: 'Yes, reactivate'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'PUT',
                    url: `${url}api/v1/users/${id}/restore`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    success: function () {
                        Swal.fire({
                            icon: 'success',
                            text: 'User reactivated!',
                            position: 'bottom-right',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        loadUsers();
                    }
                });
            }
        });
    });

    // Deactivate user
    $(document).on('click', '.btn-deactivate', function () {
        const id = $(this).data('id');

        Swal.fire({
            title: 'Deactivate this user?',
            text: 'They will no longer be able to log in.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8b1a4a',
            confirmButtonText: 'Yes, deactivate'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `${url}api/v1/users/${id}/deactivate`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    success: function () {
                        Swal.fire({
                            icon: 'success',
                            text: 'User deactivated!',
                            position: 'bottom-right',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        loadUsers();
                    }
                });
            }
        });
    });
});