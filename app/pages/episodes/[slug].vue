<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toSeconds } from '@/lib/format'

const route = useRoute()
const { data: episode, isPending, isError } = useEpisode(() => String(route.params.slug))

useHead(() => ({ title: episode.value ? `${episode.value.title} — En boucle` : 'En boucle' }))

// Clicking a track's timestamp jumps the episode player to it.
const player = useTemplateRef<HTMLAudioElement>('player')
function seek(at: string) {
  if (!player.value)
    return
  player.value.currentTime = toSeconds(at)
  player.value.play()
}
</script>

<template>
  <div class="pt-4">
    <Button as-child variant="ghost" size="sm" class="-ml-3">
      <NuxtLink to="/">
        <ArrowLeft /> Tous les épisodes
      </NuxtLink>
    </Button>

    <Skeleton v-if="isPending" class="mt-6 h-64 w-full" />

    <p v-else-if="isError || !episode" class="mt-12 text-center text-muted-foreground">
      Épisode introuvable.
    </p>

    <template v-else>
      <div class="mt-6">
        <EpisodeHeader :episode="episode" />
      </div>

      <div class="sticky top-0 z-10 -mx-4 mt-6 bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <audio ref="player" :src="episode.audioUrl" controls preload="none" class="w-full" />
      </div>

      <div v-if="episode.tracks.length" class="mt-4 grid gap-3">
        <TrackCard
          v-for="(t, i) in episode.tracks"
          :key="`${t.artist}-${t.title}`"
          :track="t"
          :position="i + 1"
          seekable
          @seek="seek"
        />
      </div>
      <p v-else class="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Tracklist en préparation.
      </p>

      <p class="mt-6 text-sm text-muted-foreground">
        <a :href="episode.acastUrl" target="_blank" rel="noopener" class="underline">Écouter sur Acast</a>
        <template v-if="episode.appleId">
          ·
          <a :href="`https://podcasts.apple.com/fr/podcast/id1483918693?i=${episode.appleId}`" target="_blank" rel="noopener" class="underline">Apple Podcasts</a>
        </template>
      </p>
    </template>
  </div>
</template>
