-- ============================================================
--  World Cup 2026 — Workplace Draft Leaderboard
--  Database schema + seed data
-- ============================================================

-- Drop existing tables if re-running
DROP TABLE IF EXISTS team_progress;
DROP TABLE IF EXISTS draft_picks;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS stages;

-- ── Participants ─────────────────────────────────────────────
CREATE TABLE participants (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO participants (name) VALUES
    ('Jordan McConville'),
    ('Jordan Thorne'),
    ('Connor Jones'),
    ('Eugene Tan'),
    ('Jonathan Budge'),
    ('Jonathan Perry'),
    ('Megan Knowles'),
    ('Kat Shaw'),
    ('Richard Ward'),
    ('Nick Coakley'),
    ('Michael Partridge');

-- ── Stages & points ──────────────────────────────────────────
CREATE TABLE stages (
    key        VARCHAR(20)  PRIMARY KEY,
    label      VARCHAR(50)  NOT NULL,
    points     INT          NOT NULL,
    icon       VARCHAR(10)
);

INSERT INTO stages (key, label, points, icon) VALUES
    ('group',  'Group Stage',   1,  '🏟️'),
    ('r16',    'Round of 16',   2,  '⚔️'),
    ('qf',     'Quarter-Final', 3,  '🔥'),
    ('sf',     'Semi-Final',    5,  '⭐'),
    ('final',  'Final',         8,  '🥈'),
    ('winner', 'Champion',     13,  '🏆');

-- ── Teams ─────────────────────────────────────────────────────
CREATE TABLE teams (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    flag         VARCHAR(10),
    confederation VARCHAR(20) NOT NULL
);

INSERT INTO teams (name, flag, confederation) VALUES
    ('United States',  '🇺🇸', 'Host'),
    ('Canada',         '🇨🇦', 'Host'),
    ('Mexico',         '🇲🇽', 'Host'),
    ('England',        '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UEFA'),
    ('France',         '🇫🇷', 'UEFA'),
    ('Spain',          '🇪🇸', 'UEFA'),
    ('Germany',        '🇩🇪', 'UEFA'),
    ('Portugal',       '🇵🇹', 'UEFA'),
    ('Netherlands',    '🇳🇱', 'UEFA'),
    ('Belgium',        '🇧🇪', 'UEFA'),
    ('Croatia',        '🇭🇷', 'UEFA'),
    ('Switzerland',    '🇨🇭', 'UEFA'),
    ('Austria',        '🇦🇹', 'UEFA'),
    ('Scotland',       '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'UEFA'),
    ('Norway',         '🇳🇴', 'UEFA'),
    ('Türkiye',        '🇹🇷', 'UEFA'),
    ('Sweden',         '🇸🇪', 'UEFA'),
    ('Czechia',        '🇨🇿', 'UEFA'),
    ('Bosnia & Herz.', '🇧🇦', 'UEFA'),
    ('Argentina',      '🇦🇷', 'CONMEBOL'),
    ('Brazil',         '🇧🇷', 'CONMEBOL'),
    ('Uruguay',        '🇺🇾', 'CONMEBOL'),
    ('Colombia',       '🇨🇴', 'CONMEBOL'),
    ('Ecuador',        '🇪🇨', 'CONMEBOL'),
    ('Paraguay',       '🇵🇾', 'CONMEBOL'),
    ('Morocco',        '🇲🇦', 'CAF'),
    ('Senegal',        '🇸🇳', 'CAF'),
    ('Egypt',          '🇪🇬', 'CAF'),
    ('Algeria',        '🇩🇿', 'CAF'),
    ('Ghana',          '🇬🇭', 'CAF'),
    ('Côte d''Ivoire', '🇨🇮', 'CAF'),
    ('Tunisia',        '🇹🇳', 'CAF'),
    ('South Africa',   '🇿🇦', 'CAF'),
    ('Cabo Verde',     '🇨🇻', 'CAF'),
    ('DR Congo',       '🇨🇩', 'CAF'),
    ('Japan',          '🇯🇵', 'AFC'),
    ('South Korea',    '🇰🇷', 'AFC'),
    ('Iran',           '🇮🇷', 'AFC'),
    ('Saudi Arabia',   '🇸🇦', 'AFC'),
    ('Australia',      '🇦🇺', 'AFC'),
    ('Qatar',          '🇶🇦', 'AFC'),
    ('Jordan',         '🇯🇴', 'AFC'),
    ('Uzbekistan',     '🇺🇿', 'AFC'),
    ('Iraq',           '🇮🇶', 'AFC'),
    ('Panama',         '🇵🇦', 'CONCACAF'),
    ('Honduras',       '🇭🇳', 'CONCACAF'),
    ('Jamaica',        '🇯🇲', 'CONCACAF'),
    ('New Zealand',    '🇳🇿', 'OFC');

-- ── Draft picks (participant → team allocation) ───────────────
-- Populated after the draw is run; this is the schema.
CREATE TABLE draft_picks (
    id              SERIAL PRIMARY KEY,
    participant_id  INT REFERENCES participants(id) ON DELETE CASCADE,
    team_id         INT REFERENCES teams(id)        ON DELETE CASCADE,
    is_bonus        BOOLEAN NOT NULL DEFAULT FALSE,
    drawn_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (participant_id, team_id)
);

-- ── Team progress ─────────────────────────────────────────────
-- One row per team per stage they've reached.
CREATE TABLE team_progress (
    id           SERIAL PRIMARY KEY,
    team_id      INT     REFERENCES teams(id)  ON DELETE CASCADE,
    stage_key    VARCHAR(20) REFERENCES stages(key) ON DELETE CASCADE,
    reached_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, stage_key)
);

-- ── Leaderboard view ─────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    p.id                                    AS participant_id,
    p.name                                  AS participant_name,
    COALESCE(SUM(s.points), 0)              AS total_points,
    RANK() OVER (ORDER BY COALESCE(SUM(s.points), 0) DESC) AS position
FROM participants p
LEFT JOIN draft_picks dp  ON dp.participant_id = p.id
LEFT JOIN team_progress tp ON tp.team_id      = dp.team_id
LEFT JOIN stages s         ON s.key           = tp.stage_key
GROUP BY p.id, p.name
ORDER BY total_points DESC;

-- ── Example: query the leaderboard ───────────────────────────
-- SELECT position, participant_name, total_points FROM leaderboard;
