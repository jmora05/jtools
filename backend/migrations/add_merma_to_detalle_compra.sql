-- Migración: registrar merma por ítem de compra
-- Ejecutar una sola vez en la base de datos antes de iniciar el servidor.
-- Agrega la columna cantidadMerma a detalleCompraInsumo para rastrear
-- la cantidad defectuosa/mermada por línea de compra.

ALTER TABLE "detalleCompraInsumo"
ADD COLUMN IF NOT EXISTS "cantidadMerma" DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN "detalleCompraInsumo"."cantidadMerma"
    IS 'Cantidad mermada (defectuosa) descontada del inventario para este ítem de compra';
