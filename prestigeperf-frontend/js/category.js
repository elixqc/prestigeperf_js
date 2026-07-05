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

    $('body').show();

    let table;
    let showingInactive = false;

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

    // jQuery Validate
    $('#categoryForm').validate({
        rules: {
            category_name: {
                required: true,
                minlength: 2
            }
        },
        messages: {
            category_name: {
                required: 'Category name is required!',
                minlength: 'At least 2 characters!'
            }
        },
        errorElement: 'label',
        errorClass: 'error',
        errorPlacement: function (error, element) {
            error.insertAfter(element);
        }
    });

    function loadCategories() {
        const endpoint = showingInactive
            ? `${url}api/v1/categories?show_disabled=true`
            : `${url}api/v1/categories`;

        $.ajax({
            method: "GET",
            url: endpoint,
            success: function (data) {
                const rows = [];

                // when showing inactive, only display the disabled ones
                // (mirrors item.js's /inactive/list behavior)
                const categories = showingInactive
                    ? data.categories.filter(c => c.deleted_at)
                    : data.categories;

                $.each(categories, function (i, c) {
                    const actions = showingInactive
                        ? `<div class="pp-row-actions">
                               <button class="pp-btn-icon btn-restore" title="Restore"
                                  data-id="${c.category_id}"><i class="fas fa-undo"></i></button>
                           </div>`
                        : `<div class="pp-row-actions">
                               <button class="pp-btn-icon edit btn-edit" title="Edit"
                                  data-id="${c.category_id}"
                                  data-name="${c.category_name}"><i class="fas fa-pen"></i></button>
                               <button class="pp-btn-icon delete btn-delete" title="Delete"
                                  data-id="${c.category_id}"><i class="fas fa-trash"></i></button>
                           </div>`;

                    rows.push([
                        i + 1,
                        `<div class="pp-row-title">${c.category_name}</div>`,
                        actions
                    ]);
                });

                if (table) {
                    table.clear();
                    table.rows.add(rows);
                    table.draw();
                } else {
                    table = $('#categories-table').DataTable({
                        data: rows,
                        columns: [
                            { title: "#" },
                            { title: "Category Name" },
                            { title: "Actions", orderable: false }
                        ]
                    });
                }
            }
        });
    }

    // Toggle active/inactive — same pattern as item.js
    $('#btn-toggle-view').on('click', function () {
        showingInactive = !showingInactive;
        $(this).text(showingInactive ? 'Show Active' : 'Show Inactive');
        $('#btn-add').toggle(!showingInactive);
        loadCategories();
    });

    loadCategories();

    // Reset modal for Add
    $('#btn-add').on('click', function () {
        $('#modal-title').text('Add Category');
        $('#category_id').val('');
        $('#category_name').val('');
        $('#categoryForm').validate().resetForm();
        $('.error').removeClass('error');
    });

    // Edit button
    $(document).on('click', '.btn-edit', function () {
        $('#modal-title').text('Edit Category');
        $('#category_id').val($(this).data('id'));
        $('#category_name').val($(this).data('name'));
        $('#categoryForm').validate().resetForm();
        $('.error').removeClass('error');
        $('#categoryModal').modal('show');
    });

    // Save (Add or Update)
    $('#btn-save').on('click', function () {
        if (!$('#categoryForm').valid()) return;

        const id = $('#category_id').val();
        const category_name = $('#category_name').val().trim();

        const method = id ? 'PUT' : 'POST';
        const endpoint = id
            ? `${url}api/v1/categories/${id}`
            : `${url}api/v1/categories`;

        $.ajax({
            method: method,
            url: endpoint,
            contentType: 'application/json',
            data: JSON.stringify({ category_name }),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                $('#categoryModal').modal('hide');
                Swal.fire({
                    icon: 'success',
                    text: id ? 'Category updated!' : 'Category created!',
                    position: 'bottom-right',
                    showConfirmButton: false,
                    timer: 1500
                });
                loadCategories();
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

    // Delete (soft delete)
    $(document).on('click', '.btn-delete', function () {
        const id = $(this).data('id');

        Swal.fire({
            title: 'Are you sure?',
            text: 'This category will be deleted.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8b1a4a',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `${url}api/v1/categories/${id}`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    success: function () {
                        Swal.fire({
                            icon: 'success',
                            text: 'Category deleted!',
                            position: 'bottom-right',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        loadCategories();
                    }
                });
            }
        });
    });

    // Restore
    $(document).on('click', '.btn-restore', function () {
        const id = $(this).data('id');

        Swal.fire({
            title: 'Restore this category?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#8b1a4a',
            confirmButtonText: 'Yes, restore it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'PUT',
                    url: `${url}api/v1/categories/${id}/restore`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    success: function () {
                        Swal.fire({
                            icon: 'success',
                            text: 'Category restored!',
                            position: 'bottom-right',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        loadCategories();
                    },
                    error: function (err) {
                        Swal.fire({
                            icon: 'error',
                            text: err.responseJSON?.message || 'Restore failed',
                            position: 'bottom-right',
                            showConfirmButton: false,
                            timer: 1500
                        });
                    }
                });
            }
        });
    });
});