$(document).ready(function () {
    const url = 'http://localhost:3000/';
    const token = JSON.parse(sessionStorage.getItem('token'));

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

        updateCartCount();
    });

    $.get("footer.html", function (data) {
        $("#footer").html(data);
    });

    // Get product ID from URL
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = 'home.html';
        return;
    }

    // Cart count
    function updateCartCount() {
        if (token) {
            $.ajax({
                method: 'GET',
                url: `${url}api/v1/cart`,
                headers: { Authorization: `Bearer ${token}` },
                success: function (data) {
                    if (data.cart.length > 0) $('#cart-count').text(data.cart.length).show();
                }
            });
        } else {
            const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
            if (cart.length > 0) $('#cart-count').text(cart.length).show();
        }
    }

    // Fetch product
    $.ajax({
        method: 'GET',
        url: `${url}api/v1/products/${productId}`,
        success: function (data) {
            const p = data.product;
            const images = p.ProductImages || [];

            const mainImgSrc = images.length > 0
                ? `${url}images/${images[0].image_path}`
                : 'https://via.placeholder.com/500x450?text=No+Image';

            // Thumbnails
            let thumbnailsHtml = '';
            if (images.length > 1) {
                images.forEach((img, i) => {
                    thumbnailsHtml += `
                        <img src="${url}images/${img.image_path}"
                            class="thumbnail-img ${i === 0 ? 'active' : ''} mr-2 mb-2"
                            data-src="${url}images/${img.image_path}">
                    `;
                });
            }

            const html = `
                <div class="col-md-6">
                    <div class="pp-main-img-wrap">
                        <img id="main-img" src="${mainImgSrc}" alt="${p.product_name}">
                    </div>
                    <div class="pp-thumbnails">
                        ${thumbnailsHtml}
                    </div>
                </div>

                <div class="col-md-6 pp-product-info">
                    <p class="pp-product-category">${p.Category?.category_name ?? ''}</p>
                    <h1 class="pp-product-name">${p.product_name}</h1>
                    <p class="pp-product-variant">${p.variant ?? ''}</p>

                    <hr class="pp-product-divider">

                    <p class="pp-product-price">₱${parseFloat(p.selling_price).toFixed(2)}</p>
                    <p class="pp-product-stock">
                        ${p.stock_quantity > 0
                            ? `<span class="pp-stock-in">✓ In Stock</span> &nbsp;—&nbsp; ${p.stock_quantity} available`
                            : `<span class="pp-stock-out">✗ Out of Stock</span>`}
                    </p>

                    ${p.description ? `
                    <p class="pp-desc-label">About this fragrance</p>
                    <p class="pp-desc-text">${p.description}</p>` : ''}

                    ${p.Supplier ? `<p class="pp-supplier">Supplier: ${p.Supplier.supplier_name}</p>` : ''}

                    <hr class="pp-product-divider">

                    <div class="pp-qty-wrap">
                        <button class="qty-btn" id="qty-minus">−</button>
                        <input type="number" id="qty-input" class="qty-input" value="1" min="1" max="${p.stock_quantity}" readonly>
                        <button class="qty-btn" id="qty-plus">+</button>
                    </div>

                    <button id="btn-add-to-cart"
                        class="pp-btn-addcart"
                        ${p.stock_quantity <= 0 ? 'disabled' : ''}
                        data-id="${p.product_id}"
                        data-name="${p.product_name}"
                        data-price="${p.selling_price}"
                        data-stock="${p.stock_quantity}">
                        ${p.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>`;

            $('#product-detail').html(html);

            // ─── Recommended Products ─────────────────────────────────
            $.ajax({
                method: 'GET',
                url: `${url}api/v1/products?limit=9999&offset=0`,
                success: function (data) {
                    const others = data.products.filter(r => r.product_id != productId);
                    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 4);

                    if (shuffled.length === 0) return;

                    let recHtml = '';
                    shuffled.forEach(function (r) {
                        const imgSrc = (r.ProductImages && r.ProductImages.length > 0)
                            ? `${url}images/${r.ProductImages[0].image_path}`
                            : 'https://via.placeholder.com/300x400?text=No+Image';

                        recHtml += `
                        <div class="col-md-3 col-6 mb-4">
                            <div class="pp-product-card d-flex flex-column">
                                <div class="pp-card-img-wrap"
                                    onclick="window.location.href='product.html?id=${r.product_id}'"
                                    style="cursor:pointer;">
                                    <img src="${imgSrc}" alt="${r.product_name}">
                                </div>
                                <div class="card-body d-flex flex-column px-0">
                                    <h5 class="card-title">${r.product_name}</h5>
                                    <p class="pp-variant">${r.variant ?? ''}</p>
                                    <p class="pp-price">₱${parseFloat(r.selling_price).toFixed(2)}</p>
                                    <div class="mt-auto d-flex" style="gap:8px;">
                                        <a href="product.html?id=${r.product_id}" class="pp-btn-view">· View ·</a>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    });

                    $('#recommended-items').html(recHtml);
                }
            });

            // Thumbnail click — change main image
            $(document).on('click', '.thumbnail-img', function () {
                const src = $(this).data('src');
                $('#main-img').attr('src', src);
                $('.thumbnail-img').removeClass('active');
                $(this).addClass('active');
            });

            // Quantity buttons
            $(document).on('click', '#qty-minus', function () {
                let qty = parseInt($('#qty-input').val());
                if (qty > 1) $('#qty-input').val(qty - 1);
            });

            $(document).on('click', '#qty-plus', function () {
                let qty = parseInt($('#qty-input').val());
                if (qty < p.stock_quantity) $('#qty-input').val(qty + 1);
            });

            // Add to cart
            $(document).on('click', '#btn-add-to-cart', function () {
                const qty = parseInt($('#qty-input').val());
                const imgSrc = $('#main-img').attr('src');

                if (token) {
                    $.ajax({
                        method: 'POST',
                        url: `${url}api/v1/cart`,
                        contentType: 'application/json',
                        data: JSON.stringify({ product_id: p.product_id, quantity: qty }),
                        headers: { Authorization: `Bearer ${token}` },
                        success: function () {
                            Swal.fire({
                                icon: 'success',
                                text: `${p.product_name} added to cart!`,
                                position: 'bottom-right',
                                showConfirmButton: false,
                                timer: 1000
                            });
                            updateCartCount();
                        },
                        error: function (err) {
                            Swal.fire({
                                icon: 'error',
                                text: err.responseJSON?.message || 'Failed to add',
                                position: 'bottom-right',
                                showConfirmButton: false,
                                timer: 1500
                            });
                        }
                    });
                } else {
                    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
                    let existing = cart.find(item => item.product_id == p.product_id);
                    if (existing) {
                        existing.quantity += qty;
                    } else {
                        cart.push({
                            product_id: p.product_id,
                            product_name: p.product_name,
                            price: p.selling_price,
                            img: imgSrc,
                            stock: p.stock_quantity,
                            quantity: qty
                        });
                    }
                    sessionStorage.setItem('cart', JSON.stringify(cart));
                    $('#cart-count').text(cart.length).show();
                    Swal.fire({
                        icon: 'success',
                        text: `${p.product_name} added to cart!`,
                        position: 'bottom-right',
                        showConfirmButton: false,
                        timer: 1000
                    });
                }
            });
        },
        error: function () {
            $('#product-detail').html('<p class="text-danger text-center">Product not found.</p>');
        }
    });
});