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

    // jQuery Validate setup
    $.validator.addMethod('greaterThanCost', function (value, element) {
        return parseFloat(value) >= parseFloat($('#initial_price').val());
    }, 'Selling price must be greater than or equal to cost price!');

    $.validator.addMethod('requireImage', function (value, element) {
        const id = $('#product_id').val();
        if (id) return true;
        return element.files.length > 0; // adding — required
    }, 'Please upload at least one image!');

    $('#productForm').validate({
        rules: {
            product_name: {
                required: true,
                minlength: 2
            },
            category_id: {
                required: true
            },
            supplier_id: {
                required: true
            },
            initial_price: {
                required: true,
                number: true,
                min: 0
            },
            selling_price: {
                required: true,
                number: true,
                min: 0,
                greaterThanCost: true
            },
            stock_quantity: {
                required: true,
                digits: true,
                min: 0
            },
            variant: {
                required: true
            },
            images: {
                requireImage: true
            }

        },
        messages: {
            product_name: {
                required: 'Product name is required!',
                minlength: 'At least 2 characters!'
            },
            category_id: {
                required: 'Please select a category!'
            },
            supplier_id: {
                required: 'Please select a supplier!'
            },
            initial_price: {
                required: 'Cost price is required!',
                number: 'Must be a valid number!',
                min: 'Must be 0 or greater!'
            },
            selling_price: {
                required: 'Selling price is required!',
                number: 'Must be a valid number!',
                min: 'Must be 0 or greater!'
            },
            stock_quantity: {
                required: 'Stock quantity is required!',
                digits: 'Must be a whole number!',
                min: 'Must be 0 or greater!'
            },
            variant: {
                required: 'Variant is required! (e.g. 100ml)'
            },
            images: {
                requireImage: 'Please upload at least one image!'
            }
        },
        errorElement: 'label',
        errorClass: 'error',
        errorPlacement: function (error, element) {
            // route the error next to the dropzone for the file input,
            // otherwise default placement right after the field
            if (element.attr('id') === 'images') {
                error.insertAfter('#dropzone');
            } else {
                error.insertAfter(element);
            }
        }
    });

    // Load categories dropdown
    $.ajax({
        method: "GET",
        url: `${url}api/v1/categories`,
        success: function (data) {
            $.each(data.categories, function (i, cat) {
                $('#category_id').append(`<option value="${cat.category_id}">${cat.category_name}</option>`);
            });
        }
    });

    // Load suppliers dropdown
    $.ajax({
        method: "GET",
        url: `${url}api/v1/suppliers`,
        success: function (data) {
            $.each(data.suppliers, function (i, sup) {
                $('#supplier_id').append(`<option value="${sup.supplier_id}">${sup.supplier_name}</option>`);
            });
        }
    });

    let showingInactive = false;

    // Load products table
    function loadProducts() {
        const endpoint = showingInactive
            ? `${url}api/v1/products/inactive/list`
            : `${url}api/v1/products?limit=1000`;

        $.ajax({
            method: "GET",
            url: endpoint,
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (data) {
                const rows = [];

                $.each(data.products, function (i, p) {
                    const imgSrc = (p.ProductImages && p.ProductImages.length > 0)
                        ? `${url}images/${p.ProductImages[0].image_path}`
                        : 'https://via.placeholder.com/50?text=N/A';

                    const actions = showingInactive
                        ? `<div class="pp-row-actions">
                               <button class="pp-btn-icon btn-restore" title="Restore" data-id="${p.product_id}"><i class="fas fa-undo"></i></button>
                           </div>`
                        : `<div class="pp-row-actions">
                               <button class="pp-btn-icon edit btn-edit" title="Edit" data-id="${p.product_id}"><i class="fas fa-pen"></i></button>
                               <button class="pp-btn-icon delete btn-delete" title="Delete" data-id="${p.product_id}"><i class="fas fa-trash"></i></button>
                           </div>`;

                    const stockPill = p.stock_quantity > 0
                        ? (p.stock_quantity <= 5
                            ? `<span class="pp-pill pp-pill-lowstock">${p.stock_quantity} left</span>`
                            : `<span class="pp-pill pp-pill-instock">${p.stock_quantity} in stock</span>`)
                        : `<span class="pp-pill pp-pill-outstock">Out of stock</span>`;

                    rows.push([
                        i + 1,
                        `<img src="${imgSrc}" class="pp-row-thumb">`,
                        `<div class="pp-row-title">${p.product_name}</div>${p.variant ? `<div class="pp-row-subtext">${p.variant}</div>` : ''}`,
                        p.Category?.category_name ?? 'N/A',
                        p.Supplier?.supplier_name ?? 'N/A',
                        `₱${p.initial_price}`,
                        `₱${p.selling_price}`,
                        stockPill,
                        actions
                    ]);
                });

                if (table) {
                    table.clear();
                    table.rows.add(rows);
                    table.draw();
                } else {
                    table = $('#products-table').DataTable({
                        data: rows,
                        columns: [
                            { title: "#" }, { title: "Image" }, { title: "Product Name" },
                            { title: "Category" }, { title: "Supplier" }, { title: "Cost Price" },
                            { title: "Sell Price" }, { title: "Stock" },
                            { title: "Actions", orderable: false }
                        ]
                    });
                }
            }
        });
    }

    // Toggle active/inactive
    $('#btn-toggle-view').on('click', function () {
        showingInactive = !showingInactive;
        $(this).text(showingInactive ? 'Show Active' : 'Show Inactive');
        $('#btn-add').toggle(!showingInactive);
        loadProducts();
    });

    // Restore product
    $(document).on('click', '.btn-restore', function () {
        const id = $(this).data('id');
        Swal.fire({
            title: 'Restore this product?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#8b1a4a',
            confirmButtonText: 'Yes, restore it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'PUT',
                    url: `${url}api/v1/products/${id}/restore`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    success: function () {
                        Swal.fire({ icon: 'success', text: 'Product restored!', position: 'bottom-right', showConfirmButton: false, timer: 1500 });
                        loadProducts();
                    }
                });
            }
        });
    });

    loadProducts();

    /* ===============================================================
       Atelier Entry modal — image dropzone + thumbnails + margin badge
       =============================================================== */

    const $images = $('#images');
    const $dropzone = $('#dropzone');
    const $preview = $('#image-preview');

    // Renders the "NEW" thumbnails for whatever is currently in the
    // #images file input, each with its own remove button.
    function renderNewThumbs() {
        $preview.empty();
        const files = $images[0].files;

        if (!files || files.length === 0) {
            $preview.hide();
            return;
        }

        $.each(files, function (i, file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $preview.append(`
                    <div class="pp-thumb pp-thumb-new" data-new-index="${i}">
                        <img src="${e.target.result}">
                        <button type="button" class="pp-thumb-remove" title="Remove">&times;</button>
                    </div>
                `);
            };
            reader.readAsDataURL(file);
        });
        $preview.show();
    }

    // Replace the file input's FileList with a filtered version
    // (native <input type="file"> lists are read-only, so we
    // rebuild it via DataTransfer).
    function removeNewFileAt(index) {
        const dt = new DataTransfer();
        const files = $images[0].files;
        $.each(files, function (i, file) {
            if (i !== index) dt.items.add(file);
        });
        $images[0].files = dt.files;
        renderNewThumbs();
    }

    $images.on('change', renderNewThumbs);

    $(document).on('click', '.pp-thumb-new .pp-thumb-remove', function () {
        const index = parseInt($(this).closest('.pp-thumb').data('new-index'), 10);
        removeNewFileAt(index);
    });

    // Drag & drop support on the dropzone
    ['dragenter', 'dragover'].forEach(evt => {
        $dropzone.on(evt, function (e) {
            e.preventDefault();
            e.stopPropagation();
            $dropzone.addClass('is-dragover');
        });
    });
    ['dragleave', 'drop'].forEach(evt => {
        $dropzone.on(evt, function (e) {
            e.preventDefault();
            e.stopPropagation();
            $dropzone.removeClass('is-dragover');
        });
    });
    $dropzone.on('drop', function (e) {
        const dropped = e.originalEvent.dataTransfer.files;
        if (!dropped || dropped.length === 0) return;

        const dt = new DataTransfer();
        $.each($images[0].files, function (i, f) { dt.items.add(f); });
        $.each(dropped, function (i, f) {
            if (f.type.startsWith('image/')) dt.items.add(f);
        });
        $images[0].files = dt.files;
        renderNewThumbs();
    });

    // Live margin badge
    function updateMargin() {
        const cost = parseFloat($('#initial_price').val());
        const sell = parseFloat($('#selling_price').val());
        const $val = $('#margin-value');

        if (isNaN(cost) || isNaN(sell) || cost <= 0) {
            $val.removeClass('is-negative').addClass('is-flat').text('—');
            return;
        }

        const profit = sell - cost;
        const pct = (profit / cost) * 100;

        $val.removeClass('is-flat is-negative');
        if (profit < 0) $val.addClass('is-negative');

        $val.text(`₱${profit.toFixed(2)} · ${pct.toFixed(1)}%`);
    }

    $(document).on('input', '#initial_price, #selling_price', updateMargin);

    // Reset modal for Add
    $('#btn-add').on('click', function () {
        $('#modal-title').html('Add <em>Product</em>');
        $('.pp-pmodal-eyebrow').text('Catalog · New Entry');
        $('#product_id').val('');
        $('#productForm')[0].reset();
        $preview.hide().empty();
        $('#existing-images').empty();
        $('#productForm').validate().resetForm();
        $('.error').removeClass('error');
        updateMargin();
        $('#productModal').modal('show');
    });

    // Edit button
    $(document).on('click', '.btn-edit', function () {
        const id = $(this).data('id');
        $.ajax({
            method: "GET",
            url: `${url}api/v1/products/${id}`,
            success: function (data) {
                const p = data.product;
                $('#modal-title').html('Edit <em>Product</em>');
                $('.pp-pmodal-eyebrow').text('Catalog · #' + p.product_id);
                $('#product_id').val(p.product_id);
                $('#product_name').val(p.product_name);
                $('#description').val(p.description ?? '');
                $('#category_id').val(p.category_id ?? '');
                $('#supplier_id').val(p.supplier_id ?? '');
                $('#initial_price').val(p.initial_price);
                $('#selling_price').val(p.selling_price);
                $('#stock_quantity').val(p.stock_quantity);
                $('#variant').val(p.variant ?? '');
                $images.val('');
                $preview.hide().empty();
                $('#productForm').validate().resetForm();
                $('.error').removeClass('error');
                updateMargin();

                $('#existing-images').empty();
                (p.ProductImages || []).forEach(img => {
                    $('#existing-images').append(`
                        <div class="pp-thumb" data-img-id="${img.image_id}">
                            <img src="${url}images/${img.image_path}">
                            <button type="button" class="pp-thumb-remove btn-delete-image" title="Delete">&times;</button>
                        </div>
                    `);
                });

                $('#productModal').modal('show');
            }
        });
    });

    // Delete single image
    $(document).on('click', '.btn-delete-image', function () {
        const wrapper = $(this).closest('[data-img-id]');
        const imageId = wrapper.data('img-id');
        const productId = $('#product_id').val();

        Swal.fire({
            title: 'Delete this image?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8b1a4a',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `${url}api/v1/products/${productId}/images/${imageId}`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    success: function () {
                        wrapper.remove();
                        Swal.fire({ icon: 'success', text: 'Image deleted!', position: 'bottom-right', showConfirmButton: false, timer: 1200 });
                    }
                });
            }
        });
    });

    // Save with validation
    $('#btn-save').on('click', function () {
        if (!$('#productForm').valid()) return; // ← jQuery Validate check

        const id = $('#product_id').val();
        const formData = new FormData();

        formData.append('product_name', $('#product_name').val());
        formData.append('description', $('#description').val());
        formData.append('category_id', $('#category_id').val());
        formData.append('supplier_id', $('#supplier_id').val());
        formData.append('initial_price', $('#initial_price').val());
        formData.append('selling_price', $('#selling_price').val());
        formData.append('stock_quantity', $('#stock_quantity').val());
        formData.append('variant', $('#variant').val());

        const files = $images[0].files;
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }

        const method = id ? 'PUT' : 'POST';
        const endpoint = id ? `${url}api/v1/products/${id}` : `${url}api/v1/products`;

        $.ajax({
            method: method,
            url: endpoint,
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                $('#productModal').modal('hide');
                Swal.fire({ icon: 'success', text: id ? 'Product updated!' : 'Product created!', position: 'bottom-right', showConfirmButton: false, timer: 1500 });
                loadProducts();
            },
            error: function (err) {
                Swal.fire({ icon: 'error', text: err.responseJSON?.message || 'Something went wrong', position: 'bottom-right', showConfirmButton: false, timer: 1500 });
            }
        });
    });

    // Delete product
    $(document).on('click', '.btn-delete', function () {
        const id = $(this).data('id');
        Swal.fire({
            title: 'Are you sure?',
            text: 'This product will be deactivated.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#8b1a4a',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `${url}api/v1/products/${id}`,
                    headers: { 'Authorization': `Bearer ${token}` },
                    success: function () {
                        Swal.fire({ icon: 'success', text: 'Product deleted!', position: 'bottom-right', showConfirmButton: false, timer: 1500 });
                        loadProducts();
                    }
                });
            }
        });
    });
});