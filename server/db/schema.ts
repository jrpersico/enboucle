/**
 * Read model of `data/episodes/*.json` — dropped and rebuilt at every startup,
 * so its columns can change freely.
 */
export const CONTENT_SCHEMA = /* sql */ `
DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS episodes;

CREATE TABLE episodes (
  id           TEXT PRIMARY KEY,
  slug         TEXT    NOT NULL UNIQUE,
  apple_id     INTEGER,
  title        TEXT    NOT NULL,
  published_at TEXT    NOT NULL,
  duration     TEXT    NOT NULL DEFAULT '',
  image        TEXT    NOT NULL DEFAULT '',
  audio_url    TEXT    NOT NULL DEFAULT '',
  acast_url    TEXT    NOT NULL DEFAULT '',
  verified     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tracks (
  key            TEXT PRIMARY KEY, -- stable across reloads, referenced by votes
  episode_id     TEXT    NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  position       INTEGER NOT NULL,
  artist         TEXT    NOT NULL,
  title          TEXT    NOT NULL,
  recommended_by TEXT    NOT NULL DEFAULT '',
  note           TEXT    NOT NULL DEFAULT '',
  at             TEXT    NOT NULL DEFAULT '',
  links          TEXT -- JSON (Links) or NULL
);

CREATE INDEX idx_tracks_episode ON tracks(episode_id, position);
`

/** Data written by visitors — kept across restarts. */
export const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS votes (
  track_key  TEXT    NOT NULL,
  voter      TEXT    NOT NULL, -- anonymous cookie id
  value      INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TEXT    NOT NULL,
  PRIMARY KEY (track_key, voter)
);

CREATE TABLE IF NOT EXISTS reports (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  kind       TEXT NOT NULL, -- 'error' | 'verified'
  episode_id TEXT NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  author     TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
`
