/**
 * En boucle — content pipeline. Node only, zero dependencies.
 *
 *   node scripts/sync.ts
 *
 * 1. RSS (Acast)          → one `data/episodes/<slug>.json` per "En boucle" episode
 * 2. Apple Podcasts caches (TTML assets or HTTP cache) → `.data/transcripts/<slug>.txt`
 *    (open the episode's transcript once in Podcasts.app on this Mac to cache it)
 * 3. Claude               → the tracks + the hosts' advice (needs ANTHROPIC_API_KEY)
 * 4. iTunes Search → Apple Music link + song.link page (every platform)
 *
 * Every step only fills what is missing, so the JSON files can be fixed by hand.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { Episode, Links, Track } from '../shared/types/index.ts'

const FEED = 'https://feeds.acast.com/public/shows/5da08828389f426b625eef25'
const APPLE_SHOW_ID = 1483918693
const APPLE_TTML = join(homedir(), 'Library/Group Containers/243LU875E5.groups.com.apple.podcasts/Library/Cache/Assets/TTML')
const APPLE_HTTP_CACHE = join(homedir(), 'Library/Containers/com.apple.podcasts/Data/Library/Caches/com.apple.podcasts')
const EPISODES_DIR = 'data/episodes'
const TRANSCRIPTS_DIR = '.data/transcripts'

mkdirSync(EPISODES_DIR, { recursive: true })
mkdirSync(TRANSCRIPTS_DIR, { recursive: true })

const pathOf = (slug: string) => join(EPISODES_DIR, `${slug}.json`)
const save = (ep: Episode) => writeFileSync(pathOf(ep.slug), `${JSON.stringify(ep, null, 2)}\n`)

const decode = (s: string) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const tag = (xml: string, name: string) => decode(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? '').trim()
const attr = (xml: string, name: string, key: string) => xml.match(new RegExp(`<${name}[^>]*\\s${key}="([^"]*)"`))?.[1] ?? ''

// ---------- 1. RSS ----------
async function syncFeed(): Promise<Episode[]> {
  const xml = await (await fetch(FEED)).text()
  const lookup = await itunes(`https://itunes.apple.com/lookup?id=${APPLE_SHOW_ID}&entity=podcastEpisode&limit=200&country=fr`)
  const appleIds = new Map<string, number>(lookup.results.filter((r: any) => r.episodeGuid).map((r: any) => [r.episodeGuid, r.trackId]))

  const episodes: Episode[] = []
  for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = tag(item!, 'title')
    if (!/^en boucle/i.test(title))
      continue
    const id = tag(item!, 'guid')
    const link = tag(item!, 'link')
    const slug = link.split('/').pop()!
    const existing: Episode | null = existsSync(pathOf(slug)) ? JSON.parse(readFileSync(pathOf(slug), 'utf8')) : null
    const ep: Episode = {
      id,
      slug,
      appleId: appleIds.get(id) ?? existing?.appleId ?? null,
      title,
      publishedAt: new Date(tag(item!, 'pubDate')).toISOString(),
      duration: tag(item!, 'itunes:duration'),
      image: attr(item!, 'itunes:image', 'href'),
      audioUrl: attr(item!, 'enclosure', 'url'),
      acastUrl: link,
      tracks: existing?.tracks ?? [],
    }
    save(ep)
    episodes.push(ep)
  }
  console.log(`RSS: ${episodes.length} épisodes « En boucle »`)
  return episodes
}

// ---------- 2. Transcript (Apple Podcasts cache) ----------
const clock = (s: string) => {
  const sec = s.split(':').reduce((acc, p) => acc * 60 + Number(p), 0)
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`
}

/** TTML → "[m:ss] SPEAKER_1: sentence…" lines, one per paragraph. */
function ttmlToText(ttml: string): string {
  return [...ttml.matchAll(/<p begin="([^"]+)"[^>]*ttm:agent="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g)]
    .map(([, begin, speaker, body]) => {
      const words = [...body!.matchAll(/podcasts:unit="word"[^>]*>([^<]*)</g)].map(m => decode(m[1]!))
      return `[${clock(begin!)}] ${speaker}: ${words.join(' ')}`
    })
    .join('\n')
}

/** TTML file Podcasts.app moved to its assets folder. */
function findTtmlAsset(appleId: number): string | null {
  const walk = (dir: string): string | null => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name)
      if (e.isDirectory()) {
        const hit = walk(p)
        if (hit)
          return hit
      }
      else if (e.name.startsWith(`transcript_${appleId}.`)) {
        return p
      }
    }
    return null
  }
  const file = existsSync(APPLE_TTML) ? walk(APPLE_TTML) : null
  return file ? readFileSync(file, 'utf8') : null
}

