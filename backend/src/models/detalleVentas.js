const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/jtools_db');

const DetalleVentas = sequelize.define('DetalleVentas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del detalle de venta'
    },

    ventasId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de la venta asociada al detalle'
    },

    productosId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del producto asociado al detalle de venta'
    },

    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Cantidad de productos vendidos en el detalle de venta',
        validate: {
            min: { args: [1], msg: 'La cantidad debe ser al menos 1' }
        }
    },

    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Precio unitario del producto en el detalle de venta',
        validate: {
            min: { args: [0], msg: 'El precio unitario no puede ser negativo' }
        }
    },

    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Total del detalle de venta (cantidad * precio unitario)',
        validate: {
            min: { args: [0], msg: 'El total no puede ser negativo' }
        }
    }
},
{
    tableName: 'detalleVentas',
    timestamps: false
});



module.exports = DetalleVentas;