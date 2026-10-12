-- =============================================================================
-- Stored Procedures para Entidad (esquema app)
-- Garantiza paridad total con lo que espera el frontend (IDataResponse / PaginatedResult)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS app;

-- Tabla base (si no existe)
CREATE TABLE IF NOT EXISTS app.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 1. Listar todos retornando { data, total }
CREATE OR REPLACE FUNCTION app.entity_get_all()
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'data', COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb),
    'total', COUNT(*)
  )
  INTO v_result
  FROM (
    SELECT id, name, created_at, updated_at
    FROM app.entities
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  ) t;

  RETURN COALESCE(v_result, '{"data":[], "total": 0}'::jsonb);
END;
$$;

-- 2. Obtener por ID
CREATE OR REPLACE FUNCTION app.entity_get_by_id(p_id UUID)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT to_jsonb(t) INTO v_result
  FROM (
    SELECT id, name, created_at, updated_at
    FROM app.entities
    WHERE id = p_id AND deleted_at IS NULL
  ) t;

  RETURN v_result;
END;
$$;

-- 3. Crear
CREATE OR REPLACE FUNCTION app.entity_create(p_name VARCHAR)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO app.entities (name)
  VALUES (p_name)
  RETURNING to_jsonb(entities.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- 4. Actualizar
CREATE OR REPLACE FUNCTION app.entity_update(p_id UUID, p_name VARCHAR)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_result jsonb;
BEGIN
  UPDATE app.entities
  SET name = p_name, updated_at = NOW()
  WHERE id = p_id AND deleted_at IS NULL
  RETURNING to_jsonb(entities.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- 5. Eliminar (Soft Delete)
CREATE OR REPLACE FUNCTION app.entity_delete(p_id UUID)
RETURNS jsonb LANGUAGE plpgsql AS $$
BEGIN
  UPDATE app.entities
  SET deleted_at = NOW()
  WHERE id = p_id AND deleted_at IS NULL;

  RETURN jsonb_build_object('deleted', true);
END;
$$;
