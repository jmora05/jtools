const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/jtools_db');

const Productos = sequelize.define('Productos', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del producto'
    },

    nombreProducto: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            name: 'unique_product_name',
            msg: 'Este nombre de producto ya existe'
        },
        validate: {
            notEmpty: { msg: 'El nombre del producto no puede estar vacío' },
            len: { args: [2, 100], msg: 'El nombre del producto debe tener entre 2 y 100 caracteres' }
        }
    },

    referencia: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            name: 'unique_product_reference',
            msg: 'Esta referencia de producto ya existe'
        },
        validate: {
            notEmpty: { msg: 'La referencia del producto no puede estar vacía' },
            len: { args: [2, 50], msg: 'La referencia del producto debe tener entre 2 y 50 caracteres' }
        }
    },

    categoriaProductoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de la categoría a la que pertenece el producto'
    },

    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: { args: [0, 255], msg: 'La descripción no puede exceder los 255 caracteres' }
        }
    },

    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notNull: { msg: 'El precio es obligatorio' },
            isDecimal: { msg: 'El precio debe ser un número válido' },
        }
    },

    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: 'El stock es obligatorio' },
            isInt: { msg: 'El stock debe ser un número entero válido' }
        }
    },

    estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
    }
},
{
    tableName: 'productos',
    timestamps: false
});

// RELACIONES
module.exports = Productos;