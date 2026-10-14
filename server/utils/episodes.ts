import type { EpisodeView, TrackView, Vote } from '#shared/types'

interface EpisodeRow {
  id: string
  slug: string
  apple_id: number | null
  title: string
  published_at: string
  duration: string
  image: string
  audio_url: string
  acast_url: string
  verified: number
}

interface TrackRow {
  key: string
  episode_id: string
  artist: string
  title: string
  recommended_by: string
  note: string
  at: string
  links: string | null
  up: number
  down: number
  mine: number | null
}

/** Tracks with their vote counts and the current visitor's vote. */
const TRACKS_SQL = /* sql */ `
  SELECT t.*,
    (SELECT COUNT(*) FROM votes v WHERE v.track_key = t.key AND v.value = 1)  AS up,
    (SELECT COUNT(*) FROM votes v WHERE v.track_key = t.key AND v.value = -1) AS down,
    (SELECT v.value FROM votes v WHERE v.track_key = t.key AND v.voter = ?)   AS mine
  FROM tracks t`

const toTrack = (r: TrackRow): TrackView => ({
  key: r.key,
  artist: r.artist,
  title: r.title,
  recommendedBy: r.recommended_by,
  note: r.note,
  at: r.at,
  links: r.links ? JSON.parse(r.links) : null,
  up: r.up,
  down: r.down,
  mine: (r.mine ?? 0) as Vote,
})

const toEpisode = (r: EpisodeRow, tracks: TrackView[]): EpisodeView => ({
  id: r.id,
  slug: r.slug,
  appleId: r.apple_id,
  title: r.title,
  publishedAt: r.published_at,
  duration: r.duration,
  image: r.image,
  audioUrl: r.audio_url,
  acastUrl: r.acast_url,
  verified: r.verified === 1,
  tracks,
})

/** Every episode with its tracks, newest first. */
export function listEpisodes(voter: string | null): EpisodeView[] {
  const tracks = all<TrackRow>(`${TRACKS_SQL} ORDER BY t.episode_id, t.position`, voter)
  return all<EpisodeRow>('SELECT * FROM episodes ORDER BY published_at DESC')
    .map(e => toEpisode(e, tracks.filter(t => t.episode_id === e.id).map(toTrack)))
}

export function findEpisode(slug: string, voter: string | null): EpisodeView | null {
  const e = get<EpisodeRow>('SELECT * FROM episodes WHERE slug = ?', slug)
  if (!e)
    return null
  return toEpisode(e, all<TrackRow>(`${TRACKS_SQL} WHERE t.episode_id = ? ORDER BY t.position`, voter, e.id).map(toTrack))
}
