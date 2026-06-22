module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        product_id: { 
            type: DataTypes.BIGINT.UNSIGNED, 
            primaryKey: true, 
            autoIncrement: true },
        product_name: { 
            type: DataTypes.STRING(100), 
            allowNull: false },
        description: { 
            type: DataTypes.TEXT },
        category_id: { 
            type: DataTypes.BIGINT.UNSIGNED },
        supplier_id: { 
            type: DataTypes.BIGINT.UNSIGNED },
        initial_price: { 
            type: DataTypes.DECIMAL(10, 2) },
        selling_price: { 
            type: DataTypes.DECIMAL(10, 2) },
        stock_quantity: { 
            type: DataTypes.INTEGER, 
            defaultValue: 0 },
        variant: { 
            type: DataTypes.STRING(50) },
        is_active: { 
            type: DataTypes.TINYINT(1), 
            defaultValue: 1 },
        deleted_at: { 
            type: DataTypes.DATE }
    }, { 
        tableName: 'products', 
        timestamps: true, 
        underscored: true });
    return Product;
};