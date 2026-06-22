module.exports = (sequelize, DataTypes) => {
    const Supplier = sequelize.define('Supplier', {
        supplier_id: { type: DataTypes.BIGINT.UNSIGNED, 
            primaryKey: true, 
            autoIncrement: true },
        supplier_name: { 
            type: DataTypes.STRING(100), 
            allowNull: false },
        contact_person: { 
            type: DataTypes.STRING(100) },
        contact_number: { 
            type: DataTypes.STRING(20) },
        address: { 
            type: DataTypes.STRING(255) },
        is_active: { 
            type: DataTypes.TINYINT(1), 
            defaultValue: 1 },
        deleted_at: { 
            type: DataTypes.DATE }
    }, { 
        tableName: 'suppliers', 
        timestamps: false });
    return Supplier;
};