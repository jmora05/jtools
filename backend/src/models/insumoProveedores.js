const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const InsumoProveedores = sequelize.define('InsumoProveedores', {
    insumoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    proveedorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'insumo_proveedores',
    timestamps: false,
});

module.exports = InsumoProveedores;
