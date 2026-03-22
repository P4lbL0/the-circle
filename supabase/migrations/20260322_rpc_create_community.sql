-- RPC transactionnelle pour la création de communauté
-- Remplace les 4-5 INSERT/UPDATE séquentiels de l'onboarding par une seule transaction atomique
-- Sécurité SEC-10 — 22/03/2026

CREATE OR REPLACE FUNCTION create_community_transactional(
  p_owner_id        uuid,
  p_name            text,
  p_slug            text,
  p_community_type  text,
  p_description     text,
  p_logo_url        text,
  p_modules         jsonb,
  p_stat_fields     jsonb,
  p_formula_config  jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_community_id  uuid;
  v_module_key    text;
  v_module_val    boolean;
BEGIN
  -- 1. Créer la communauté (invite_token généré automatiquement par défaut DB)
  INSERT INTO communities (
    owner_id, name, slug, community_type,
    description, logo_url, privacy, onboarding_completed
  )
  VALUES (
    p_owner_id, p_name, p_slug, p_community_type,
    p_description, p_logo_url, 'public', true
  )
  RETURNING id INTO v_community_id;

  -- 2. Ajouter l'owner comme membre
  INSERT INTO community_members (community_id, profile_id, role, is_public)
  VALUES (v_community_id, p_owner_id, 'owner', true);

  -- 3. Activer/désactiver les modules selon le choix de l'owner
  FOR v_module_key, v_module_val IN
    SELECT key, value::boolean FROM jsonb_each_text(p_modules)
  LOOP
    UPDATE features
    SET enabled = v_module_val
    WHERE community_id = v_community_id
      AND module::text = v_module_key;
  END LOOP;

  -- 4. Mettre à jour le schéma de stats
  UPDATE stat_schemas
  SET fields = p_stat_fields, formula_config = p_formula_config
  WHERE community_id = v_community_id;

  RETURN jsonb_build_object('id', v_community_id, 'slug', p_slug);

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION create_community_transactional TO authenticated;