/** TTML still sitting in Podcasts.app's HTTP cache (Cache.db + fsCachedData). */
function findTtmlInHttpCache(appleId: number): string | null {
  if (!existsSync(join(APPLE_HTTP_CACHE, 'Cache.db')))
    return null
  const cache = new DatabaseSync(join(APPLE_HTTP_CACHE, 'Cache.db'), { readOnly: true })
  const rows = cache.prepare(`
    SELECT d.isDataOnFS AS onFs, d.receiver_data AS data
    FROM cfurl_cache_response r JOIN cfurl_cache_receiver_data d USING (entry_ID)
    WHERE r.request_key LIKE ? ORDER BY r.time_stamp DESC
  `).all(`%transcript_${appleId}.ttml%`) as { onFs: number, data: Uint8Array }[]
  cache.close()
  for (const { onFs, data } of rows) {
    const body = onFs
      ? readFileSync(join(APPLE_HTTP_CACHE, 'fsCachedData', Buffer.from(data).toString()), 'utf8')
      : Buffer.from(data).toString('utf8')
    // Some cached variants are encrypted — keep the plain TTML one.
    if (body.startsWith('<tt'))
      return body
  }
  return null
}

function transcriptOf(ep: Episode): string | null {
  const out = join(TRANSCRIPTS_DIR, `${ep.slug}.txt`)
  if (existsSync(out))
    return readFileSync(out, 'utf8')
  const ttml = ep.appleId ? findTtmlAsset(ep.appleId) ?? findTtmlInHttpCache(ep.appleId) : null
  if (!ttml)
    return null
  const text = ttmlToText(ttml)
  writeFileSync(out, text)
  return text
}

// ---------- 3. Tracks (Claude) ----------
const PROMPT = `Voici le transcript d'un épisode de « En boucle », le podcast musical de TFTC où deux animateurs se recommandent chacun leur tour des morceaux (8 en général).
Les locuteurs sont anonymisés (SPEAKER_1…) : déduis leur prénom de la conversation.

Pour chaque morceau recommandé, dans l'ordre de l'épisode, donne :
- artist / title : orthographe officielle (corrige les erreurs de transcription)
- recommendedBy : prénom de l'animateur qui le propose
- note : 1 à 3 phrases en français qui résument pourquoi il le conseille (ambiance, anecdote, quand l'écouter), fidèles à ce qui est dit
- at : horodatage "m:ss" où le morceau est introduit

Ignore les morceaux seulement cités en passant.`

async function extractTracks(transcript: string): Promise<Track[]> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      messages: [{ role: 'user', content: `${PROMPT}\n\n<transcript>\n${transcript}\n</transcript>` }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['tracks'],
            properties: {
              tracks: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['artist', 'title', 'recommendedBy', 'note', 'at'],
                  properties: {
                    artist: { type: 'string' },
                    title: { type: 'string' },
                    recommendedBy: { type: 'string' },
                    note: { type: 'string' },
                    at: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    }),
  })
  const msg = await res.json()
  if (!res.ok)
    throw new Error(`Claude ${res.status}: ${JSON.stringify(msg.error)}`)
  if (msg.stop_reason !== 'end_turn')
    throw new Error(`Claude stop_reason: ${msg.stop_reason}`)
  const text = msg.content.find((b: any) => b.type === 'text').text
  return JSON.parse(text).tracks.map((t: Omit<Track, 'links'>) => ({ ...t, links: null }))
}

// ---------- 4. Links (iTunes Search → song.link) ----------
// The Odesli API now requires a key; the song.link page itself lists every platform.
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** iTunes Search is rate-limited (~20 req/min) and answers empty when throttled: wait and retry. */
async function itunes(url: string): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url)
    const text = await res.text()
    if (res.ok && text)
      return JSON.parse(text)
    if (attempt === 3)
      throw new Error(`iTunes ${res.status}`)
    await sleep(20_000)
  }
}

async function resolveLinks(t: Track): Promise<Links | null> {
  const term = encodeURIComponent(`${t.artist} ${t.title}`)
  const artist = t.artist.toLowerCase()
  // FR store first, then US (some records are only there).
  for (const country of ['FR', 'US']) {
    const search = await itunes(`https://itunes.apple.com/search?term=${term}&entity=song&limit=10&country=${country}`)
    // First result by the right artist — not a cover or a homonym.
    const hit = search.results?.find((r: any) => r.artistName.toLowerCase().includes(artist))
    if (hit) {
      return {
        pageUrl: `https://song.link/i/${hit.trackId}`,
        artwork: hit.artworkUrl100.replace('100x100', '300x300'),
        platforms: { appleMusic: hit.trackViewUrl },
      }
    }
  }
  return null
}

// ---------- run ----------
for (const ep of await syncFeed()) {
  if (!ep.tracks.length) {
    const transcript = transcriptOf(ep)
    if (!transcript) {
      console.log(`· ${ep.title} — pas de transcript : ouvre-le dans Apple Podcasts (onglet Transcript) puis relance`)
      continue
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log(`· ${ep.title} — transcript prêt (${TRANSCRIPTS_DIR}/${ep.slug}.txt), ANTHROPIC_API_KEY manquante pour l'extraction`)
      continue
    }
    ep.tracks = await extractTracks(transcript)
    save(ep)
    console.log(`✓ ${ep.title} — ${ep.tracks.length} morceaux`)
  }

  for (const t of ep.tracks.filter(t => !t.links)) {
    try {
      t.links = await resolveLinks(t)
    }
    catch (err) {
      console.log(`  ! ${t.artist} — ${t.title}: ${(err as Error).message} (réessaie plus tard)`)
      continue
    }
    save(ep)
    console.log(`  ${t.links ? '♪' : '✗'} ${t.artist} — ${t.title}`)
  }
}
