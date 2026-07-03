$(document).ready(function () {
    const url = 'http://localhost:3000/';
    const LIMIT = 8;
    let offset = 0;
    let isLoading = false;
    let hasMore = true;
    let searchTimeout = null;
    let currentSearch = '';

    // ─── Filter State ───────────────────────────────────────────────────────
    let activeFilters = {
        minPrice: null,
        maxPrice: null,
        categoryIds: [],
        sort: ''
    };

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
            const token = JSON.parse(sessionStorage.getItem('token'));
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

    // ─── Cart Count ───────────────────────────────────────────────────────────
    function updateCartCount() {
        const token = JSON.parse(sessionStorage.getItem('token'));
        if (token) {
            $.ajax({
                method: 'GET',
                url: `${url}api/v1/cart`,
                headers: { Authorization: `Bearer ${token}` },
                success: function (data) {
                    if (data.cart.length > 0) {
                        $('#cart-count').text(data.cart.length).show();
                    }
                }
            });
        } else {
            const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
            if (cart.length > 0) $('#cart-count').text(cart.length).show();
        }
    }

    // ─── Build Product Card ───────────────────────────────────────────────────
    function buildCard(p) {
        const imgSrc = (p.ProductImages && p.ProductImages.length > 0)
            ? `${url}images/${p.ProductImages[0].image_path}`
            : 'https://via.placeholder.com/300x400?text=No+Image';

        return `
        <div class="col-md-3 col-6 mb-4">
            <div class="pp-product-card d-flex flex-column">
                <div class="pp-card-img-wrap"
                    onclick="window.location.href='product.html?id=${p.product_id}'"
                    style="cursor:pointer;">
                    <img src="${imgSrc}" alt="${p.product_name}">
                </div>
                <div class="card-body d-flex flex-column px-0">
                    <h5 class="card-title">${p.product_name}</h5>
                    <p class="pp-variant">${p.variant ?? ''}</p>
                    <p class="pp-price">₱${parseFloat(p.selling_price).toFixed(2)}</p>
                    <p class="pp-stock">${p.stock_quantity > 0
                        ? `In Stock — ${p.stock_quantity} available`
                        : '<span style="color:#c0392b;">Out of Stock</span>'
                    }</p>
                    <div class="mt-auto d-flex" style="gap:8px;">
                        <a href="product.html?id=${p.product_id}" class="pp-btn-view">
                            · View ·
                        </a>
                        <button class="pp-btn-cart add-to-cart ${p.stock_quantity <= 0 ? 'disabled' : ''}"
                            data-id="${p.product_id}"
                            data-name="${p.product_name}"
                            data-price="${p.selling_price}"
                            data-img="${imgSrc}"
                            data-stock="${p.stock_quantity}"
                            ${p.stock_quantity <= 0 ? 'disabled' : ''}>
                            · Add to Cart ·
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // ─── Build Query String From Active Filters ────────────────────────────────
    function buildFilterParams() {
        let params = '';
        if (activeFilters.minPrice !== null) params += `&min_price=${activeFilters.minPrice}`;
        if (activeFilters.maxPrice !== null) params += `&max_price=${activeFilters.maxPrice}`;
        if (activeFilters.categoryIds.length > 0) params += `&category_id=${activeFilters.categoryIds.join(',')}`;
        if (activeFilters.sort) params += `&sort=${activeFilters.sort}`;
        return params;
    }

    // ─── Load Products (infinite scroll) ─────────────────────────────────────
    function loadProducts() {
        if (isLoading || !hasMore) return;

        isLoading = true;
        $('#loading-spinner').show();

        const searchParam = currentSearch
            ? `&search=${encodeURIComponent(currentSearch)}`
            : '';
        const filterParams = buildFilterParams();

        $.ajax({
            method: 'GET',
            url: `${url}api/v1/products?limit=${LIMIT}&offset=${offset}${searchParam}${filterParams}`,
            success: function (data) {
                hasMore = data.hasMore;
                offset += data.products.length;

                // If no products returned, force stop
                if (data.products.length === 0) {
                    hasMore = false;
                    $('#loading-spinner').hide();
                    $('#end-of-products').show();
                    isLoading = false;
                    if (offset === 0) {
                        $('#items').html('<p class="text-muted text-center w-100">No products available.</p>');
                    }
                    return;
                }

                $.each(data.products, function (i, p) {
                    $('#items').append(buildCard(p));
                });

                if (!hasMore) $('#end-of-products').show();

                $('#loading-spinner').hide();
                isLoading = false;
            },
            error: function () {
                $('#loading-spinner').hide();
                isLoading = false;
            }
        });
    }

    // ─── Reset & Reload Grid ──────────────────────────────────────────────────
    function resetAndLoad(query) {
        currentSearch = query;
        offset = 0;
        hasMore = true;
        isLoading = false;
        $('#items').empty();
        $('#end-of-products').hide();
        loadProducts();
    }

    // Expose so header-search.js can trigger a filter without a full page reload
    window.ppResetAndLoad = resetAndLoad;

    // ─── Autocomplete ─────────────────────────────────────────────────────────
    $('#search-input').on('input', function () {
        const query = $(this).val().trim();
        clearTimeout(searchTimeout);
        $('#autocomplete-list').hide().empty();

        // If cleared, reload all products
        if (query.length === 0) {
            resetAndLoad('');
            return;
        }

        // Need at least 2 chars for autocomplete
        if (query.length < 2) return;

        // Debounce — wait 300ms after user stops typing
        searchTimeout = setTimeout(function () {
            $.ajax({
                method: 'GET',
                url: `${url}api/v1/products?limit=5&offset=0&search=${encodeURIComponent(query)}`,
                success: function (data) {
                    $('#autocomplete-list').empty();

                    if (data.products.length === 0) {
                        $('#autocomplete-list')
                            .append('<li class="list-group-item text-muted">No results found</li>')
                            .show();
                        return;
                    }

                    $.each(data.products, function (i, p) {
                        const item = $(`
                            <li class="list-group-item list-group-item-action"
                                style="cursor:pointer;">
                                ${p.product_name}
                                <small class="text-muted float-right">
                                    ₱${parseFloat(p.selling_price).toFixed(2)}
                                </small>
                            </li>
                        `);

                        item.on('click', function () {
                            $('#search-input').val(p.product_name);
                            $('#autocomplete-list').hide().empty();
                            resetAndLoad(p.product_name);
                        });

                        $('#autocomplete-list').append(item);
                    });

                    $('#autocomplete-list').show();
                }
            });
        }, 300);
    });

    // Press Enter to search
    $('#search-input').on('keydown', function (e) {
        if (e.key === 'Enter') {
            const query = $(this).val().trim();
            clearTimeout(searchTimeout);
            $('#autocomplete-list').hide().empty();
            resetAndLoad(query);
        }
    });

    // Hide dropdown when clicking outside
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#search-input, #autocomplete-list').length) {
            $('#autocomplete-list').hide();
        }
    });

    // ─── Infinite Scroll ──────────────────────────────────────────────────────
    let scrollTicking = false;
    $(window).on('scroll', function () {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(function () {
            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const documentHeight = $(document).height();

            if (scrollTop + windowHeight >= documentHeight - 200) {
                loadProducts();
            }
            scrollTicking = false;
        });
    });

    // ─── Add to Cart ──────────────────────────────────────────────────────────
    $(document).on('click', '.add-to-cart', function () {
        const id = $(this).data('id');
        const name = $(this).data('name');
        const price = $(this).data('price');
        const img = $(this).data('img');
        const stock = $(this).data('stock');
        const token = JSON.parse(sessionStorage.getItem('token'));

        if (stock <= 0) {
            Swal.fire({ toast: true, position: 'bottom-right', icon: 'error', text: 'Out of stock!', showConfirmButton: false, timer: 1500, timerProgressBar: true, background: '#faf7f4', color: '#1a0d14', iconColor: '#8b1a4a' });
            return;
        }

        if (token) {
            $.ajax({
                method: 'POST',
                url: `${url}api/v1/cart`,
                contentType: 'application/json',
                data: JSON.stringify({ product_id: id, quantity: 1 }),
                headers: { Authorization: `Bearer ${token}` },
                success: function () {
                    Swal.fire({ toast: true, position: 'bottom-right', icon: 'success', text: `${name} added to cart!`, showConfirmButton: false, timer: 1000, timerProgressBar: true, background: '#faf7f4', color: '#1a0d14', iconColor: '#8b1a4a' });
                    updateCartCount();
                },
                error: function (err) {
                    Swal.fire({ toast: true, position: 'bottom-right', icon: 'error', text: err.responseJSON?.message || 'Failed to add', showConfirmButton: false, timer: 1500, timerProgressBar: true, background: '#faf7f4', color: '#1a0d14', iconColor: '#8b1a4a' });
                }
            });
        } else {
            let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
            let existing = cart.find(item => item.product_id == id);
            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({ product_id: id, product_name: name, price, img, stock, quantity: 1 });
            }
            sessionStorage.setItem('cart', JSON.stringify(cart));
            $('#cart-count').text(cart.length).show();
            Swal.fire({ toast: true, position: 'bottom-right', icon: 'success', text: `${name} added to cart!`, showConfirmButton: false, timer: 1000, timerProgressBar: true, background: '#faf7f4', color: '#1a0d14', iconColor: '#8b1a4a' });
        }
    });

    $(document).on('click', 'a[href="#shop"]', function (e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: $('#shop').offset().top
        }, 500, 'swing');
    });

    // ─── Filters: Price Slider ──────────────────────────────────────────────
    function updatePriceLabels() {
        let minVal = parseInt($('#price-min').val());
        let maxVal = parseInt($('#price-max').val());

        // Keep min <= max
        if (minVal > maxVal) {
            [minVal, maxVal] = [maxVal, minVal];
            $('#price-min').val(minVal);
            $('#price-max').val(maxVal);
        }

        $('#price-min-val').text(minVal.toLocaleString());
        $('#price-max-val').text(maxVal.toLocaleString());
    }

    $('#price-min, #price-max').on('input', updatePriceLabels);

    // ─── Filters: Categories ────────────────────────────────────────────────
    function loadCategoryFilters() {
        $.ajax({
            method: 'GET',
            url: `${url}api/v1/categories`,
            success: function (data) {
                const categories = data.categories || [];
                $('#category-filter-list').empty();

                if (categories.length === 0) {
                    $('#category-filter-list').html('<span class="text-muted">No categories</span>');
                    return;
                }

                $.each(categories, function (i, cat) {
                    const item = `
                        <label class="pp-category-checkbox">
                            <input type="checkbox" class="category-filter-checkbox" value="${cat.category_id}">
                            <span>${cat.category_name}</span>
                        </label>`;
                    $('#category-filter-list').append(item);
                });
            },
            error: function () {
                $('#category-filter-list').html('<span class="text-muted">Failed to load categories</span>');
            }
        });
    }
    loadCategoryFilters();

    // ─── Filters: Apply / Clear ─────────────────────────────────────────────
    $('#btn-apply-filters').on('click', function () {
        const minVal = parseInt($('#price-min').val());
        const maxVal = parseInt($('#price-max').val());
        const sliderMax = parseInt($('#price-max').attr('max'));

        activeFilters.minPrice = minVal > 0 ? minVal : null;
        activeFilters.maxPrice = maxVal < sliderMax ? maxVal : null;

        activeFilters.categoryIds = $('.category-filter-checkbox:checked')
            .map(function () { return $(this).val(); })
            .get();

        activeFilters.sort = $('#sort-select').val();

        resetAndLoad(currentSearch);
    });

    $('#btn-clear-filters').on('click', function () {
        $('#price-min').val(0);
        $('#price-max').val($('#price-max').attr('max'));
        updatePriceLabels();
        $('.category-filter-checkbox').prop('checked', false);
        $('#sort-select').val('');

        activeFilters = { minPrice: null, maxPrice: null, categoryIds: [], sort: '' };
        resetAndLoad(currentSearch);
    });

    // ─── Initial Load ─────────────────────────────────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('search');
    if (initialQuery) {
        $('#search-input').val(initialQuery);
        resetAndLoad(initialQuery);
    } else {
        loadProducts();
    }
});