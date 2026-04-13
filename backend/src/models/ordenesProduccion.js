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
        references: { model: 'productos', key: 'id' },
        validate: {
            notNull: { msg: 'El producto es obligatorio' },
            isInt:   { msg: 'El productoId debe ser un número entero' }
        },
        comment: 'Identificador del producto a fabricar'
    },

    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: 'La cantidad es obligatoria' },
            isInt:   { msg: 'La cantidad debe ser un número entero' },
            min:     { args: [1],      msg: 'La cantidad debe ser mayor a 0' },
            max:     { args: [100000], msg: 'La cantidad no puede superar las 100.000 unidades' }
        },
        comment: 'Cantidad de unidades a producir'
    },

    responsableId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'empleados', key: 'id' },
        validate: {
            notNull: { msg: 'El responsable es obligatorio' },
            isInt:   { msg: 'El responsableId debe ser un número entero' }
        },
        comment: 'Identificador del empleado responsable'
    },

    pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'pedidos', key: 'id' },
        comment: 'Identificador del pedido asociado (solo si tipoOrden es Pedido)'
    },

    // ⚠️ Se usa STRING en lugar de ENUM para evitar que Sequelize alter:true
    //    genere SQL inválido en PostgreSQL al intentar cambiar el tipo.
    tipoOrden: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
            notNull: { msg: 'El tipo de orden es obligatorio' },
            isIn: {
                args: [['Pedido', 'Venta']],
                msg: 'El tipo de orden debe ser Pedido o Venta'
            }
        },
        comment: 'Indica si la orden es para un pedido de cliente o para venta directa'
    },

    estado: {
        type: DataTypes.ENUM('Pendiente', 'En Proceso', 'Pausada', 'Finalizada', 'Anulada'),
        allowNull: false,
        defaultValue: 'Pendiente',
        // ⚠️ Sin comment — PostgreSQL lanza error de sintaxis al hacer ALTER TYPE con USING
        //    cuando alter:true intenta agregar el comentario sobre un ENUM ya existente.
    },

    fechaEntrega: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notNull: { msg: 'La fecha de entrega es obligatoria' },
            isDate:  { msg: 'La fecha de entrega debe ser una fecha válida' }
        },
        comment: 'Fecha límite de entrega de la orden'
    },

    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha en que se inició la producción (se asigna automáticamente al pasar a En Proceso)'
    },

    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Fecha en que se finalizó la producción (se asigna automáticamente al Finalizar)'
    },

    nota: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas o instrucciones adicionales'
    },

    motivoAnulacion: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Motivo de anulación — obligatorio cuando estado es Anulada'
    }

}, {
    timestamps: true,
    tableName: 'ordenes_produccion',
    comment: 'Tabla que almacena las órdenes de producción'
});

module.exports = OrdenesProduccion;