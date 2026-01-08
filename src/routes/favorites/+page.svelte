<script lang="ts">
  import { Heart, Trash2 } from 'lucide-svelte';
  import DramaCard from '$lib/components/DramaCard.svelte';
  import { favorites } from '$lib/stores/favorites';
</script>

<svelte:head>
  <title>Watchlist - DRACIN</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <div class="p-3 rounded-xl bg-brand-orange/20">
        <Heart class="w-6 h-6 text-brand-orange" />
      </div>
      <div>
        <h1 class="text-2xl md:text-3xl font-bold">Watchlist</h1>
        <p class="text-gray-400 text-sm">{$favorites.length} drama tersimpan</p>
      </div>
    </div>
    
    {#if $favorites.length > 0}
      <button
        onclick={() => {
          if (confirm('Hapus semua dari watchlist?')) {
            favorites.clear();
          }
        }}
        class="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
      >
        <Trash2 class="w-4 h-4" />
        <span class="hidden sm:inline">Hapus Semua</span>
      </button>
    {/if}
  </div>
  
  <!-- Grid -->
  {#if $favorites.length > 0}
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
      {#each $favorites as drama (drama.bookId)}
        <DramaCard {drama} />
      {/each}
    </div>
  {:else}
    <div class="text-center py-20">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gray mb-4">
        <Heart class="w-8 h-8 text-gray-400" />
      </div>
      <h2 class="text-xl font-semibold mb-2">Watchlist Kosong</h2>
      <p class="text-gray-400 mb-6">Mulai tambahkan drama favorit ke watchlist</p>
      <a 
        href="/"
        class="inline-flex items-center px-6 py-3 bg-brand-orange hover:bg-orange-600 rounded-full font-semibold transition-colors"
      >
        Jelajahi Drama
      </a>
    </div>
  {/if}
</div>
