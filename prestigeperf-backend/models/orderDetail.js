module.exports = (sequelize, DataTypes) => {
    const OrderDetail = sequelize.define('OrderDetail', {
        order_detail_id: { 
            type: DataTypes.BIGINT.UNSIGNED, 
            primaryKey: true, 
            autoIncrement: true },
        order_id: { 
            type: DataTypes.BIGINT.UNSIGNED, 
            allowNull: false },
        product_id: { 
            type: DataTypes.BIGINT.UNSIGNED, 
            allowNull: false },
        quantity: { 
            type: DataTypes.INTEGER, 
            allowNull: false },
        price: { 
            type: DataTypes.DECIMAL(10, 2), 
            allowNull: false }
    }, { 
        tableName: 'order_details', 
        timestamps: false });
    return OrderDetail;
};