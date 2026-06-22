-- Supabase schema for Auto Insta Flow

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id     TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    name            TEXT NOT NULL,
    plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'growth')),
    billing_cycle   TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    stripe_customer_id       TEXT,
    stripe_subscription_id   TEXT,
    dm_quota_monthly         INT NOT NULL DEFAULT 500,
    dm_sent_current_period   INT NOT NULL DEFAULT 0,
    dm_addon_credits         INT NOT NULL DEFAULT 0,
    quota_period_start       TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Instagram accounts table
CREATE TABLE IF NOT EXISTS instagram_accounts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    instagram_user_id TEXT NOT NULL,
    username          TEXT NOT NULL,
    access_token      TEXT NOT NULL,
    token_expires_at  TIMESTAMPTZ,
    token_status      TEXT NOT NULL DEFAULT 'active' CHECK (token_status IN ('active', 'token_invalid', 'revoked')),
    page_id           TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, instagram_user_id)
);

-- Templates table (populated by system)
CREATE TABLE IF NOT EXISTS templates (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    category         TEXT NOT NULL CHECK (category IN ('featured', 'engage_audience', 'sell_earn', 'capture_leads', 'book_clients')),
    trigger_type     TEXT NOT NULL,
    trigger_config   JSONB NOT NULL DEFAULT '{}',
    action_type      TEXT NOT NULL,
    action_config    JSONB NOT NULL DEFAULT '{}',
    is_system        BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order       INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automations table
CREATE TABLE IF NOT EXISTS automations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'paused' CHECK (status IN ('live', 'paused')),
    trigger_type        TEXT NOT NULL CHECK (trigger_type IN ('comment', 'story_reply', 'dm')),
    trigger_config      JSONB NOT NULL DEFAULT '{}',
    action_type         TEXT NOT NULL CHECK (action_type IN ('send_dm', 'email_gate', 'follow_gate')),
    action_config       JSONB NOT NULL DEFAULT '{}',
    dm_sent_count       INT NOT NULL DEFAULT 0,
    link_click_count    INT NOT NULL DEFAULT 0,
    template_id         UUID REFERENCES templates(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automation events table
CREATE TABLE IF NOT EXISTS automation_events (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id    UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    event_type       TEXT NOT NULL CHECK (event_type IN ('dm_sent', 'dm_failed', 'link_clicked', 'email_collected', 'follow_verified', 'dm_blocked_quota', 'dm_blocked_dedup')),
    instagram_user_id TEXT NOT NULL,
    instagram_username TEXT,
    metadata         JSONB DEFAULT '{}',
    occurred_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_events_automation_id ON automation_events(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_events_workspace_id ON automation_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automation_events_occurred_at ON automation_events(occurred_at);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    instagram_user_id TEXT NOT NULL,
    instagram_username TEXT NOT NULL,
    email             TEXT,
    first_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    interaction_count INT NOT NULL DEFAULT 1,
    UNIQUE(workspace_id, instagram_user_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_username ON contacts(instagram_username);

-- Rewind logs table
CREATE TABLE IF NOT EXISTS rewind_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    automation_id    UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    post_id          TEXT NOT NULL,
    comments_found   INT NOT NULL,
    dms_sent         INT NOT NULL,
    status           TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'complete', 'cancelled')),
    initiated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ
);

-- Disable Row Level Security (RLS) on all tables for public development testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE automations DISABLE ROW LEVEL SECURITY;
ALTER TABLE automation_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewind_logs DISABLE ROW LEVEL SECURITY;
