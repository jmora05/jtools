const bcrypt = require('bcryptjs');
const { Usuarios } = require('./src/models/index.js');

async function crear() {
const hash = await bcrypt.hash('123456', 10);
await Usuarios.create({
rolesId: 1,
email: 'admin@example.com',
password: hash
});
console.log('Usuario creado correctamente');
process.exit(0);
}

crear().catch((err) =>{
console.error('Error al crear el usuario:', err.message);
process.exit(1);
})