-- =====================================================
-- Gestion dynamique des prix des services Bikawo
-- =====================================================

-- Table des prix par service (slug = identifiant du sous-service)
CREATE TABLE IF NOT EXISTS service_pricing (
  service_slug   TEXT        PRIMARY KEY,
  universe_id    TEXT        NOT NULL,
  service_name   TEXT        NOT NULL,
  client_price   NUMERIC(10, 2) NOT NULL CHECK (client_price >= 0),
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Commentaires
COMMENT ON TABLE  service_pricing              IS 'Prix clients des services, éditables depuis le back-office admin';
COMMENT ON COLUMN service_pricing.service_slug IS 'Slug technique du sous-service (ex: garde-enfants-babysitting)';
COMMENT ON COLUMN service_pricing.universe_id  IS 'Identifiant de l''univers (ex: bika_kids)';
COMMENT ON COLUMN service_pricing.client_price IS 'Prix horaire payé par le client en euros';

-- Index pour récupérer facilement tous les services d'un univers
CREATE INDEX IF NOT EXISTS idx_service_pricing_universe ON service_pricing (universe_id);

-- =====================================================
-- Journal d'audit des changements de prix
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_audit_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  service_slug TEXT        NOT NULL,
  service_name TEXT        NOT NULL,
  universe_id  TEXT        NOT NULL,
  old_price    NUMERIC(10, 2) NOT NULL,
  new_price    NUMERIC(10, 2) NOT NULL,
  changed_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason       TEXT
);

COMMENT ON TABLE pricing_audit_log IS 'Historique complet de tous les changements de prix — non modifiable';

CREATE INDEX IF NOT EXISTS idx_pricing_audit_slug ON pricing_audit_log (service_slug);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_date ON pricing_audit_log (changed_at DESC);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE service_pricing    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_audit_log  ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les prix (frontend public)
CREATE POLICY "public_read_service_pricing"
  ON service_pricing FOR SELECT
  USING (true);

-- Seuls les admins peuvent modifier les prix
CREATE POLICY "admin_write_service_pricing"
  ON service_pricing FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Seuls les admins peuvent lire le journal d'audit
CREATE POLICY "admin_read_pricing_audit"
  ON pricing_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insertions dans le journal uniquement via le service role (Edge Function)
CREATE POLICY "service_role_insert_audit"
  ON pricing_audit_log FOR INSERT
  WITH CHECK (true);
