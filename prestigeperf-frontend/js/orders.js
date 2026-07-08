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
    let ordersById = {}; // cache so the detail modal doesn't need a second AJAX call

    // Sidebar load — DITO LANG, ONCE, sa taas
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

    // maps order_status -> pp-pill class + label used across table row + detail modal
    function statusPillHtml(status) {
        const cls = {
            'Pending': 'pp-pill-pending',
            'Processing': 'pp-pill-processing',
            'Out for Delivery': 'pp-pill-delivery',
            'Completed': 'pp-pill-completed',
            'Cancelled': 'pp-pill-cancelled'
        }[status] || 'pp-pill-pending';
        return `<span class="pp-pill ${cls}">${status}</span>`;
    }

    // Load orders
    function loadOrders() {
        $.ajax({
            method: 'GET',
            url: `${url}api/v1/orders`,
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                const rows = [];
                ordersById = {};

                $.each(data.orders, function (i, order) {
                    let total = 0;
                    let itemsSummary = '';
                    $.each(order.OrderDetails, function (j, detail) {
                        total += detail.quantity * parseFloat(detail.price);
                        itemsSummary += `${detail.Product?.product_name ?? 'N/A'} <span class="pp-row-subtext">×${detail.quantity}</span><br>`;
                    });

                    order._computedTotal = total;
                    ordersById[order.order_id] = order;

                    rows.push([
                        order.order_id,
                        `<div class="pp-row-title">${order.User?.username ?? 'N/A'}</div>
                        <div class="pp-row-subtext">${order.User?.email ?? ''}</div>`,
                        itemsSummary,
                        `₱${total.toFixed(2)}`,
                        statusPillHtml(order.order_status),
                        new Date(order.order_date ?? order.createdAt).toLocaleDateString(),
                        `<div class="pp-row-actions">
                            <button class="pp-btn-icon btn-view-order" title="View details" data-id="${order.order_id}"><i class="fas fa-eye"></i></button>
                            <button class="pp-btn-icon edit btn-update-status" title="Update status"
                                data-id="${order.order_id}" data-status="${order.order_status}"><i class="fas fa-rotate"></i></button>
                        </div>`
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
                            { title: "Items" },
                            { title: "Total" },
                            { title: "Status" },
                            { title: "Date" },
                            { title: "Actions", orderable: false }
                        ]
                    });
                }
            }
        });
    }

    loadOrders();

    // Fill and open the order detail modal
    function showOrderDetail(id) {
        const order = ordersById[id];
        if (!order) return;

        $('#detail-order-id').text('#' + order.order_id);
        $('#detail-customer-name').text(order.User?.username ?? 'N/A');
        $('#detail-customer-email').text(order.User?.email ?? '—');
        $('#detail-customer-contact').text(order.User?.contact_number ?? '—');
        $('#detail-customer-address').text(order.User?.address ?? '—');
        $('#detail-payment-method').text(order.payment_method ?? '—');
        $('#detail-payment-reference').text(order.payment_reference ?? '—');
        $('#detail-status-pill').html(statusPillHtml(order.order_status));
        $('#detail-order-date').text(new Date(order.order_date ?? order.createdAt).toLocaleString());

        const $body = $('#detail-items-body').empty();
        $.each(order.OrderDetails, function (i, detail) {
            const price = parseFloat(detail.price);
            const subtotal = price * detail.quantity;
            $body.append(`
                <tr>
                    <td class="pp-detail-item-name">${detail.Product?.product_name ?? 'N/A'}</td>
                    <td>${detail.quantity}</td>
                    <td>₱${price.toFixed(2)}</td>
                    <td>₱${subtotal.toFixed(2)}</td>
                </tr>
            `);
        });

        $('#detail-grand-total').text('₱' + order._computedTotal.toFixed(2));
        $('#orderDetailModal').modal('show');
    }

    // Open the status-update modal directly from the detail modal
    $(document).on('click', '#btn-open-update-from-detail', function () {
        const id = $('#detail-order-id').text().replace('#', '');
        const order = ordersById[id];
        if (!order) return;

        $(this).blur(); // release focus before hiding the modal

        $('#orderDetailModal').modal('hide');
        $('#update-order-id').val(id);
        $('#order_status').val(order.order_status);
        $('#statusModal').modal('show');
    });

    // View button opens detail modal
    $(document).on('click', '.btn-view-order', function (e) {
        e.stopPropagation();
        showOrderDetail($(this).data('id'));
    });

    // Clicking anywhere on the row (except actions) also opens detail modal
    $(document).on('click', '#orders-table tbody tr', function (e) {
        if ($(e.target).closest('.pp-row-actions').length) return;
        const rowData = table.row(this).data();
        if (rowData) showOrderDetail(rowData[0]);
    });
    $(document).on('mouseenter', '#orders-table tbody tr', function () {
        $(this).css('cursor', 'pointer');
    });

    // Open update status modal
    $(document).on('click', '.btn-update-status', function (e) {
        e.stopPropagation();
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

        const $btn = $(this);
        const $spinner = $('#update-status-spinner');
        const $btnText = $('#update-status-btn-text');

        // Enter loading state
        $btn.prop('disabled', true).addClass('is-loading');
        $spinner.removeClass('d-none');
        $btnText.text('Updating...');

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
            },
            complete: function () {
                $btn.prop('disabled', false).removeClass('is-loading');
                $spinner.addClass('d-none');
                $btnText.text('Update');
            }
        });
    });

});