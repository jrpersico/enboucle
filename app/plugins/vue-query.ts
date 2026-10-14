import type { DehydratedState } from '@tanstack/vue-query'
import { dehydrate, hydrate, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

// TanStack Query with SSR: queries prefetched on the server (onServerPrefetch)
// are dehydrated into the payload and hydrated on the client.
export default defineNuxtPlugin((nuxt) => {
  const state = useState<DehydratedState | null>('vue-query')
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  })

  nuxt.vueApp.use(VueQueryPlugin, { queryClient })

  if (import.meta.server) {
    nuxt.hooks.hook('app:rendered', () => {
      state.value = dehydrate(queryClient)
    })
  }

  if (import.meta.client && state.value)
    hydrate(queryClient, state.value)
})
