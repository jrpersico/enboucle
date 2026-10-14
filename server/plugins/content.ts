import type { Episode } from '#shared/types'
import { CONTENT_SCHEMA, SCHEMA } from '../db/schema'

/** Votes point at this key, so it must survive reloads and reordering. */
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const trackKey = (episodeId: string, artist: string, title: string) =>
  `${episodeId}:${norm(artist)}:${norm(title)}`

// Create the tables and (re)load the bundled episode JSON files at startup.
// The JSON files are the source of truth: the content tables are rebuilt.
export default defineNitroPlugin(async () => {
  try {
    db().exec(SCHEMA)

    const storage = useStorage('assets:episodes')
    const keys = (await storage.getKeys()).filter(k => k.endsWith('.json'))
    const episodes = await Promise.all(keys.map(k => storage.getItem<Episode>(k)))

    db().exec('BEGIN')
    db().exec(CONTENT_SCHEMA)
    for (const ep of episodes) {
      if (!ep)
        continue
      run(
        `INSERT INTO episodes (id, slug, apple_id, title, published_at, duration, image, audio_url, acast_url, verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ep.id, ep.slug, ep.appleId, ep.title, ep.publishedAt, ep.duration, ep.image, ep.audioUrl, ep.acastUrl, ep.verified ? 1 : 0,
      )
      ep.tracks.forEach((t, i) => run(
        `INSERT INTO tracks (key, episode_id, position, artist, title, recommended_by, note, at, links)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        trackKey(ep.id, t.artist, t.title), ep.id, i + 1, t.artist, t.title, t.recommendedBy, t.note, t.at, t.links ? JSON.stringify(t.links) : null,
      ))
    }
    db().exec('COMMIT')
    console.log(`[db] ${episodes.length} épisodes chargés`)
  }
  catch (err) {
    if (db().isTransaction)
      db().exec('ROLLBACK')
    console.error('[db] content load failed', err)
  }
})
