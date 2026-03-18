const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/jtools_db');

const Empleados = sequelize.define('Empleados', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del empleado'
    },

    tipoDocumento: {
        type: DataTypes.ENUM('CC', 'CE', 'RUN', 'PP'),
        allowNull: false,
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

    nombres: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Los nombres no pueden estar vacíos' },
            len: { args: [2, 100], msg: 'Los nombres deben tener entre 2 y 100 caracteres' }
        }
    },

    apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Los apellidos no pueden estar vacíos' },
            len: { args: [2, 100], msg: 'Los apellidos deben tener entre 2 y 100 caracteres' }
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

    cargo: {
        type: DataTypes.ENUM('Administrador', 'secretaria', 'Operario'),
        allowNull: false
    },

    area: {
        type: DataTypes.ENUM('Administrativa', 'Operativa', 'ventas'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['Administrativa', 'Operativa', 'ventas']],
                msg: 'El área seleccionada no es válida'
            }
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

    fechaIngreso: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de ingreso no puede estar vacía' },
            isDate: { msg: 'La fecha de ingreso debe tener un formato válido (YYYY-MM-DD)' }
        }

    },


    estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
    }
},
{
    tableName: 'empleados',
    timestamps: false
});

module.exports = Empleados;