<template>
  <div class="mx-auto min-h-screen w-full max-w-4xl px-4 pb-16 sm:px-6">
    <header class="flex items-center justify-between py-6">
      <NuxtLink to="/" class="flex items-center gap-2.5">
        <span class="grid size-8 place-items-center rounded-full border-2 border-primary">
          <span class="size-2 rounded-full bg-primary" />
        </span>
        <span class="font-serif text-2xl">En boucle</span>
      </NuxtLink>
      <nav class="flex items-center gap-4 text-sm text-muted-foreground">
        <NuxtLink to="/contribuer" class="hover:text-foreground" active-class="text-foreground">
          Contribuer
        </NuxtLink>
        <a href="https://shows.acast.com/we-love-tftc/episodes" target="_blank" rel="noopener" class="hover:text-foreground">
          Écouter le podcast ↗
        </a>
      </nav>
    </header>

    <NuxtPage />

    <footer class="mt-16 border-t pt-6 text-xs text-muted-foreground">
      Site fan-made, non officiel. Les morceaux et conseils viennent de
      <a href="https://shows.acast.com/we-love-tftc" target="_blank" rel="noopener" class="underline">En boucle</a>,
      le podcast musical de TFTC. Liens d'écoute via
      <a href="https://song.link" target="_blank" rel="noopener" class="underline">song.link</a>.
    </footer>
  </div>
</template>
