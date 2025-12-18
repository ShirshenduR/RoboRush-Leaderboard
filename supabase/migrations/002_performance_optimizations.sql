-- Additional performance optimizations

-- Enable parallel query execution
ALTER TABLE teams SET (parallel_workers = 4);
ALTER TABLE score_history SET (parallel_workers = 2);

-- Add materialized view for leaderboard (optional, for ultra-high load)
CREATE MATERIALIZED VIEW leaderboard_cache AS
SELECT 
    id,
    team_name,
    score,
    status,
    last_score_update,
    ROW_NUMBER() OVER (ORDER BY score DESC, team_name ASC) as rank
FROM teams
WHERE status = 'active'
ORDER BY score DESC, team_name ASC;

CREATE UNIQUE INDEX ON leaderboard_cache (id);
CREATE INDEX ON leaderboard_cache (rank);

-- Function to refresh materialized view (call after score updates if using)
CREATE OR REPLACE FUNCTION refresh_leaderboard_cache()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Auto-refresh trigger (may add slight latency to updates)
-- CREATE TRIGGER refresh_leaderboard_on_score_change
--     AFTER INSERT OR UPDATE OR DELETE ON teams
--     FOR EACH STATEMENT
--     EXECUTE FUNCTION refresh_leaderboard_cache();

-- Vacuum and analyze for optimal query planning
VACUUM ANALYZE teams;
VACUUM ANALYZE score_history;
