const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/jtools_db');


const Permisos = sequelize.define('Permisos', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del permiso                                           '
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            name: 'unique_permiso_name',
            msg: 'Este nombre de permiso ya existe'
        },
        validate: {
            notEmpty: { msg: 'El nombre del permiso no puede estar vacío' },
            len: { args: [2, 50], msg: 'El nombre debe tener entre 2 y 50 caracteres' }
        }
    },
    description: {
        type: DataTypes.STRING(200),
        allowNull: true,  // campo opcional
        defaultValue: null
    }
}, 

{
  tableName: 'permisos',   // nombre exacto de la tabla en MySQL
  timestamps: true      // agrega createdAt y updatedAt automáticamente
});

module.exports = Permisos;
