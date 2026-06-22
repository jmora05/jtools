const { Usuarios, Clientes, Empleados } = require('../models/index.js');

/**
 * Propaga un cambio de email a las demás tablas vinculadas por email
 * (Usuarios, Clientes, Empleados no tienen FK real entre sí — el vínculo
 * es el email compartido). Debe llamarse DENTRO de la misma transacción
 * que ya hizo el UPDATE en la tabla de origen, pasando esa tabla en `skip`
 * para no duplicar el UPDATE.
 *
 * Si emailNuevo ya existe en alguna tabla, Sequelize lanza
 * SequelizeUniqueConstraintError, que se propaga sin capturar para que el
 * try/catch del controlador llamante haga rollback de toda la transacción.
 */
async function sincronizarEmailEnTablasRelacionadas(emailAnterior, emailNuevo, transaction, options = {}) {
    if (!emailAnterior || !emailNuevo || emailAnterior === emailNuevo) return;
    const skip = options.skip || [];

    if (!skip.includes('usuarios')) {
        await Usuarios.update({ email: emailNuevo }, { where: { email: emailAnterior }, transaction });
    }
    if (!skip.includes('clientes')) {
        await Clientes.update({ email: emailNuevo }, { where: { email: emailAnterior }, transaction });
    }
    if (!skip.includes('empleados')) {
        await Empleados.update({ email: emailNuevo }, { where: { email: emailAnterior }, transaction });
    }
}

module.exports = { sincronizarEmailEnTablasRelacionadas };
