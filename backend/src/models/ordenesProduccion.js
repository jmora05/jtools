const { DataTypes } = require('sequelize'); // ✅ quitado 'or' que no se usa
const { sequelize } = require('../config/jtools_db');

const DetalleOrden = sequelize.define('DetalleOrden', { // ✅ nombre correcto
    id: {
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

    descripcion: { // ✅ typo corregido
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            len: { args: [0, 255], msg: 'La descripción debe tener como máximo 255 caracteres' }
        },
        comment: 'Descripción adicional sobre el detalle de la orden de producción'
    }

}, {
    timestamps: true,
    tableName: 'detalle_orden',
    comment: 'Tabla que almacena los detalles de las órdenes de producción'
});

module.exports = DetalleOrden; // ✅ nombre correcto