-- Migración: Cambio de estados en tabla horas_extra
-- De: ENUM('pendiente', 'aprobada')
-- A:  ENUM('registrada', 'aprobada', 'rechazada')
--
-- Ejecutar este script en la base de datos MySQL antes de reiniciar el backend.

-- Paso 1: Renombrar registros 'pendiente' a 'registrada'
UPDATE horas_extra SET estado = 'registrada' WHERE estado = 'pendiente';

-- Paso 2: Modificar la columna para usar los nuevos valores del ENUM
ALTER TABLE horas_extra
  MODIFY COLUMN estado ENUM('registrada', 'aprobada', 'rechazada') NOT NULL DEFAULT 'registrada';
