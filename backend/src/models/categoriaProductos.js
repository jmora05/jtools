const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/jtools_db');

const CategoriaProductos = sequelize.define('CategoriaProductos', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la categoría de producto'
    },

    nombreCategoria: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            name: 'unique_category_name',
            msg: 'Este nombre de categoría ya existe'
        },
        validate: {
            notEmpty: { msg: 'El nombre de la categoría no puede estar vacío' },
            len: { args: [2, 50], msg: 'El nombre de la categoría debe tener entre 2 y 50 caracteres' }
        }
    },

    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: { args: [0, 255], msg: 'La descripción no puede exceder los 255 caracteres' }
        }
    }
},
{
    tableName:'categoriaProductos',
    timestamps: false
        

});

module.exports =  CategoriaProductos;