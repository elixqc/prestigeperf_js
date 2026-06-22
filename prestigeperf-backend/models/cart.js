module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define('Cart', {
        user_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true
        },
        product_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        date_added: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'cart',
        timestamps: false  // ← palitan ng false!
    });
    return Cart;
};