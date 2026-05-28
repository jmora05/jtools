-- Ejecutar este script si el servidor falla al iniciar por errores en constraints de novedades.
-- Es seguro correrlo múltiples veces (usa IF EXISTS en todos los pasos).

-- 1. Eliminar columna registrado_por si aún existe
ALTER TABLE novedades DROP COLUMN IF EXISTS registrado_por;

-- 2. Eliminar FK constraints huérfanas si existen
ALTER TABLE novedades DROP CONSTRAINT IF EXISTS "novedades_registrado_por_fkey";
ALTER TABLE novedades DROP CONSTRAINT IF EXISTS "novedades_empleado_responsable_fkey";

-- 3. Migrar valores de estado que no correspondan al nuevo ENUM
UPDATE novedades SET estado = 'registrada' WHERE estado NOT IN ('registrada', 'aprobada_remunera', 'aprobada_sin_remuneracion', 'rechazada');

-- 4. Re-crear el tipo ENUM con los valores correctos (si aún tiene valores viejos)
DO $$
BEGIN
    ALTER TABLE novedades ALTER COLUMN estado TYPE TEXT;
    DROP TYPE IF EXISTS "public"."enum_novedades_estado";
    CREATE TYPE "public"."enum_novedades_estado" AS ENUM('registrada', 'aprobada_remunera', 'aprobada_sin_remuneracion', 'rechazada');
    ALTER TABLE novedades ALTER COLUMN estado TYPE "public"."enum_novedades_estado" USING estado::"public"."enum_novedades_estado";
    ALTER TABLE novedades ALTER COLUMN estado SET DEFAULT 'registrada';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error al re-crear ENUM (puede ignorarse si ya estaba correcto): %', SQLERRM;
END $$;
