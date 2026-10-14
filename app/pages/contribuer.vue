<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '@/lib/format'

useHead({ title: 'Contribuer — En boucle' })

/** Credited contributors (accepted corrections / verifications). */
const CONTRIBUTORS: string[] = []

const { data: episodes } = useEpisodes()

const kind = ref<'error' | 'verified'>('error')
const episodeId = ref('')
const message = ref('')
const author = ref('')

const { mutate, isPending, isSuccess, error, reset } = useMutation({
  mutationFn: () => $fetch<{ ok: boolean }>('/api/reports', {
    method: 'POST',
    body: { kind: kind.value, episodeId: episodeId.value, message: message.value, author: author.value },
  }),
  onSuccess: () => {
    message.value = ''
  },
})

const canSubmit = computed(() => episodeId.value && (kind.value === 'verified' || message.value.trim()))
</script>

<template>
  <div class="max-w-2xl pt-6">
    <h1 class="font-serif text-5xl leading-none">
      Contribuer & signaler
    </h1>
    <p class="mt-4 text-muted-foreground">
      Les listes sont extraites automatiquement des transcripts : il peut y avoir des erreurs.
      Tu en as repéré une, ou tu as écouté un épisode et tout est juste ? Ça prend 30 secondes.
    </p>

    <ul class="mt-4 list-inside list-disc space-y-1 text-sm text-muted-foreground">
      <li>Mauvais titre ou artiste, son attribué au mauvais animateur, conseil mal résumé, lien qui ne marche pas…</li>
      <li>Indique l'épisode, ce qui ne va pas et, si possible, la correction. Quelques mots suffisent.</li>
      <li>Un épisode vérifié par un auditeur reçoit le badge <span class="text-emerald-400">✓ Vérifié</span>.</li>
    </ul>

    <Card class="mt-8 p-5">
      <form v-if="!isSuccess" class="space-y-5" @submit.prevent="mutate()">
        <Tabs v-model="kind">
          <TabsList>
            <TabsTrigger value="error">
              Signaler une erreur
            </TabsTrigger>
            <TabsTrigger value="verified">
              J'ai vérifié un épisode
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <label class="block space-y-2">
          <span class="text-sm font-medium">Épisode</span>
          <Select v-model="episodeId">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Choisis l'épisode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="ep in episodes" :key="ep.id" :value="ep.id">
                {{ ep.title.replace(/^En boucle : /i, '') }} — {{ formatDate(ep.publishedAt) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-medium">
            {{ kind === 'error' ? 'Ce qui ne va pas' : 'Un commentaire ? (facultatif)' }}
          </span>
          <textarea
            v-model="message"
            rows="4"
            maxlength="2000"
            :placeholder="kind === 'error' ? 'Ex : le 3e son est de Sam Wilkes, pas Sam Wikes' : 'Ex : tout est juste, écouté en entier'"
            class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-medium">Prénom ou pseudo <span class="font-normal text-muted-foreground">— pour être crédité (facultatif)</span></span>
          <Input v-model="author" maxlength="80" />
        </label>

        <p v-if="error" class="text-sm text-danger">
          {{ (error as any).data?.statusMessage ?? 'Envoi impossible, réessaie.' }}
        </p>

        <Button type="submit" :disabled="!canSubmit || isPending">
          {{ isPending ? 'Envoi…' : 'Envoyer' }}
        </Button>
      </form>

      <div v-else class="space-y-3 text-center">
        <p class="text-lg font-semibold">
          Merci ! 🙏
        </p>
        <p class="text-sm text-muted-foreground">
          C'est bien reçu, on corrige dès que possible.
        </p>
        <Button variant="outline" size="sm" @click="reset()">
          Envoyer autre chose
        </Button>
      </div>
    </Card>

    <section class="mt-10">
      <h2 class="font-serif text-3xl">
        Merci à celles et ceux qui contribuent
      </h2>
      <p v-if="CONTRIBUTORS.length" class="mt-2 text-muted-foreground">
        {{ CONTRIBUTORS.join(' · ') }}
      </p>
      <p v-else class="mt-2 text-sm text-muted-foreground">
        Personne pour l'instant — ton nom ici ?
      </p>
    </section>
  </div>
</template>
