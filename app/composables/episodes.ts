import type { EpisodeView, TrackView, Vote } from '#shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

// useRequestFetch forwards the visitor's cookie during SSR, so "my vote" is right on first render.

/** Every episode with its tracks, newest first. */
export function useEpisodes() {
  const request = useRequestFetch()
  const query = useQuery({
    queryKey: ['episodes'],
    queryFn: () => request<EpisodeView[]>('/api/episodes'),
  })
  onServerPrefetch(query.suspense)
  return query
}

export function useEpisode(slug: MaybeRefOrGetter<string>) {
  const request = useRequestFetch()
  const query = useQuery({
    queryKey: ['episodes', slug],
    queryFn: () => request<EpisodeView>(`/api/episodes/${toValue(slug)}`),
  })
  onServerPrefetch(query.suspense)
  return query
}

/** 👍 / 👎 — clicking your current vote again removes it. Optimistic. */
export function useVote() {
  const queryClient = useQueryClient()

  // Apply a change to the track in every cached episode list / episode.
  const patch = (key: string, fn: (t: TrackView) => TrackView) =>
    queryClient.setQueriesData<EpisodeView[] | EpisodeView>({ queryKey: ['episodes'] }, (data) => {
      const patchEpisode = (e: EpisodeView) => ({ ...e, tracks: e.tracks.map(t => (t.key === key ? fn(t) : t)) })
      if (!data)
        return data
      return Array.isArray(data) ? data.map(patchEpisode) : patchEpisode(data)
    })

  return useMutation({
    mutationFn: ({ track, value }: { track: TrackView, value: Vote }) =>
      $fetch<{ up: number, down: number }>('/api/votes', { method: 'POST', body: { trackKey: track.key, value } }),
    onMutate: ({ track, value }) => {
      const up = track.up - (track.mine === 1 ? 1 : 0) + (value === 1 ? 1 : 0)
      const down = track.down - (track.mine === -1 ? 1 : 0) + (value === -1 ? 1 : 0)
      patch(track.key, t => ({ ...t, up, down, mine: value }))
      return { previous: track }
    },
    onSuccess: (counts, { track }) => patch(track.key, t => ({ ...t, ...counts })),
    onError: (_err, _vars, ctx) => ctx && patch(ctx.previous.key, () => ctx.previous),
  })
}
