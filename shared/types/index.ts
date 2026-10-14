/** Streaming links: Apple Music (iTunes Search) + the song.link page for every platform. */
export interface Links {
  pageUrl: string
  artwork: string | null
  /** Direct links by platform (appleMusic for now) */
  platforms: Record<string, string>
}

export interface Track {
  artist: string
  title: string
  recommendedBy: string
  /** Why the host recommends it — the "conseil". */
  note: string
  /** "m:ss" in the episode. */
  at: string
  links: Links | null
}

export interface Episode {
  /** Acast GUID */
  id: string
  slug: string
  appleId: number | null
  title: string
  publishedAt: string
  duration: string
  image: string
  audioUrl: string
  acastUrl: string
  /** A listener checked the tracklist against the episode. */
  verified?: boolean
  tracks: Track[]
}

export type Vote = -1 | 0 | 1

/** A track as served by the API: stable key + votes. */
export interface TrackView extends Track {
  key: string
  up: number
  down: number
  /** The current visitor's vote. */
  mine: Vote
}

export interface EpisodeView extends Omit<Episode, 'tracks'> {
  verified: boolean
  tracks: TrackView[]
}
