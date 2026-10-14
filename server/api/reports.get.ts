/** Read the contributions: `curl -H "Authorization: Bearer $NUXT_ADMIN_TOKEN" …/api/reports` */
export default defineEventHandler((event) => {
  const token = useRuntimeConfig(event).adminToken
  if (!token || getHeader(event, 'authorization') !== `Bearer ${token}`)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  return all(
    `SELECT r.*, e.title AS episode FROM reports r JOIN episodes e ON e.id = r.episode_id
     ORDER BY r.created_at DESC`,
  )
})
