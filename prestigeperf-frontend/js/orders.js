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

    // ← Sidebar load — DITO LANG, ONCE, sa taas
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

    // Load order statuses dropdown
    $.ajax({
        method: 'GET',
        url: `${url}api/v1/order-statuses`,
        success: function (data) {
            $('#order_status').empty();
            $.each(data.statuses, function (i, status) {
                $('#order_status').append(`<option value="${status}">${status}</option>`);
            });
        }
    });

    // Load orders
    function loadOrders() {
        $.ajax({
            method: 'GET',
            url: `${url}api/v1/orders`,
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                const rows = [];

                $.each(data.orders, function (i, order) {
                    const statusBadge = {
                        'Pending': 'warning',
                        'Processing': 'info',
                        'Out for Delivery': 'primary',
                        'Completed': 'success',
                        'Cancelled': 'danger'
                    }[order.order_status] || 'secondary';

                    let total = 0;
                    let itemsList = '';
                    $.each(order.OrderDetails, function (j, detail) {
                        total += detail.quantity * parseFloat(detail.price);
                        itemsList += `${detail.Product?.product_name ?? 'N/A'} (x${detail.quantity})<br>`;
                    });

                    rows.push([
                        order.order_id,
                        `${order.User?.username ?? 'N/A'}<br>
                        <small>${order.User?.email ?? ''}</small><br>
                        <small>${order.User?.contact_number ?? '—'}</small>`,
                        `<small>${order.User?.address ?? '—'}</small>`,
                        itemsList,
                        `₱${total.toFixed(2)}`,
                        order.payment_method ?? '—',
                        order.payment_reference ?? '—',
                        `<span class="badge badge-${statusBadge}">${order.order_status}</span>`,
                        new Date(order.order_date ?? order.createdAt).toLocaleDateString(),
                        `<button class="btn btn-sm btn-warning btn-update-status"
                            data-id="${order.order_id}"
                            data-status="${order.order_status}">Update</button>
                        <button class="btn btn-sm btn-danger btn-delete-order"
                            data-id="${order.order_id}">Delete</button>`
                    ]);
                });

                if (table) {
                    table.clear();
                    table.rows.add(rows);
                    table.draw();
                } else {
                    table = $('#orders-table').DataTable({
                        data: rows,
                        columns: [
                            { title: "#" },
                            { title: "Customer" },
                            { title: "Address" },
                            { title: "Items" },
                            { title: "Total" },
                            { title: "Payment" },
                            { title: "Reference" },
                            { title: "Status" },
                            { title: "Date" },
                            { title: "Actions" }
                        ]
                    });
                }
            }
        });
    }

    loadOrders();

    // Open update status modal
    $(document).on('click', '.btn-update-status', function () {
        const id = $(this).data('id');
        const currentStatus = $(this).data('status');
        $('#update-order-id').val(id);
        $('#order_status').val(currentStatus);
        $('#statusModal').modal('show');
    });

    // Update status
    $('#btn-update-status').on('click', function () {
        const id = $('#update-order-id').val();
        const order_status = $('#order_status').val();

        $.ajax({
            method: 'PUT',
            url: `${url}api/v1/orders/${id}/status`,
            contentType: 'application/json',
            data: JSON.stringify({ order_status }),
            headers: { Authorization: `Bearer ${token}` },
            success: function () {
                $('#statusModal').modal('hide');
                Swal.fire({
                    icon: 'success',
                    text: 'Order status updated! Email sent.',
                    position: 'bottom-right',
                    showConfirmButton: false,
                    timer: 1500
                });
                loadOrders();
            },
            error: function (err) {
                Swal.fire({
                    icon: 'error',
                    text: err.responseJSON?.message || 'Update failed',
                    position: 'bottom-right',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    });

    // Delete order
    $(document).on('click', '.btn-delete-order', function () {
        const id = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: 'This order will be permanently deleted.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8b1a4a',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `${url}api/v1/orders/${id}`,
                    headers: { Authorization: `Bearer ${token}` },
                    success: function () {
                        Swal.fire({
                            icon: 'success',
                            text: 'Order deleted!',
                            position: 'bottom-right',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        loadOrders();
                    }
                });
            }
        });
    }); // ← closing ng delete handler

}); // ← closing ng document.ready