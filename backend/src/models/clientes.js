const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');
 
const Clientes = sequelize.define('Clientes', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del cliente'
    },
 
    razon_social: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: { args: [0, 100], msg: 'La razón social debe tener máximo 100 caracteres' }
        }
    },
 
    tipo_documento: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notNull:  { msg: 'El tipo de documento es obligatorio' },
            notEmpty: { msg: 'El tipo de documento no puede estar vacío' },
            isIn: {
                args: [['cedula', 'nit', 'cedula de extranjeria', 'pasaporte', 'rut']],
                msg: 'Tipo de documento no válido. Use: cedula, nit, cedula de extranjeria, pasaporte, rut'
            }
        }
    },
 
    numero_documento: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: {
            name: 'unique_numero_documento',
            msg: 'Este número de documento ya está registrado'
        },
        validate: {
            notNull:  { msg: 'El número de documento es obligatorio' },
            notEmpty: { msg: 'El número de documento no puede estar vacío' },
            len: { args: [5, 20], msg: 'El número de documento debe tener entre 5 y 20 caracteres' }
        }
    },
 
    nombres: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notNull:  { msg: 'El nombre es obligatorio' },
            notEmpty: { msg: 'El nombre no puede estar vacío' },
            len: { args: [2, 50], msg: 'El nombre debe tener entre 2 y 50 caracteres' },
            soloLetras(value) {
                if (value === 'N/A') return; // ← excepción para clientes tipo Empresa
                if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(value)) {
                    throw new Error('El nombre solo puede contener letras y espacios');
                }
            }
        }
    },
 
    apellidos: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notNull:  { msg: 'El apellido es obligatorio' },
            notEmpty: { msg: 'El apellido no puede estar vacío' },
            len: { args: [2, 50], msg: 'El apellido debe tener entre 2 y 50 caracteres' },
            soloLetras(value) {
                if (value === 'N/A') return; // ← excepción para clientes tipo Empresa
                if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(value)) {
                    throw new Error('El apellido solo puede contener letras y espacios');
                }
            }
        }
    },

    // ── NUEVO: Persona de contacto para clientes tipo Empresa ──────────
    contacto: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: { args: [0, 100], msg: 'El contacto debe tener máximo 100 caracteres' },
            soloLetras(value) {
                if (!value) return;
                if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(value)) {
                    throw new Error('El nombre de contacto solo puede contener letras y espacios');
                }
            }
        }
    },
 
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notNull:  { msg: 'El teléfono es obligatorio' },
            notEmpty: { msg: 'El teléfono no puede estar vacío' },
            len: { args: [7, 20], msg: 'El teléfono debe tener entre 7 y 20 caracteres' },
            soloNumerosYGuiones(value) {
                if (!/^[0-9\s\-\+]+$/.test(value)) {
                    throw new Error('El teléfono solo puede contener números, espacios, guiones o el signo +');
                }
            }
        }
    },
 
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            name: 'unique_email_cliente',
            msg: 'Este email ya está registrado'
        },
        validate: {
            notNull:  { msg: 'El email es obligatorio' },
            notEmpty: { msg: 'El email no puede estar vacío' },
            isEmail:  { msg: 'El email no tiene un formato válido' },
            len: { args: [5, 100], msg: 'El email debe tener entre 5 y 100 caracteres' }
        }
    },
 
    direccion: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
        validate: {
            len: { args: [0, 100], msg: 'La dirección debe tener máximo 100 caracteres' }
        }
    },
 
    ciudad: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notNull:  { msg: 'La ciudad es obligatoria' },
            notEmpty: { msg: 'La ciudad no puede estar vacía' },
            len: { args: [2, 50], msg: 'La ciudad debe tener entre 2 y 50 caracteres' }
        }
    },
 
    estado: {
        type: DataTypes.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo',
        validate: {
            isIn: {
                args: [['activo', 'inactivo']],
                msg: 'El estado debe ser activo o inactivo'
            }
        }
    },
 
    
}, {
    tableName: 'clientes',
    timestamps: true
});
 
module.exports = Clientes;