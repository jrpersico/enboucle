/** Body: { trackKey, value: 1 | -1 | 0 } — 0 removes the visitor's vote. */
export default defineEventHandler(async (event) => {
  const { trackKey, value } = await readBody<{ trackKey?: string, value?: number }>(event) ?? {}
  if (typeof trackKey !== 'string' || ![1, -1, 0].includes(value as number))
    throw createError({ statusCode: 400, statusMessage: 'Vote invalide' })
  if (!get('SELECT 1 FROM tracks WHERE key = ?', trackKey))
    throw createError({ statusCode: 404, statusMessage: 'Son introuvable' })

  const voter = voterId(event, true)!
  if (value === 0) {
    run('DELETE FROM votes WHERE track_key = ? AND voter = ?', trackKey, voter)
  }
  else {
    run(
      `INSERT INTO votes (track_key, voter, value, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (track_key, voter) DO UPDATE SET value = excluded.value`,
      trackKey, voter, value!, new Date().toISOString(),
    )
  }
  return get<{ up: number, down: number }>(
    `SELECT COUNT(*) FILTER (WHERE value = 1) AS up, COUNT(*) FILTER (WHERE value = -1) AS down
     FROM votes WHERE track_key = ?`,
    trackKey,
  )
})
