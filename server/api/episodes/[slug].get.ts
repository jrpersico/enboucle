export default defineEventHandler((event) => {
  const episode = findEpisode(getRouterParam(event, 'slug')!, voterId(event))
  if (!episode)
    throw createError({ statusCode: 404, statusMessage: 'Épisode introuvable' })
  return episode
})
