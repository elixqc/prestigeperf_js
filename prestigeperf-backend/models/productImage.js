module.exports = (sequelize, DataTypes) => {
    const ProductImage = sequelize.define('ProductImage', {
        image_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        product_id: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false
        },
        image_path: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        tableName: 'product_images',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true
    });

    return ProductImage;
};