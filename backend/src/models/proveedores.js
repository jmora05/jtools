const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/jtools_db');

const Proveedores = sequelize.define('Proveedores', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del proveedor'
    },

    nombreEmpresa: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            name: 'unique_nombre_empresa',
            msg: 'Este nombre de empresa ya existe'
        },
        validate: {
            notEmpty: { msg: 'El nombre de la empresa no puede estar vacío' },
            len: { args: [2, 100], msg: 'El nombre de la empresa debe tener entre 2 y 100 caracteres' }
        }
    },

    tipoDocumento: {
        type: DataTypes.ENUM('CC', 'NIT', 'RUN'),
        allowNull: false
    },

    numeroDocumento: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: {
            name: 'unique_numero_documento',
            msg: 'Este número de documento ya existe'
        },
        validate: {
            notEmpty: { msg: 'El número de documento no puede estar vacío' },
            len: { args: [2, 20], msg: 'El número de documento debe tener entre 2 y 20 caracteres' }
        }
    },

    personaContacto: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre de la persona de contacto no puede estar vacío' },
            len: { args: [2, 100], msg: 'El nombre de la persona de contacto debe tener entre 2 y 100 caracteres' }
        }
    },

    telefono: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El teléfono no puede estar vacío' },
            len: { args: [2, 10], msg: 'El teléfono debe tener entre 2 y 10 caracteres' }
        }
    },

    email: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: null,
        validate: {
            notEmpty: { msg: 'El email no puede estar vacío' },
            isEmail: { msg: 'El email no tiene un formato válido' },
            contieneArroba(value) {
                if (!value.includes('@')) {
                    throw new Error('El email debe contener el símbolo @');
                }
            },
            len: { args: [0, 50], msg: 'El email debe tener máximo 50 caracteres' }
        }
    },

    direccion: {
        type: DataTypes.STRING(200),
        allowNull: true,  // campo opcional
        defaultValue: null
    },

    ciudad: {
        type: DataTypes.STRING(50),
        allowNull: true,  // campo opcional
        defaultValue: null
    },

    estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
    }

},
{
    tableName: 'proveedores',
    timestamps: true,
    comment: 'Tabla que almacena los proveedores de la empresa'

});

module.exports = Proveedores;