const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Leer el header Authorization
    const authHeader = req.headers['authorization'];

    // 2. Verificar que existe y tiene el formato "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // 3. Extraer solo el token (quitar la palabra "Bearer ")
    const token = authHeader.split(' ')[1];

    // 4. Verificar que el token sea válido y no haya expirado
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // 5. Guardar los datos del usuario en req para usarlos en el controlador
        req.usuario = decoded; // { id, email, rolesId }
        next(); // dejar pasar al controlador
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

module.exports = { verifyToken };