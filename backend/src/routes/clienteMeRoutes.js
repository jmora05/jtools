const express = require('express');
const router  = express.Router();
const { Clientes } = require('../models/index.js');

// GET /api/cliente/me — el cliente obtiene su propia información
router.get('/me', async (req, res) => {
    try {
        const email   = req.usuario?.email;
        if (!email) return res.status(401).json({ message: 'No autenticado' });

        const cliente = await Clientes.findOne({ where: { email } });
        if (!cliente)
            return res.status(404).json({ message: 'Perfil de cliente no encontrado' });

        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el perfil', error: error.message });
    }
});

// PUT /api/cliente/me — el cliente actualiza su propia información
router.put('/me', async (req, res) => {
    try {
        const email   = req.usuario?.email;
        if (!email) return res.status(401).json({ message: 'No autenticado' });

        const cliente = await Clientes.findOne({ where: { email } });
        if (!cliente)
            return res.status(404).json({ message: 'Perfil de cliente no encontrado' });

        // Solo se permiten actualizar estos campos
        const { nombres, apellidos, razon_social, contacto, telefono, email: nuevoEmail, direccion, ciudad } = req.body;

        await cliente.update({
            nombres:      nombres      ?? cliente.nombres,
            apellidos:    apellidos    ?? cliente.apellidos,
            razon_social: razon_social ?? cliente.razon_social,
            contacto:     contacto     ?? cliente.contacto,
            telefono:     telefono     ?? cliente.telefono,
            email:        nuevoEmail   ?? cliente.email,
            direccion:    direccion    ?? cliente.direccion,
            ciudad:       ciudad       ?? cliente.ciudad,
        });

        res.status(200).json({ message: 'Perfil actualizado correctamente', cliente });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el perfil', error: error.message });
    }
});

module.exports = router;
