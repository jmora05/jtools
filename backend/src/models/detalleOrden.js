const { DataTypes } = require('sequelize'); 
const { sequelize } = require('../config/jtools_db');

const DetalleOrden = sequelize.define('DetalleOrden', { 
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del detalle de la orden'
    },

    productosId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Identificador del producto asociado al detalle'
    },

    ordenProduccionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Identificador de la orden de producción a la que pertenece el detalle'
    },

    step: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Número de paso del proceso de fabricación'
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descripción del proceso de fabricación'
    },

    duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Duración del proceso en minutos'
    },

    responsableId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'empleados', key: 'id' },
        comment: 'Empleado responsable de este proceso específico'
    },

    descripcion: { 
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            len: { args: [0, 255], msg: 'La descripción debe tener como máximo 255 caracteres' }
        },
        comment: 'Descripción adicional sobre el detalle de la orden de producción (campo legacy)'
    }

}, {
    timestamps: true,
    tableName: 'detalle_orden',
    comment: 'Tabla que almacena los detalles de las órdenes de producción'
});

module.exports = DetalleOrden;