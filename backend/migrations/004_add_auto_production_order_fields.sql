-- Migration: Add fields for auto-generated production orders from pedidos
-- Date: 2025-01-XX
-- Description: Adds insumosCalculados to ordenes_produccion and process fields to detalle_orden

-- 1. Add insumosCalculados field to ordenes_produccion
ALTER TABLE ordenes_produccion 
ADD COLUMN IF NOT EXISTS "insumosCalculados" JSONB DEFAULT '[]';

COMMENT ON COLUMN ordenes_produccion."insumosCalculados" IS 'Insumos calculados para esta orden [{name, quantity, unit}]';

-- 2. Add process fields to detalle_orden
ALTER TABLE detalle_orden 
ADD COLUMN IF NOT EXISTS step INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS "responsableId" INTEGER REFERENCES empleados(id);

COMMENT ON COLUMN detalle_orden.step IS 'Número de paso del proceso de fabricación';
COMMENT ON COLUMN detalle_orden.description IS 'Descripción del proceso de fabricación';
COMMENT ON COLUMN detalle_orden.duration IS 'Duración del proceso en minutos';
COMMENT ON COLUMN detalle_orden."responsableId" IS 'Empleado responsable de este proceso específico';
