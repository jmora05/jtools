    const { DataTypes } = require('sequelize');
    const { sequelize } = require('../config/jtools_db');

    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: 'Identificador único del rol'
        },

        name: {
            type: DataTypes.STRING(50), // ✅ STRING en vez de VARCHAR (Sequelize no tiene VARCHAR)
            allowNull: false,
            unique: {
                name: 'unique_role_name',
                msg: 'Este nombre de rol ya existe'
            },
            validate: {
                notEmpty: { msg: 'El nombre del rol no puede estar vacío' },
                len: { args: [2, 50], msg: 'El nombre debe tener entre 2 y 50 caracteres' }
            }
        },

        description: {
            type: DataTypes.STRING(200),
            allowNull: true,
            defaultValue: null
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Indica si el rol está activo'
        }

    }, {
        tableName: 'roles',
        timestamps: true
    });

    module.exports = Role;