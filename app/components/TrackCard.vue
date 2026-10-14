<script setup lang="ts">
import type { TrackView } from '#shared/types'
import { ExternalLink, Play } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const props = defineProps<{
  track: TrackView
  position: number
  /** Show the timestamp as a button that seeks the episode player. */
  seekable?: boolean
}>()

defineEmits<{ seek: [at: string] }>()

// Apple Music is a direct link (iTunes Search); Spotify / YouTube are searches;
// the song.link page lists every other platform.
const platforms = computed(() => {
  const q = encodeURIComponent(`${props.track.artist} ${props.track.title}`)
  return [
    { label: 'Spotify', url: `https://open.spotify.com/search/${q}` },
    { label: 'Apple Music', url: props.track.links?.platforms.appleMusic },
    { label: 'YouTube', url: `https://www.youtube.com/results?search_query=${q}` },
  ].filter(p => p.url)
})
</script>

<template>
  <Card class="flex gap-4 p-4">
    <div class="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
      <img
        v-if="track.links?.artwork"
        :src="track.links.artwork"
        :alt="`${track.title} — ${track.artist}`"
        loading="lazy"
        class="size-full object-cover"
      >
      <span class="absolute left-1.5 top-1.5 rounded-md bg-background/80 px-1.5 text-xs font-semibold tabular-nums backdrop-blur">
        {{ position }}
      </span>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">
          conseillé par {{ track.recommendedBy }}
        </Badge>
        <button
          v-if="seekable"
          type="button"
          class="inline-flex items-center gap-1 tabular-nums hover:text-primary"
          @click="$emit('seek', track.at)"
        >
          <Play class="size-3" /> {{ track.at }}
        </button>
        <span v-else class="tabular-nums">à {{ track.at }}</span>
      </div>

      <h3 class="mt-1.5 text-base font-semibold leading-tight">
        {{ track.title }}
      </h3>
      <p class="text-sm text-muted-foreground">
        {{ track.artist }}
      </p>

      <p class="mt-2 text-sm leading-relaxed text-foreground/85">
        {{ track.note }}
      </p>

      <div class="mt-3 flex flex-wrap gap-1.5">
        <Button v-for="p in platforms" :key="p.label" as-child variant="outline" size="sm">
          <a :href="p.url" target="_blank" rel="noopener">{{ p.label }}</a>
        </Button>
        <Button v-if="track.links" as-child variant="ghost" size="sm">
          <a :href="track.links.pageUrl" target="_blank" rel="noopener">
            Toutes les plateformes <ExternalLink />
          </a>
        </Button>
      </div>
    </div>
  </Card>
</template>
