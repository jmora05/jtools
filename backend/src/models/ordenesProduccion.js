const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const OrdenesProduccion = sequelize.define('OrdenesProduccion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la orden de producción'
    },

    codigoOrden: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: {
            name: 'unique_codigo_orden',
            msg: 'Este código de orden ya existe'
        },
        comment: 'Código único de la orden (ej: OP-2025-001)'
    },

    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: 'El producto es obligatorio' },
            isInt: { msg: 'El productoId debe ser un número entero' }
        },
        comment: 'Identificador del producto a fabricar'
    },

    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: 'La cantidad es obligatoria' },
            isInt: { msg: 'La cantidad debe ser un número entero' },
            min: { args: [1], msg: 'La cantidad debe ser mayor a 0' }
        },
        comment: 'Cantidad de unidades a producir'
    },

    responsableId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: 'El responsable es obligatorio' },
            isInt: { msg: 'El responsableId debe ser un número entero' }
        },
        comment: 'Identificador del empleado responsable'
    },

    pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Identificador del pedido asociado (opcional)'
    },

    estado: {
        type: DataTypes.ENUM('Pendiente', 'En Proceso', 'Pausada', 'Finalizada', 'Anulada'),
        allowNull: false,
        defaultValue: 'Pendiente',
        comment: 'Estado actual de la orden de producción'
    },

    fechaEntrega: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notNull: { msg: 'La fecha de entrega es obligatoria' },
            isDate: { msg: 'La fecha de entrega debe ser una fecha válida' }
        },
        comment: 'Fecha límite de entrega de la orden'
    },

    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha en que se inició la producción'
    },

    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha en que se finalizó la producción'
    },

    nota: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas o instrucciones adicionales'
    },

    motivoAnulacion: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Motivo de anulación si el estado es Anulada'
    }

}, {
    timestamps: true,
    tableName: 'ordenes_produccion',
    comment: 'Tabla que almacena las órdenes de producción'
});

module.exports = OrdenesProduccion;