$(function () {
    const url = 'http://localhost:3000/';
    let searchTimeout = null;

    // ─── Toggle search panel open/closed ───────────────────────────────────
    $(document).on('click', '#pp-nav-search-toggle', function (e) {
        e.preventDefault();
        const $panel = $('#pp-nav-search');
        const isOpen = $panel.toggleClass('is-open').hasClass('is-open');
        $(this).attr('aria-expanded', isOpen);

        if (isOpen) {
            $('#header-search-input').focus();
        } else {
            $('#header-search-input').val('');
            $('#header-autocomplete-list').hide().empty();
        }
    });

    $(document).on('click', '#header-search-close', function () {
        $('#pp-nav-search').removeClass('is-open');
        $('#pp-nav-search-toggle').attr('aria-expanded', false);
        $('#header-search-input').val('');
        $('#header-autocomplete-list').hide().empty();
    });

    // ─── Autocomplete ───────────────────────────────────────────────────────
    $(document).on('input', '#header-search-input', function () {
        const query = $(this).val().trim();
        clearTimeout(searchTimeout);
        $('#header-autocomplete-list').hide().empty();

        if (query.length < 2) return;

        searchTimeout = setTimeout(function () {
            $.ajax({
                method: 'GET',
                url: `${url}api/v1/products?limit=5&offset=0&search=${encodeURIComponent(query)}`,
                success: function (data) {
                    $('#header-autocomplete-list').empty();

                    if (data.products.length === 0) {
                        $('#header-autocomplete-list')
                            .append('<li class="list-group-item text-muted">No results found</li>')
                            .show();
                        return;
                    }

                    $.each(data.products, function (i, p) {
                        const item = $(`
                            <li class="list-group-item list-group-item-action" style="cursor:pointer;">
                                <span>${p.product_name}</span>
                                <small>₱${parseFloat(p.selling_price).toFixed(2)}</small>
                            </li>
                        `);

                        item.on('click', function () {
                            goToSearch(p.product_name);
                        });

                        $('#header-autocomplete-list').append(item);
                    });

                    $('#header-autocomplete-list').show();
                }
            });
        }, 300);
    });

    // Press Enter to search
    $(document).on('keydown', '#header-search-input', function (e) {
        if (e.key === 'Enter') {
            const query = $(this).val().trim();
            if (query.length === 0) return;
            goToSearch(query);
        }
    });

    // Hide dropdown / close panel when clicking outside
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#pp-nav-search, #pp-nav-search-toggle').length) {
            $('#header-autocomplete-list').hide();
        }
    });

    // ─── Where a selected/entered search should go ─────────────────────────
    function goToSearch(query) {
        const onHomePage = /home\.html$/.test(window.location.pathname)
            || window.location.pathname === '/'
            || window.location.pathname === '';

        // If home.js has exposed its resetAndLoad function, filter in place
        if (onHomePage && typeof window.ppResetAndLoad === 'function') {
            $('#search-input').val(query);
            window.ppResetAndLoad(query);
            $('#pp-nav-search').removeClass('is-open');
            $('#header-autocomplete-list').hide().empty();

            const $shop = $('#shop');
            if ($shop.length) {
                $('html, body').animate({ scrollTop: $shop.offset().top }, 500, 'swing');
            }
        } else {
            // Otherwise navigate to the shop page with the query
            window.location.href = `home.html?search=${encodeURIComponent(query)}#shop`;
        }
    }
});