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
        allowNull: true,
        defaultValue: null
    },
    isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indica si el permiso corresponde a un módulo del sistema (no eliminable)'
    },
    moduleKey: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: 'Clave única del módulo del sistema (ej: dashboard, clients, sales)'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Indica si el permiso está activo'
    }
}, 

{
  tableName: 'permisos',
  timestamps: true
});

module.exports = Permisos;
