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

    // jQuery Validate
    $('#supplierForm').validate({
        rules: {
            supplier_name: {
                required: true,
                minlength: 2
            },
            contact_person: {
                required: true,
                minlength: 2
            },
            contact_number: {
                required: true,
                digits: true,
                minlength: 7,
                maxlength: 15
            },
            address: {
                required: true,
                minlength: 5
            }
        },
        messages: {
            supplier_name: {
                required: 'Supplier name is required!',
                minlength: 'At least 2 characters!'
            },
            contact_person: {
                required: 'Contact person is required!',
                minlength: 'At least 2 characters!'
            },
            contact_number: {
                required: 'Contact number is required!',
                digits: 'Numbers only!',
                minlength: 'At least 7 digits!',
                maxlength: 'At most 15 digits!'
            },
            address: {
                required: 'Address is required!',
                minlength: 'At least 5 characters!'
            }
        },
        errorElement: 'label',
        errorClass: 'error',
        errorPlacement: function (error, element) {
            error.insertAfter(element);
        }
    });

    function loadSuppliers() {
        $.ajax({
            method: "GET",
            url: `${url}api/v1/suppliers`,
            success: function (data) {
                const rows = [];

                $.each(data.suppliers, function (i, s) {
                    rows.push([
                        i + 1,
                        s.supplier_name,
                        s.contact_person ?? '—',
                        s.contact_number ?? '—',
                        s.address ?? '—',
                        `<button class="btn btn-sm btn-warning btn-edit"
                            data-id="${s.supplier_id}"
                            data-name="${s.supplier_name}"
                            data-person="${s.contact_person ?? ''}"
                            data-number="${s.contact_number ?? ''}"
                            data-address="${s.address ?? ''}">Edit</button>
                         <button class="btn btn-sm btn-danger btn-delete"
                            data-id="${s.supplier_id}">Delete</button>`
                    ]);
                });

                if (table) {
                    table.clear();
                    table.rows.add(rows);
                    table.draw();
                } else {
                    table = $('#suppliers-table').DataTable({
                        data: rows,
                        columns: [
                            { title: "#" },
                            { title: "Supplier Name" },
                            { title: "Contact Person" },
                            { title: "Contact Number" },
                            { title: "Address" },
                            { title: "Actions" }
                        ]
                    });
                }
            }
        });
    }

    loadSuppliers();

    // Reset modal for Add
    $('#btn-add').on('click', function () {
        $('#modal-title').text('Add Supplier');
        $('#supplier_id').val('');
        $('#supplierForm')[0].reset();
        $('#supplierForm').validate().resetForm();
        $('.error').removeClass('error');
    });

    // Edit button
    $(document).on('click', '.btn-edit', function () {
        $('#modal-title').text('Edit Supplier');
        $('#supplier_id').val($(this).data('id'));
        $('#supplier_name').val($(this).data('name'));
        $('#contact_person').val($(this).data('person'));
        $('#contact_number').val($(this).data('number'));
        $('#address').val($(this).data('address'));
        $('#supplierForm').validate().resetForm();
        $('.error').removeClass('error');
        $('#supplierModal').modal('show');
    });

    // Save (Add or Update)
    $('#btn-save').on('click', function () {
        if (!$('#supplierForm').valid()) return;

        const id = $('#supplier_id').val();
        const supplier_name = $('#supplier_name').val().trim();
        const contact_person = $('#contact_person').val().trim();
        const contact_number = $('#contact_number').val().trim();
        const address = $('#address').val().trim();

        const method = id ? 'PUT' : 'POST';
        const endpoint = id
            ? `${url}api/v1/suppliers/${id}`
            : `${url}api/v1/suppliers`;

        $.ajax({
            method: method,
            url: endpoint,
            contentType: 'application/json',
            data: JSON.stringify({ supplier_name, contact_person, contact_number, address }),
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                $('#supplierModal').modal('hide');
                Swal.fire({
                    icon: 'success',
                    text: id ? 'Supplier updated!' : 'Supplier created!',
                    position: 'bottom-right',
                    showConfirmButton: false,
                    timer: 1500
                });
                loadSuppliers();
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
            text: 'This supplier will be deactivated.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8b1a4a',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `${url}api/v1/suppliers/${id}`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    success: function () {
                        Swal.fire({
                            icon: 'success',
                            text: 'Supplier deleted!',
                            position: 'bottom-right',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        loadSuppliers();
                    }
                });
            }
        });
    });
});