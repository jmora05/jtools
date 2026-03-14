const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/jtools_db');

const DetallePedidos = sequelize.define('DetallePedidos', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del detalle del pedido'
    },

    pedidosId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del pedido asociado al detalle'
    },

    productosId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del producto asociado al detalle del pedido'
    },

    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Cantidad de productos en el detalle del pedido',
        validate: {
            min: { args: [1], msg: 'La cantidad debe ser al menos 1' }
        }
    },

    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Precio unitario del producto en el detalle del pedido',
        validate: {
            min: { args: [0], msg: 'El precio unitario no puede ser negativo' }
        }
    },

    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Total del detalle del pedido (cantidad * precio unitario)',
        validate: {
            min: { args: [0], msg: 'El total no puede ser negativo' }
        }
    }

},
{
    tableName: 'detallePedidos',
    timestamps: false
});

// RELACIONES

module.exports = DetallePedidos;