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
        type: DataTypes.ENUM('CC', 'CE', 'PPT'),
        allowNull: false,
    },

    numeroDocumento: {
        type: DataTypes.STRING(11),
        allowNull: false,
        unique: {
            name: 'unique_numero_documento',
            msg: 'Este número de documento ya existe'
        },
        validate: {
            notEmpty: { msg: 'El número de documento no puede estar vacío' },
            len: { args: [8, 10], msg: 'El número de documento debe tener entre 8 y 10 dígitos' },
            isNumeric: { msg: 'El número de documento solo puede contener dígitos' }
        }
    },

    nombres: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Los nombres no pueden estar vacíos' },
            len: { args: [2, 30], msg: 'Los nombres deben tener entre 2 y 30 caracteres' }
        }
    },

    apellidos: {
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Los apellidos no pueden estar vacíos' },
            len: { args: [2, 30], msg: 'Los apellidos deben tener entre 2 y 30 caracteres' }
        }
    },

    telefono: {
        type: DataTypes.STRING(11),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El teléfono no puede estar vacío' }
        }
    },

    email: {
        type: DataTypes.STRING(30),
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
        type: DataTypes.STRING(30),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El cargo no puede estar vacío' },
            len: { args: [1, 30], msg: 'El cargo debe tener entre 1 y 30 caracteres' }
        }
    },

    area: {
        type: DataTypes.ENUM(
            'Producción',
            'Administración'
        ),
        allowNull: false,
        validate: {
            isIn: {
                args: [['Producción', 'Administración']],
                msg: 'El área seleccionada no es válida'
            }
        }
    },

    direccion: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null
    },

    ciudad: {
        type: DataTypes.STRING(10),
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

    salario: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            notNull: { msg: 'El salario base es obligatorio' },
            isNumeric: { msg: 'El salario debe ser un número válido' },
            min: { args: [1423500], msg: 'El salario no puede ser menor al SMMLV ($1.423.500)' }
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