<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Loader2, TrendingUp, Star, Clock, Crown, Languages } from 'lucide-svelte';
  import DramaCard from '$lib/components/DramaCard.svelte';
  import { getDramasByCategory } from '$lib/services/api';
  import type { Drama, CategoryType } from '$lib/types';
  
  // Get category type from URL params
  let categoryType = $derived($page.params.type as CategoryType);
  
  let dramas = $state<Drama[]>([]);
  let isLoading = $state(true);
  let currentPage = $state(1);
  let hasMore = $state(true);
  
  const categoryInfo: Record<string, { title: string; description: string; icon: typeof TrendingUp }> = {
    trending: { 
      title: 'Trending', 
      description: 'Drama yang sedang populer minggu ini',
      icon: TrendingUp
    },
    foryou: { 
      title: 'Untuk Kamu', 
      description: 'Rekomendasi drama berdasarkan preferensi',
      icon: Star
    },
    latest: { 
      title: 'Terbaru', 
      description: 'Drama yang baru ditambahkan',
      icon: Clock
    },
    vip: { 
      title: 'VIP Premium', 
      description: 'Konten eksklusif kualitas tinggi',
      icon: Crown
    },
    dubindo: { 
      title: 'Dubbing Indonesia', 
      description: 'Drama dengan dubbing Bahasa Indonesia',
      icon: Languages
    },
    populersearch: { 
      title: 'Paling Dicari', 
      description: 'Drama yang paling banyak dicari',
      icon: Star
    }
  };
  
  $effect(() => {
    loadDramas();
  });
  
  async function loadDramas() {
    isLoading = true;
    dramas = [];
    currentPage = 1;
    
    try {
      const data = await getDramasByCategory(categoryType, 1);
      dramas = data;
      hasMore = data.length >= 20;
    } catch (error) {
      console.error('Failed to load category:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function loadMore() {
    if (!hasMore || isLoading) return;
    
    currentPage++;
    
    try {
      const data = await getDramasByCategory(categoryType, currentPage);
      dramas = [...dramas, ...data];
      hasMore = data.length >= 20;
    } catch (error) {
      console.error('Failed to load more:', error);
      hasMore = false;
    }
  }
  
  let info = $derived(categoryInfo[categoryType] || categoryInfo.trending);
</script>

<svelte:head>
  <title>{info.title} - DRACIN</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
  <!-- Header -->
  <div class="flex items-center gap-4 mb-8">
    <div class="p-3 rounded-xl bg-brand-orange/20">
      <info.icon class="w-6 h-6 text-brand-orange" />
    </div>
    <div>
      <h1 class="text-2xl md:text-3xl font-bold">{info.title}</h1>
      <p class="text-gray-400 text-sm">{info.description}</p>
    </div>
  </div>
  
  <!-- Grid -->
  {#if isLoading}
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
      {#each Array(12) as _}
        <div class="aspect-[2/3] shimmer rounded-xl"></div>
      {/each}
    </div>
  {:else if dramas.length > 0}
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
      {#each dramas as drama}
        <DramaCard {drama} />
      {/each}
    </div>
    
    <!-- Load More -->
    {#if hasMore && (categoryType === 'vip' || categoryType === 'dubindo')}
      <div class="flex justify-center mt-8">
        <button
          onclick={loadMore}
          class="px-8 py-3 bg-brand-gray hover:bg-brand-orange transition-colors rounded-full font-semibold"
        >
          Muat Lebih Banyak
        </button>
      </div>
    {/if}
  {:else}
    <div class="text-center py-20">
      <info.icon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h2 class="text-xl font-semibold mb-2">Tidak ada drama</h2>
      <p class="text-gray-400">Belum ada drama dalam kategori ini</p>
    </div>
  {/if}
</div>
