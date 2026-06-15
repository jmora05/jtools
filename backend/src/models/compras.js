const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const Compras = sequelize.define('Compras', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },

    numeroFactura: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: {
            name: 'unique_numero_factura',
            msg: 'Este número de factura ya existe',
        },
    },

    // Número de compra alfanumérico, separado de la PK (id). Lo escribe el
    // usuario; la unicidad se valida a mano (case-insensitive) en el controlador.
    numeroCompra: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: false,
    },

    // IVA aplicado a la compra, en porcentaje (ej. 19.00 = 19%). Editable por compra.
    iva: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 19.00,
        validate: { min: 0, max: 100 },
    },

    proveedoresId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del proveedor asociado a la compra',
    },

    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Fecha de la compra',
        validate: {
            isDate: { msg: 'La fecha debe ser un valor de fecha válido' },
            notEmpty: { msg: 'La fecha no puede estar vacía' },
        },
    },

    metodoPago: {
        type: DataTypes.ENUM('efectivo', 'transferencia'),
        allowNull: false,
        defaultValue: 'efectivo',
        validate: {
            isIn: {
                args: [['efectivo', 'transferencia']],
                msg: 'El método de pago debe ser efectivo o transferencia',
            },
            notEmpty: { msg: 'El método de pago no puede estar vacío' },
        },
    },

    // ── 'anulada' añadido como estado terminal (soft-delete) ──────────────
    estado: {
        type: DataTypes.ENUM('pendiente', 'completada', 'anulada'),
        allowNull: false,
        defaultValue: 'pendiente',
    },
}, {
    tableName: 'compras',
    timestamps: false,
});

module.exports = Compras;