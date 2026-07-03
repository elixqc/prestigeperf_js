$(document).ready(function () {
    const url = 'http://localhost:3000/';
    const token = JSON.parse(sessionStorage.getItem('token'));

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    let allOrders = [];

    // Load header
    $.get("header.html?v=" + new Date().getTime(), function (data) {
        $("#header").html(data);
        if (sessionStorage.getItem('token')) {
            $('#nav-login').hide();
            $('#nav-logout').show();
            $('#nav-profile').show();
            $('#nav-my-orders').show();
            const role = sessionStorage.getItem('role');
            if (role === 'admin') $('#nav-dashboard').show();
        } else {
            $('#nav-login').show();
            $('#nav-logout').hide();
            $('#nav-profile').hide();
            $('#nav-my-orders').hide();
        }

        $(document).on('click', '#btn-logout', function (e) {
            e.preventDefault();
            $.ajax({
                method: 'POST',
                url: `${url}api/v1/logout`,
                headers: { Authorization: `Bearer ${token}` },
                success: function () { sessionStorage.clear(); window.location.href = 'login.html'; },
                error: function () { sessionStorage.clear(); window.location.href = 'login.html'; }
            });
        });
    });

    $.get("footer.html", function (data) {
        $("#footer").html(data);
    });

    // Status style map
    const statusClass = {
        'Pending':         'pp-status-pending',
        'Processing':      'pp-status-processing',
        'Out for Delivery':'pp-status-delivery',
        'Completed':       'pp-status-completed',
        'Cancelled':       'pp-status-cancelled'
    };

    // Shared item-list + total builder (used by card render AND modal)
    function buildOrderItemsHtml(order) {
        let total = 0;
        let itemsHtml = '';

        $.each(order.OrderDetails, function (j, detail) {
            const subtotal = detail.quantity * parseFloat(detail.price);
            total += subtotal;

            // NEW: pull first product image, fall back to placeholder
            const images = detail.Product?.ProductImages;
            const imgPath = images && images.length > 0 ? images[0].image_path : null;
            const imgSrc = imgPath ? `${url}images/${imgPath}` : 'images/placeholder.png';

            itemsHtml += `
                <div class="d-flex align-items-center py-2" style="border-bottom:1px solid rgba(0,0,0,0.04); gap:12px;">
                    <img src="${imgSrc}" alt="${detail.Product?.product_name ?? 'Product'}" class="pp-order-item-img">
                    <div class="flex-grow-1">
                        <p class="pp-order-item-name mb-0">${detail.Product?.product_name ?? 'N/A'}</p>
                        <p class="pp-order-item-qty mb-0">Qty: ${detail.quantity}</p>
                    </div>
                    <span class="pp-order-item-price">₱${subtotal.toFixed(2)}</span>
                </div>
            `;
        });

        return { itemsHtml, total };
    }

    // NEW: shared delivery/contact block builder
    function buildDeliveryHtml(order) {
        const user = order.User || {};
        return `
            <div class="pp-order-delivery">
                <p class="pp-order-delivery-label mb-1">Deliver To</p>
                <p class="pp-order-delivery-text mb-0">${user.address ?? 'No address on file'}</p>
                <p class="pp-order-delivery-text mb-0">${user.contact_number ?? 'No contact number on file'}</p>
            </div>
        `;
    }

    // Render orders
    function renderOrders(orders) {
        $('#orders-container').empty();

        if (orders.length === 0) {
            $('#orders-container').html(`
                <div class="pp-empty-orders">
                    <div class="pp-gold-rule mb-4" style="max-width:80px; margin:0 auto 24px;"></div>
                    <p>No orders found.</p>
                </div>
            `);
            return;
        }

        $.each(orders, function (i, order) {
            const { itemsHtml, total } = buildOrderItemsHtml(order);
            const deliveryHtml = buildDeliveryHtml(order); // NEW
            const sClass = statusClass[order.order_status] || 'pp-status-pending';

            const card = `
            <div class="pp-order-card" data-status="${order.order_status}">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <p class="pp-order-id mb-1">Order #${order.order_id}</p>
                        <p class="pp-order-date mb-0">${new Date(order.order_date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</p>
                    </div>
                    <span class="pp-order-status ${sClass}">${order.order_status}</span>
                </div>

                <div class="mb-3">${itemsHtml}</div>

                ${deliveryHtml}

                <div class="d-flex justify-content-between align-items-center mt-3">
                    <div>
                        <p class="pp-order-payment mb-0">
                            ${order.payment_method}
                            ${order.payment_reference ? `· Ref: ${order.payment_reference}` : ''}
                        </p>
                    </div>
                    <div class="text-right">
                        <p style="font-size:9px; letter-spacing:0.2em; text-transform:uppercase; color:var(--text-muted); margin-bottom:2px;">Total</p>
                        <p class="pp-order-total mb-0">₱${total.toFixed(2)}</p>
                    </div>
                </div>

                <div class="d-flex justify-content-end align-items-center pp-order-actions mt-3">
                    ${order.order_status === 'Pending' ? `<button type="button" class="pp-btn-cancel-order" data-order-id="${order.order_id}">Cancel Order</button>` : ''}
                    <button type="button" class="pp-btn-view-order" data-order-id="${order.order_id}">View Details</button>
                </div>
            </div>`;

            $('#orders-container').append(card);
        });
    }

    // Populate + open the order detail modal
    function openOrderModal(orderId) {
        const order = allOrders.find(o => o.order_id === orderId);
        if (!order) return;

        const { itemsHtml, total } = buildOrderItemsHtml(order);
        const deliveryHtml = buildDeliveryHtml(order); // NEW
        const sClass = statusClass[order.order_status] || 'pp-status-pending';

        $('#modalOrderId').text(`Order #${order.order_id}`);
        $('#modalOrderDate').text(new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        $('#modalOrderStatus').attr('class', `pp-order-status ${sClass}`).text(order.order_status);
        $('#modalOrderItems').html(itemsHtml);
        $('#modalOrderDelivery').html(deliveryHtml); // NEW
        $('#modalOrderPayment').text(`${order.payment_method}${order.payment_reference ? ' · Ref: ' + order.payment_reference : ''}`);
        $('#modalOrderTotal').text(`₱${total.toFixed(2)}`);

        if (order.order_status === 'Pending') {
            $('#modalCancelBtn').data('order-id', order.order_id).show();
        } else {
            $('#modalCancelBtn').hide();
        }

        $('#orderDetailModal').modal('show');
    }

    // Confirm + cancel
    function confirmCancelOrder(orderId) {
        Swal.fire({
            title: 'Cancel this order?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel it',
            cancelButtonText: 'Keep order',
            confirmButtonColor: '#8b1a4a',
            cancelButtonColor: '#c9a96e',
            background: '#faf7f4',
            color: '#1a0d14'
        }).then((result) => {
            if (result.isConfirmed) {
                cancelOrder(orderId);
            }
        });
    }

    function cancelOrder(orderId) {
        $.ajax({
            method: 'PUT',
            url: `${url}api/v1/orders/${orderId}/cancel`,
            headers: { Authorization: `Bearer ${token}` },
            success: function () {
                const order = allOrders.find(o => o.order_id === orderId);
                if (order) order.order_status = 'Cancelled';

                $('#orderDetailModal').modal('hide');

                const activeStatus = $('.pp-filter-btn.active').data('status');
                renderOrders(activeStatus === 'all' ? allOrders : allOrders.filter(o => o.order_status === activeStatus));

                Swal.fire({
                    toast: true,
                    position: 'bottom-right',
                    icon: 'success',
                    title: 'Order cancelled',
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#faf7f4',
                    color: '#1a0d14',
                    iconColor: '#8b1a4a'
                });
            },
            error: function (xhr) {
                const msg = xhr.responseJSON?.message || 'Failed to cancel order';
                Swal.fire({
                    toast: true,
                    position: 'bottom-right',
                    icon: 'error',
                    title: msg,
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#faf7f4',
                    color: '#1a0d14',
                    iconColor: '#8b1a4a'
                });
            }
        });
    }

    // Filter
    $(document).on('click', '.pp-filter-btn', function () {
        $('.pp-filter-btn').removeClass('active');
        $(this).addClass('active');
        const status = $(this).data('status');

        if (status === 'all') {
            renderOrders(allOrders);
        } else {
            renderOrders(allOrders.filter(o => o.order_status === status));
        }
    });

    // View / cancel bindings
    $(document).on('click', '.pp-btn-view-order', function () {
        openOrderModal($(this).data('order-id'));
    });

    $(document).on('click', '.pp-btn-cancel-order', function (e) {
        e.stopPropagation();
        confirmCancelOrder($(this).data('order-id'));
    });

    $(document).on('click', '#modalCancelBtn', function () {
        confirmCancelOrder($(this).data('order-id'));
    });

    // Fetch orders
    $.ajax({
        method: 'GET',
        url: `${url}api/v1/my-orders`,
        headers: { Authorization: `Bearer ${token}` },
        success: function (data) {
            allOrders = data.orders;
            renderOrders(allOrders);
        },
        error: function () {
            $('#orders-container').html('<p class="text-danger">Failed to load orders.</p>');
        }
    });
});