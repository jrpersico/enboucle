<script setup lang="ts">
import type { TrackView, Vote } from '#shared/types'
import { cn } from '@/lib/utils'

const props = defineProps<{ track: TrackView }>()

const { mutate } = useVote()
const score = computed(() => props.track.up - props.track.down)

// Clicking your current vote again removes it.
const vote = (value: Exclude<Vote, 0>) =>
  mutate({ track: props.track, value: props.track.mine === value ? 0 : value })

const pill = (active: boolean) => cn(
  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm tabular-nums transition-colors',
  active ? 'border-primary/60 bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
)
</script>

<template>
  <div class="flex items-center gap-2">
    <button type="button" :class="pill(track.mine === 1)" :aria-pressed="track.mine === 1" aria-label="J'aime" @click="vote(1)">
      👍 {{ track.up }}
    </button>
    <button type="button" :class="pill(track.mine === -1)" :aria-pressed="track.mine === -1" aria-label="Je n'aime pas" @click="vote(-1)">
      👎 {{ track.down }}
    </button>
    <span
      v-if="track.up || track.down"
      class="text-sm font-semibold tabular-nums"
      :class="score > 0 ? 'text-emerald-400' : score < 0 ? 'text-danger' : 'text-muted-foreground'"
    >
      {{ score > 0 ? `+${score}` : score }}
    </span>
  </div>
</template>
