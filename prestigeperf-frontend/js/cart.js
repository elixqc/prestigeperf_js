$(document).ready(function () {
    const url = 'http://localhost:3000/';
    const token = JSON.parse(sessionStorage.getItem('token'));

    // Load header
    $.get("header.html?v=" + new Date().getTime(), function (data) {
        $("#header").html(data);
        console.log('header loaded, nav-my-orders:', $('#nav-my-orders').length);

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
        
    });

    $.get("footer.html", function (data) {
        $("#footer").html(data);
    });

    $(document).on('click', '#btn-logout', function (e) {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = 'login.html';
    });

    // Show payment reference for non-COD
    $('#payment_method').on('change', function () {
        if ($(this).val() !== 'COD') {
            $('#reference-group').show();
        } else {
            $('#reference-group').hide();
            $('#payment_reference').val('');
        }
    });

    // Load cart
    function loadCart() {
        if (!token) {
            // Guest
            $('#guest-warning').show();
            $('#checkout-section').hide();

            const guestCart = JSON.parse(sessionStorage.getItem('cart')) || [];
            if (guestCart.length === 0) {
                $('#cart-body').html('<tr><td colspan="6" class="text-center">Your cart is empty.</td></tr>');
                return;
            }

            let total = 0;
            $('#cart-body').empty();
            $.each(guestCart, function (i, item) {
                const subtotal = item.price * item.quantity;
                total += subtotal;
                $('#cart-body').append(`
                    <tr>
                        <td><img src="${item.img}" class="pp-cart-img" style="height:50px; width:50px; object-fit:cover; border-radius:4px;"></td>
                        <td><p class="pp-cart-product-name mb-0">${item.product_name}</p></td>
                        <td><span class="pp-cart-price">₱${parseFloat(item.price).toFixed(2)}</span></td>
                        <td>
                            <div class="input-group input-group-sm" style="width:100px;">
                                <div class="input-group-prepend">
                                    <button class="btn btn-outline-secondary btn-minus-guest" data-id="${item.product_id}">-</button>
                                </div>
                                <input type="text" class="form-control text-center" value="${item.quantity}" readonly>
                                <div class="input-group-append">
                                    <button class="btn btn-outline-secondary btn-plus-guest" data-id="${item.product_id}" data-stock="${item.stock}">+</button>
                                </div>
                            </div>
                        </td>
                        <td><span class="pp-cart-subtotal">₱${subtotal.toFixed(2)}</span></td>
                        <td><button class="pp-cart-remove btn-remove-guest" data-id="${item.product_id}">Remove</button></td>
                    </tr>
                `);
            });
            $('#cart-total').text(`₱${total.toFixed(2)}`);

        } else {
            // Logged in — get from DB
            $.ajax({
                method: 'GET',
                url: `${url}api/v1/cart`,
                headers: { Authorization: `Bearer ${token}` },
                success: function (data) {
                    $('#cart-body').empty();

                    if (data.cart.length === 0) {
                        $('#cart-body').html('<tr><td colspan="6" class="text-center">Your cart is empty.</td></tr>');
                        $('#checkout-section').hide();
                        return;
                    }

                    $('#checkout-section').show();
                    let total = 0;

                    $.each(data.cart, function (i, item) {
                        const price = parseFloat(item.Product.selling_price);
                        const subtotal = price * item.quantity;
                        total += subtotal;

                        const imgSrc = (item.Product.ProductImages && item.Product.ProductImages.length > 0)
                            ? `${url}images/${item.Product.ProductImages[0].image_path}`
                            : 'https://via.placeholder.com/50?text=N/A';

                        $('#cart-body').append(`
                            <tr>
                                <td><img src="${imgSrc}" style="height:50px; width:50px; object-fit:cover; border-radius:4px;"></td>
                                <td>${item.Product.product_name}</td>
                                <td>₱${price.toFixed(2)}</td>
                                <td>
                                    <div class="input-group input-group-sm" style="width:100px;">
                                        <div class="input-group-prepend">
                                            <button class="btn btn-outline-secondary btn-minus" data-id="${item.product_id}">-</button>
                                        </div>
                                        <input type="text" class="form-control text-center" value="${item.quantity}" readonly>
                                        <div class="input-group-append">
                                            <button class="btn btn-outline-secondary btn-plus" data-id="${item.product_id}" data-stock="${item.Product.stock_quantity}">+</button>
                                        </div>
                                    </div>
                                </td>
                                <td>₱${subtotal.toFixed(2)}</td>
                                <td><button class="pp-cart-remove btn-remove" data-id="${item.product_id}">Remove</button></td>
                            </tr>
                        `);
                    });

                    $('#cart-total').text(`₱${total.toFixed(2)}`);
                }
            });
        }
    }

    loadCart();

    // Fetch payment methods
    $.ajax({
        method: 'GET',
        url: `${url}api/v1/payment-methods`,
        success: function (data) {
            $('#payment_method').empty();
            $.each(data.methods, function (i, method) {
                $('#payment_method').append(`<option value="${method}">${method}</option>`);
            });
        }
    });

    // Remove item (logged in)
    $(document).on('click', '.btn-remove', function () {
        const product_id = $(this).data('id');
        $.ajax({
            method: 'DELETE',
            url: `${url}api/v1/cart/${product_id}`,
            headers: { Authorization: `Bearer ${token}` },
            success: function () {
                Swal.fire({ icon: 'success', text: 'Item removed!', position: 'bottom-right', showConfirmButton: false, timer: 1000 });
                loadCart();
            }
        });
    });

    // Remove item (guest)
    $(document).on('click', '.btn-remove-guest', function () {
        const id = $(this).data('id');
        let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        cart = cart.filter(item => item.product_id != id);
        sessionStorage.setItem('cart', JSON.stringify(cart));
        Swal.fire({ icon: 'success', text: 'Item removed!', position: 'bottom-right', showConfirmButton: false, timer: 1000 });
        loadCart();
    });

    // Increase quantity (logged in)
    $(document).on('click', '.btn-plus', function () {
        const product_id = $(this).data('id');
        const stock = $(this).data('stock');
        const input = $(this).closest('tr').find('input');
        let qty = parseInt(input.val());

        if (qty >= stock) {
            Swal.fire({ icon: 'warning', text: 'Max stock reached!', position: 'bottom-right', showConfirmButton: false, timer: 1000 });
            return;
        }

        qty += 1;
        $.ajax({
            method: 'PUT',
            url: `${url}api/v1/cart/${product_id}`,
            contentType: 'application/json',
            data: JSON.stringify({ quantity: qty }),
            headers: { Authorization: `Bearer ${token}` },
            success: function () { loadCart(); }
        });
    });

    // Increase quantity (guest)
    $(document).on('click', '.btn-plus-guest', function () {
        const product_id = $(this).data('id');
        const stock = $(this).data('stock');
        let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        let item = cart.find(i => i.product_id == product_id);

        if (!item) return;

        if (item.quantity >= stock) {
            Swal.fire({ icon: 'warning', text: 'Max stock reached!', position: 'bottom-right', showConfirmButton: false, timer: 1000 });
            return;
        }

        item.quantity += 1;
        sessionStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    });

    // Decrease quantity (logged in)
    $(document).on('click', '.btn-minus', function () {
        const product_id = $(this).data('id');
        const input = $(this).closest('tr').find('input');
        let qty = parseInt(input.val());

        if (qty <= 1) {
            Swal.fire({ icon: 'warning', text: 'Minimum quantity is 1!', position: 'bottom-right', showConfirmButton: false, timer: 1000 });
            return;
        }

        qty -= 1;
        $.ajax({
            method: 'PUT',
            url: `${url}api/v1/cart/${product_id}`,
            contentType: 'application/json',
            data: JSON.stringify({ quantity: qty }),
            headers: { Authorization: `Bearer ${token}` },
            success: function () { loadCart(); }
        });
    });

    // Decrease quantity (guest)
    $(document).on('click', '.btn-minus-guest', function () {
        const product_id = $(this).data('id');
        let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
        let item = cart.find(i => i.product_id == product_id);

        if (!item) return;

        if (item.quantity <= 1) {
            Swal.fire({ icon: 'warning', text: 'Minimum quantity is 1!', position: 'bottom-right', showConfirmButton: false, timer: 1000 });
            return;
        }

        item.quantity -= 1;
        sessionStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    });

    // Checkout
    $('#btn-checkout').on('click', function () {
        const payment_method = $('#payment_method').val();
        const payment_reference = $('#payment_reference').val();

        // Get cart items from DB first
        $.ajax({
            method: 'GET',
            url: `${url}api/v1/cart`,
            headers: { Authorization: `Bearer ${token}` },
            success: function (data) {
                if (data.cart.length === 0) {
                    Swal.fire({ icon: 'warning', text: 'Your cart is empty!', position: 'bottom-right', showConfirmButton: false, timer: 1500 });
                    return;
                }

                const items = data.cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                }));

                // Place order
                $.ajax({
                    method: 'POST',
                    url: `${url}api/v1/orders`,
                    contentType: 'application/json',
                    data: JSON.stringify({ items, payment_method, payment_reference }),
                    headers: { Authorization: `Bearer ${token}` },
                    success: function (orderData) {
                        // Clear cart after order
                        $.ajax({
                            method: 'DELETE',
                            url: `${url}api/v1/cart`,
                            headers: { Authorization: `Bearer ${token}` },
                            success: function () {
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Order Placed!',
                                    text: `Order #${orderData.order.order_id} placed successfully!`,
                                    confirmButtonColor: '#8b1a4a'
                                }).then(() => {
                                    window.location.href = 'my-orders.html';
                                });
                            }
                        });
                    },
                    error: function (err) {
                        Swal.fire({ icon: 'error', text: err.responseJSON?.message || 'Checkout failed!', position: 'bottom-right', showConfirmButton: false, timer: 1500 });
                    }
                });
            }
        });
    });
});