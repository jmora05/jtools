const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/jtools_db');

const DetalleCompraInsumo = sequelize.define('DetalleCompraInsumo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del detalle de compra de insumo'
    },

    comprasId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de la compra asociada'
    },

    insumosId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del insumo asociado'
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

    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            isDecimal: { msg: 'El precio unitario debe ser un número decimal válido' },
            min: { args: [0], msg: 'El precio unitario no puede ser negativo' } 
        }
    }
},
{
    tableName: 'detalleCompraInsumo',
    timestamps: false

});

// RELACIONES


module.exports = DetalleCompraInsumo;