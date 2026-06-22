module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        order_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false
        },
        order_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        order_status: {
            type: DataTypes.ENUM('Pending', 'Processing', 'Out for Delivery', 'Completed', 'Cancelled'),
            defaultValue: 'Pending'
        },
        date_received: {
            type: DataTypes.DATE
        },
        payment_method: {
            type: DataTypes.ENUM('COD', 'GCash'),
            defaultValue: 'COD'
        },
        payment_reference: {
            type: DataTypes.STRING(100)
        }
    }, {
        tableName: 'orders',
        timestamps: false
    });
    return Order;
};