const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/jtools_db');

const Insumos = sequelize.define('Insumos', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del insumo'
    },

    nombreInsumo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            name: 'unique_insumo_name',
            msg: 'Este nombre de insumo ya existe'
        },
        validate: {
            notEmpty: { msg: 'El nombre del insumo no puede estar vacío' },
            len: { args: [2, 50], msg: 'El nombre del insumo debe tener entre 2 y 50 caracteres' }
        }
    },

    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: { args: [0, 255], msg: 'La descripción del insumo debe tener máximo 255 caracteres' }
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
    },

    unidadMedida: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La unidad de medida no puede estar vacía' },
            len: { args: [1, 20], msg: 'La unidad de medida debe tener entre 1 y 20 caracteres' }
        }
    },

    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [0], msg: 'La cantidad no puede ser negativa' }
        }
    },

    proveedoresId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },

    estado: {
        type: DataTypes.ENUM('disponible', 'agotado'),
        allowNull: false,
        defaultValue: 'disponible'
    }
},
{
    tableName: 'insumos',
    timestamps: true
});

module.exports = Insumos;