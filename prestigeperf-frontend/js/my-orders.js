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
            let total = 0;
            let itemsHtml = '';

            $.each(order.OrderDetails, function (j, detail) {
                const subtotal = detail.quantity * parseFloat(detail.price);
                total += subtotal;
                itemsHtml += `
                    <div class="d-flex justify-content-between align-items-center py-2" style="border-bottom:1px solid rgba(0,0,0,0.04);">
                        <div>
                            <p class="pp-order-item-name mb-0">${detail.Product?.product_name ?? 'N/A'}</p>
                            <p class="pp-order-item-qty mb-0">Qty: ${detail.quantity}</p>
                        </div>
                        <span class="pp-order-item-price">₱${subtotal.toFixed(2)}</span>
                    </div>
                `;
            });

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

                <div class="d-flex justify-content-between align-items-center">
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
            </div>`;

            $('#orders-container').append(card);
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