const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const Ventas = sequelize.define('Ventas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la venta'
    },

    clientesId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del cliente asociado a la venta'
    },

    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Fecha de la venta',
        validate: {
            isDate: { msg: 'La fecha debe ser un valor de fecha válido' }
        }
    },

    metodoPago: {
        type: DataTypes.ENUM('efectivo', 'transferencia'), // ✅ Datatypes → DataTypes
        allowNull: false,
        defaultValue: 'efectivo',
        comment: 'Método de pago utilizado en la venta',
        validate: {
            isIn: {
                args: [['efectivo', 'transferencia']],
                msg: 'El método de pago debe ser efectivo o transferencia'
            },
            notEmpty: { msg: 'El método de pago no puede estar vacío' }
        }
    },

    tipoVenta: {
        type: DataTypes.ENUM('directa', 'pedido'),
        allowNull: false,
        defaultValue: 'directa',
        comment: 'Tipo de venta realizada',
        validate: {
            isIn: {
                args: [['directa', 'pedido']],
                msg: 'El tipo de venta debe ser directa o pedido'
            },
            notEmpty: { msg: 'El tipo de venta no puede estar vacío' }
        }
    },

    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        comment: 'Total de la venta',
        validate: {
            isDecimal: { msg: 'El total debe ser un valor decimal válido' },
            min: { args: [0], msg: 'El total no puede ser negativo' }
        }
    }

}, {
    tableName: 'ventas',
    timestamps: false
});



module.exports = Ventas;