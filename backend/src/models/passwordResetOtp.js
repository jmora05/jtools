const { DataTypes } = require('sequelize');
const { sequelize }  = require('../config/jtools_db');

/**
 * Tabla para OTPs de recuperación de contraseña.
 * El OTP se guarda hasheado con bcrypt — nunca en texto plano.
 */
const PasswordResetOtp = sequelize.define('PasswordResetOtp', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // FK al usuario dueño del OTP
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // OTP hasheado con bcrypt
    otpHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    // Cuándo expira
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    // Cuántos intentos fallidos se han hecho con este OTP
    failedAttempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    // Si ya fue usado para cambiar la contraseña
    used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'password_reset_otps',
    timestamps: true,   // createdAt / updatedAt
    updatedAt: false,   // solo necesitamos createdAt
});

module.exports = PasswordResetOtp;
