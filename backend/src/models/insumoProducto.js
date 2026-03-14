const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/jtools_db');

const InsumoProducto = sequelize.define('InsumoProducto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la relación entre insumo y producto'
    },

    insumosId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del insumo asociado'
    },

    productosId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del producto asociado'
    },

    cantidad: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            isDecimal: { msg: 'La cantidad debe ser un número decimal válido' },
            min: { args: [0], msg: 'La cantidad no puede ser negativa' }
        }
    },

    unidadMedida: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La unidad de medida no puede estar vacía' },
            len: { args: [1, 20], msg: 'La unidad de medida debe tener entre 1 y 20 caracteres' }
        }
    }
},
{
    tableName: 'insumoProducto',
    timestamps: false
});


// RELACIONES

module.exports = InsumoProducto;