<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Search as SearchIcon, Loader2 } from 'lucide-svelte';
  import DramaCard from '$lib/components/DramaCard.svelte';
  import { searchDramas } from '$lib/services/api';
  import type { Drama } from '$lib/types';
  
  let query = $derived($page.url.searchParams.get('q') || '');
  let results = $state<Drama[]>([]);
  let isLoading = $state(false);
  let hasSearched = $state(false);
  
  $effect(() => {
    if (query) {
      performSearch(query);
    } else {
      results = [];
      hasSearched = false;
    }
  });
  
  async function performSearch(q: string) {
    isLoading = true;
    hasSearched = true;
    
    try {
      results = await searchDramas(q);
    } catch (error) {
      console.error('Search failed:', error);
      results = [];
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Cari: {query || 'Search'} - DRACIN</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-2xl md:text-3xl font-bold mb-2">Hasil Pencarian</h1>
    {#if query}
      <p class="text-gray-400">
        {#if isLoading}
          Mencari "{query}"...
        {:else}
          {results.length} hasil untuk "{query}"
        {/if}
      </p>
    {/if}
  </div>
  
  <!-- Results -->
  {#if isLoading}
    <div class="flex items-center justify-center py-20">
      <Loader2 class="w-8 h-8 text-brand-orange animate-spin" />
    </div>
  {:else if results.length > 0}
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
      {#each results as drama}
        <DramaCard {drama} />
      {/each}
    </div>
  {:else if hasSearched}
    <div class="text-center py-20">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gray mb-4">
        <SearchIcon class="w-8 h-8 text-gray-400" />
      </div>
      <h2 class="text-xl font-semibold mb-2">Tidak ada hasil</h2>
      <p class="text-gray-400">Coba kata kunci lain atau periksa ejaan</p>
    </div>
  {:else}
    <div class="text-center py-20">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gray mb-4">
        <SearchIcon class="w-8 h-8 text-gray-400" />
      </div>
      <h2 class="text-xl font-semibold mb-2">Cari Drama</h2>
      <p class="text-gray-400">Masukkan kata kunci untuk mencari drama favorit</p>
    </div>
  {/if}
</div>
