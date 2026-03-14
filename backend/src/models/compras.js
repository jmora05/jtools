const { DataTypes } = require('sequelize'); 

const { sequelize } = require('../config/jtools_db');

const Compras = sequelize.define('Compras', {
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true,
        autoIncrement: false,
        comment: 'numero de factura de la compra',
        unique: {
            name: 'unique_numero_factura',
            msg: 'Este número de factura ya existe'
        }
        // ⚠️ 
    },

    proveedoresId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del proveedor asociado a la compra'
    },

    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, 
        comment: 'Fecha de la compra',
        validate: {
            isDate: { msg: 'La fecha debe ser un valor de fecha válido' },
            notEmpty: { msg: 'La fecha no puede estar vacía' }
        }
    },

    metodoPago: {
        type: DataTypes.ENUM('efectivo', 'transferencia'),
        allowNull: false,
        defaultValue: 'efectivo',
        comment: 'Método de pago utilizado en la compra',
        validate: {
            isIn: {
                args: [['efectivo', 'transferencia']],
                msg: 'El método de pago debe ser efectivo o transferencia'
            },
            notEmpty: { msg: 'El método de pago no puede estar vacío' }
        }
    },

    estado: {
        type: DataTypes.ENUM('pendiente', 'en transito', 'completada'),
        allowNull: false,
        defaultValue: 'pendiente'
    },

}, {
    tableName: 'compras',
    timestamps: false
});



module.exports = Compras;