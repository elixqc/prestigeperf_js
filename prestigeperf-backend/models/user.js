module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        user_id: { 
            type: DataTypes.BIGINT.UNSIGNED, 
            primaryKey: true, 
            autoIncrement: true },
        username: { 
            type: DataTypes.STRING(50), 
            allowNull: false },
        full_name: { 
            type: DataTypes.STRING(100) },
        contact_number: { 
            type: DataTypes.STRING(20) },
        address: { 
            type: DataTypes.STRING(255) },
        profile_picture: { 
            type: DataTypes.STRING(255) },
        email: { 
            type: DataTypes.STRING(100), 
            unique: true },
        password: { 
            type: DataTypes.STRING(255), 
            allowNull: false },
        token: { 
            type: DataTypes.TEXT, 
            allowNull: true },
        role: { 
            type: DataTypes.ENUM('admin', 'customer'), 
            defaultValue: 'customer' },
        is_active: { 
            type: DataTypes.TINYINT(1), 
            defaultValue: 1 }
    }, { 
        tableName: 'users', 
        timestamps: true, 
        underscored: true });
    return User;
};