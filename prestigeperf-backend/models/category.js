module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        category_id: { 
            type: DataTypes.BIGINT.UNSIGNED, 
            primaryKey: true, 
            autoIncrement: true },
        category_name: { 
            type: DataTypes.STRING(50), 
            allowNull: false },
        deleted_at: { 
            type: DataTypes.DATE }
    }, { 
        tableName: 'categories', 
        timestamps: false });
    return Category;
};