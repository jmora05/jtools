const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/jtools_db');
const e = require('cors');

const Usuarios = sequelize.define('Usuarios', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único del usuario'
    },

    rolesId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del rol asociado al usuario'
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

    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: null,
        validate: {
            notEmpty: { msg: 'La contraseña no puede estar vacía' },
            len: { args: [6, 50], msg: 'La contraseña debe tener entre 6 y 50 caracteres' }
        }
    }
},
{
    tableName: 'usuarios',
    timestamps: true
});

// RELACIONES


module.exports = Usuarios;