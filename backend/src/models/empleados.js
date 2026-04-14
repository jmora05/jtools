const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

const Empleados = sequelize.define('Empleados', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del empleado'
    },

    tipoDocumento: {
        type: DataTypes.ENUM('CC', 'CE', 'Pasaporte'),
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
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El teléfono no puede estar vacío' },
            len: { args: [7, 20], msg: 'El teléfono debe tener entre 7 y 20 caracteres' }
        }
    },

    email: {
        type: DataTypes.STRING(50),
        allowNull: false,
        // ✅ Eliminado defaultValue: null (contradecía allowNull: false)
        unique: {
            name: 'unique_email_empleado',
            msg: 'Este correo ya está registrado en otro empleado'
        },
        validate: {
            notEmpty: { msg: 'El email no puede estar vacío' },
            isEmail: { msg: 'El email no tiene un formato válido' },
            len: { args: [5, 50], msg: 'El email debe tener entre 5 y 50 caracteres' }
        }
    },

    cargo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El cargo no puede estar vacío' },
            len: { args: [1, 100], msg: 'El cargo debe tener entre 1 y 100 caracteres' }
        }
    },

    area: {
        type: DataTypes.ENUM(
            'Producción',
            'Calidad',
            'Logística',
            'Mantenimiento',
            'Administración'
        ),
        allowNull: false,
        validate: {
            isIn: {
                args: [['Producción', 'Calidad', 'Logística', 'Mantenimiento', 'Administración']],
                msg: 'El área seleccionada no es válida'
            }
        }
    },

    direccion: {
        type: DataTypes.STRING(200),
        allowNull: true,
        defaultValue: null
    },

    ciudad: {
        type: DataTypes.STRING(50),
        allowNull: true,
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