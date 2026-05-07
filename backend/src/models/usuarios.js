const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/jtools_db');

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
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: null,
    validate: {
    notEmpty: { msg: 'El email no puede estar vacío' },
    isEmail:  { msg: 'El email no tiene un formato válido' },
    contieneArroba(value) {
        if (!value.includes('@')) {
        throw new Error('El email debe contener el símbolo @');
        }
    },
    len: { args: [0, 255], msg: 'El email debe tener máximo 255 caracteres' }
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
    password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: null,
    validate: {
    notEmpty: { msg: 'La contraseña no puede estar vacía' },
    len: { args: [6, 255], msg: 'La contraseña debe tener entre 6 y 255 caracteres' }
    }
}
},  {
tableName: 'usuarios',
timestamps: true
});

module.exports = Usuarios;