<script setup lang="ts">
import type { EpisodeView } from '#shared/types'
import { Check, Info } from '@lucide/vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate } from '@/lib/format'

defineProps<{
  episode: EpisodeView
  /** Link the title to the episode page. */
  link?: boolean
}>()
</script>

<template>
  <div class="flex items-center gap-4">
    <img :src="episode.image" alt="" class="size-16 shrink-0 rounded-lg object-cover sm:size-20">
    <div class="min-w-0">
      <p class="text-xs text-muted-foreground">
        {{ formatDate(episode.publishedAt) }} · {{ episode.duration }} · {{ episode.tracks.length || '—' }} sons
        <TooltipProvider :delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <button
                type="button"
                class="inline-flex items-center gap-1"
                :class="episode.verified ? 'text-emerald-400' : 'text-muted-foreground'"
              >
                <template v-if="episode.verified">
                  · <Check class="size-3.5" /> Vérifié
                </template>
                <template v-else>
                  · Non vérifié
                </template>
                <Info class="size-3.5 opacity-60" />
              </button>
            </TooltipTrigger>
            <TooltipContent class="max-w-64">
              <template v-if="episode.verified">
                Un auditeur a vérifié l'exactitude de ces infos après écoute de l'épisode.
              </template>
              <template v-else>
                Liste générée depuis le transcript, pas encore vérifiée par un auditeur.
                Tu l'as écouté ? Dis-le sur la page Contribuer.
              </template>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </p>
      <h2 class="font-serif text-2xl leading-tight sm:text-3xl">
        <NuxtLink v-if="link" :to="`/episodes/${episode.slug}`" class="hover:text-primary">
          {{ episode.title.replace(/^En boucle : /i, '') }}
        </NuxtLink>
        <template v-else>
          {{ episode.title.replace(/^En boucle : /i, '') }}
        </template>
      </h2>
    </div>
  </div>
</template>
