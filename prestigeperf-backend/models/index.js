const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const User = require('./user')(sequelize, DataTypes);
const Category = require('./category')(sequelize, DataTypes);
const Supplier = require('./supplier')(sequelize, DataTypes);
const Product = require('./product')(sequelize, DataTypes);
const Order = require('./order')(sequelize, DataTypes);
const OrderDetail = require('./orderDetail')(sequelize, DataTypes);
const ProductImage = require('./productImage')(sequelize, DataTypes);
const Cart = require('./cart')(sequelize, DataTypes);

// Associations
Product.belongsTo(Category, { foreignKey: 'category_id' });
Product.belongsTo(Supplier, { foreignKey: 'supplier_id' });
Product.hasMany(ProductImage, { foreignKey: 'product_id' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });
Category.hasMany(Product, { foreignKey: 'category_id' });
Supplier.hasMany(Product, { foreignKey: 'supplier_id' });

Order.belongsTo(User, { foreignKey: 'user_id' });
Order.hasMany(OrderDetail, { foreignKey: 'order_id' });
OrderDetail.belongsTo(Order, { foreignKey: 'order_id' });
OrderDetail.belongsTo(Product, { foreignKey: 'product_id' });

Cart.belongsTo(Product, { foreignKey: 'product_id' });
Cart.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(Cart, { foreignKey: 'product_id' });

module.exports = { sequelize, User, Category, Supplier, Product, ProductImage, Order, OrderDetail, Cart };