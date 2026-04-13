const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/jtools_db');
const Role = require('./roles');
const Permisos = require('./permisos');

const RolPermiso = sequelize.define('RolPermiso', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        comment: 'Identificador único de la relación entre rol y permiso'
    },
    rolesId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del rol asociado',
    },

    permisosId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID del permiso asociado'
    }
},
{
    tableName:'rolPermiso',
    timestamps: true
});

module.exports = RolPermiso;





