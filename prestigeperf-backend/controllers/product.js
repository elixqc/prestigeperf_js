const { Product, Category, Supplier, ProductImage, Order, OrderDetail } = require('../models');
const { Op, fn, col } = require('sequelize');

exports.getAllProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search || '';
        const minPrice = req.query.min_price !== undefined ? parseFloat(req.query.min_price) : null;
        const maxPrice = req.query.max_price !== undefined ? parseFloat(req.query.max_price) : null;
        const categoryId = req.query.category_id || ''; // comma-separated ids, e.g. "1,3,5"
        const sort = req.query.sort || '';

        const whereClause = {
            is_active: 1,
            ...(search && {
                product_name: { [Op.like]: `%${search}%` }
            }),
            ...((minPrice !== null || maxPrice !== null) && {
                selling_price: {
                    ...(minPrice !== null && !isNaN(minPrice) && { [Op.gte]: minPrice }),
                    ...(maxPrice !== null && !isNaN(maxPrice) && { [Op.lte]: maxPrice })
                }
            }),
            ...(categoryId && {
                category_id: categoryId.includes(',')
                    ? { [Op.in]: categoryId.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) }
                    : parseInt(categoryId)
            })
        };

        const includeOpts = [
            { model: Category, attributes: ['category_name'] },
            { model: Supplier, attributes: ['supplier_name'] },
            { model: ProductImage, attributes: ['image_id', 'image_path'] }
        ];

        if (sort === 'best_selling') {
            // 1. Aggregate quantity sold per product (Completed orders only) as its
            //    own isolated query — no joins to Category/Supplier/ProductImage here,
            //    so there's no fan-out risk from those hasMany relations skewing SUM().
            const soldRows = await OrderDetail.findAll({
                attributes: [
                    'product_id',
                    [fn('SUM', col('OrderDetail.quantity')), 'sold_count']
                ],
                include: [{
                    model: Order,
                    attributes: [],
                    where: { order_status: 'Completed' },
                    required: true
                }],
                group: ['OrderDetail.product_id'],
                raw: true
            });

            const soldMap = new Map(soldRows.map(r => [r.product_id, parseInt(r.sold_count, 10)]));

            // 2. Fetch every product matching the filters (no limit/offset yet) —
            //    Category/Supplier/ProductImage are safe to include here since
            //    there's no aggregate/group in this query to be thrown off by them.
            const allProducts = await Product.findAll({
                where: whereClause,
                include: includeOpts,
                distinct: true
            });

            // 3. Attach sold_count, sort by it, then paginate in memory.
            const withCounts = allProducts
                .map(p => ({ product: p, sold_count: soldMap.get(p.product_id) || 0 }))
                .sort((a, b) => b.sold_count - a.sold_count);

            const total = withCounts.length;
            const pageSlice = withCounts.slice(offset, offset + limit).map(x => x.product);

            return res.json({ success: true, products: pageSlice, total, hasMore: offset + limit < total });
        }

        // Default (non best-selling) path — normal Sequelize pagination.
        const { count, rows: products } = await Product.findAndCountAll({
            where: whereClause,
            include: includeOpts,
            limit,
            offset,
            distinct: true
        });

        res.json({ success: true, products, total: count, hasMore: offset + limit < count });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getSingleProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                { model: Category, attributes: ['category_name'] },
                { model: Supplier, attributes: ['supplier_name'] },
                { model: ProductImage, attributes: ['image_id', 'image_path'] }
            ]
        });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { product_name, description, category_id, supplier_id, initial_price, selling_price, stock_quantity, variant } = req.body;

        const product = await Product.create({
            product_name,
            description,
            category_id,
            supplier_id,
            initial_price,
            selling_price,
            stock_quantity,
            variant
        });

        if (req.files && req.files.length > 0) {
            const images = req.files.map(file => ({
                product_id: product.product_id,
                image_path: file.filename
            }));

            await ProductImage.bulkCreate(images);
        }

        res.status(201).json({ success: true, message: 'Product created', product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const {
            product_name,
            description,
            category_id,
            supplier_id,
            initial_price,
            selling_price,
            stock_quantity,
            variant
        } = req.body;

        const productId = req.params.id;

        await Product.update(
            {
                product_name,
                description,
                category_id,
                supplier_id,
                initial_price,
                selling_price,
                stock_quantity,
                variant
            },
            { where: { product_id: productId } }
        );

        if (req.files && req.files.length > 0) {
            const images = req.files.map(file => ({
                product_id: productId,
                image_path: file.filename
            }));

            await ProductImage.bulkCreate(images);
        }

        res.json({ success: true, message: 'Product updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await Product.update({ is_active: 0 }, { where: { product_id: req.params.id } });
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.restoreProduct = async (req, res) => {
  try {
    await Product.update(
      { is_active: 1, deleted_at: null },
      { where: { product_id: req.params.id } }
    );

    res.json({ success: true, message: 'Product restored' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProductImage = async (req, res) => {
    try {
        const image = await ProductImage.findByPk(req.params.imageId);
        if (!image) return res.status(404).json({ success: false, message: 'Image not found' });

        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', 'images', image.image_path);
        fs.unlink(filePath, (err) => {
            if (err) console.log('File delete error:', err.message);
        });

        await image.destroy();
        res.json({ success: true, message: 'Image deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getInactiveProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { is_active: 0 },
            include: [
                { model: Category, attributes: ['category_name'] },
                { model: Supplier, attributes: ['supplier_name'] },
                { model: ProductImage, attributes: ['image_id', 'image_path'] }
            ]
        });
        res.json({ success: true, products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};