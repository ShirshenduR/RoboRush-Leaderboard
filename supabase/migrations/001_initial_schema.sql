-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name TEXT NOT NULL UNIQUE,
    score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disqualified')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_score_update TIMESTAMPTZ
);

-- Create index on score for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_teams_score ON teams(score DESC, team_name ASC);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create score history table for audit trail
CREATE TABLE IF NOT EXISTS score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    old_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_score_history_team_id ON score_history(team_id, changed_at DESC);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams table (read-only for public)
CREATE POLICY "Teams are viewable by everyone"
    ON teams FOR SELECT
    USING (true);

-- RLS Policies for admins table (no public access)
CREATE POLICY "Admins are not publicly viewable"
    ON admins FOR SELECT
    USING (false);

-- RLS Policies for score_history table (no public access)
CREATE POLICY "Score history is not publicly viewable"
    ON score_history FOR SELECT
    USING (false);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for teams table
ALTER PUBLICATION supabase_realtime ADD TABLE teams;

-- Insert sample teams (optional - for testing)
INSERT INTO teams (team_name, score, status) VALUES
    ('RoboWarriors', 0, 'active'),
    ('Circuit Breakers', 0, 'active'),
    ('MechMasters', 0, 'active'),
    ('Volt Vikings', 0, 'active'),
    ('Gear Giants', 0, 'active'),
    ('TechTitans', 0, 'active'),
    ('Bot Builders', 0, 'active'),
    ('ElectroKnights', 0, 'active')
ON CONFLICT (team_name) DO NOTHING;
