const express = require('express');
const router  = express.Router();

const {
  getHorasExtra,
  getHoraExtraById,
  createHoraExtra,
  updateHoraExtra,
  cambiarEstadoHoraExtra,
  deleteHoraExtra,
} = require('../controllers/horasExtraController.js');

const {
  validateCreateHoraExtra,
  validateUpdateHoraExtra,
  validateCambiarEstadoHE,
  validateParamId,
} = require('../validators/horasExtraValidator.js');

router.get('/',                                  getHorasExtra);
router.get('/:id',    validateParamId,           getHoraExtraById);
router.post('/',      validateCreateHoraExtra,   createHoraExtra);
router.put('/:id',    validateParamId, validateUpdateHoraExtra, updateHoraExtra);
router.patch('/:id/estado', validateParamId, validateCambiarEstadoHE, cambiarEstadoHoraExtra);
router.delete('/:id', validateParamId,           deleteHoraExtra);

module.exports = router;
