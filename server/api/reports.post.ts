/** Contribution form: report an error, or say you checked an episode. */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ kind?: string, episodeId?: string, message?: string, author?: string }>(event) ?? {}
  const kind = body.kind === 'verified' ? 'verified' : 'error'
  const message = String(body.message ?? '').trim().slice(0, 2000)
  const author = String(body.author ?? '').trim().slice(0, 80)

  if (!get('SELECT 1 FROM episodes WHERE id = ?', String(body.episodeId)))
    throw createError({ statusCode: 400, statusMessage: 'Épisode inconnu' })
  if (kind === 'error' && !message)
    throw createError({ statusCode: 400, statusMessage: 'Dis-nous ce qui ne va pas' })

  run(
    'INSERT INTO reports (kind, episode_id, message, author, created_at) VALUES (?, ?, ?, ?, ?)',
    kind, String(body.episodeId), message, author, new Date().toISOString(),
  )
  return { ok: true }
})
