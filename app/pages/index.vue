<script setup lang="ts">
import { Search } from '@lucide/vue'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const { data: episodes, isPending } = useEpisodes()

const q = ref('')
const host = ref('all')

const hosts = computed(() => [...new Set(episodes.value?.flatMap(e => e.tracks.map(t => t.recommendedBy)) ?? [])])
const trackCount = computed(() => episodes.value?.reduce((n, e) => n + e.tracks.length, 0) ?? 0)

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  const filtering = needle || host.value !== 'all'
  return (episodes.value ?? [])
    .map(e => ({
      ...e,
      tracks: e.tracks.filter(t =>
        (host.value === 'all' || t.recommendedBy === host.value)
        && (!needle || `${t.artist} ${t.title} ${t.note}`.toLowerCase().includes(needle))),
    }))
    // While filtering, hide the episodes with no match.
    .filter(e => !filtering || e.tracks.length)
})
</script>

<template>
  <div>
    <section class="py-8 sm:py-12">
      <h1 class="font-serif text-5xl leading-none sm:text-6xl">
        Tous les sons <em class="text-primary">d'En boucle</em>
      </h1>
      <p class="mt-4 max-w-xl text-muted-foreground">
        Chaque dimanche soir, JB et Baptiste se conseillent 8 morceaux dans le podcast musical de TFTC.
        Les voici, épisode par épisode, avec leur conseil et où les écouter.
      </p>
      <p class="mt-3 text-sm text-muted-foreground">
        {{ episodes?.length ?? 0 }} épisodes · {{ trackCount }} sons
      </p>
    </section>

    <div class="sticky top-0 z-10 -mx-4 flex flex-col gap-3 bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:px-6">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="q" placeholder="Artiste, titre, ambiance…" class="pl-9" />
      </div>
      <Tabs v-model="host">
        <TabsList>
          <TabsTrigger value="all">
            Tous
          </TabsTrigger>
          <TabsTrigger v-for="h in hosts" :key="h" :value="h">
            {{ h }}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <div v-if="isPending" class="mt-8 space-y-4">
      <Skeleton v-for="i in 3" :key="i" class="h-40 w-full" />
    </div>

    <p v-else-if="!filtered.length" class="mt-12 text-center text-muted-foreground">
      Aucun son ne correspond.
    </p>

    <section v-for="ep in filtered" :key="ep.id" class="mt-10">
      <EpisodeHeader :episode="ep" link />
      <div v-if="ep.tracks.length" class="mt-4 grid gap-3">
        <TrackCard
          v-for="t in ep.tracks"
          :key="`${t.artist}-${t.title}`"
          :track="t"
          :position="ep.tracks.indexOf(t) + 1"
        />
      </div>
      <p v-else class="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Tracklist en préparation.
      </p>
    </section>
  </div>
</template>
