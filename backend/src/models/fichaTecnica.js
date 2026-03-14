const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/jtools_db');

const OrdenesProduccion = sequelize.define('OrdenesProduccion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la orden de producción'
    },

    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Identificador del producto asociado a la orden de producción'
    },

    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'La cantidad debe ser al menos 1' }
        },
        comment: 'Cantidad de producto a producir'
    },

    unidadMedida: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La unidad de medida no puede estar vacía' },
            len: { args: [2, 20], msg: 'La unidad de medida debe tener entre 2 y 20 caracteres' }
        },
        comment: 'Unidad de medida para la cantidad a producir'
    },

    fechaCreacion: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Fecha de creación de la orden de producción'
    },

    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            len: { args: [0, 255], msg: 'La descripción debe tener como máximo 255 caracteres' }
        },
        comment: 'Descripción adicional sobre la orden de producción'
    }   
},
{
    timestamps: true,
    tableName: 'ordenes_produccion',
    comment: 'Tabla que almacena las órdenes de producción'
});

// Relaciones


module.exports = OrdenesProduccion;