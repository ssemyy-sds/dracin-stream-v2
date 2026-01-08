<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronLeft, ChevronRight, Star, Play } from 'lucide-svelte';
  import DramaCard from '$lib/components/DramaCard.svelte';
  import { getTrending, getPopular, getLatest, getForYou } from '$lib/services/api';
  import { fixUrl, truncateText } from '$lib/utils/helpers';
  import type { Drama } from '$lib/types';
  
  // Hero carousel data
  let heroItems = $state<Drama[]>([]);
  let currentSlide = $state(0);
  let isLoading = $state(true);
  
  // Content sections
  let trendingDramas = $state<Drama[]>([]);
  let popularDramas = $state<Drama[]>([]);
  let latestDramas = $state<Drama[]>([]);
  
  onMount(async () => {
    try {
      // Fetch all data in parallel
      const [trending, popular, latest, forYou] = await Promise.all([
        getTrending(),
        getPopular(),
        getLatest(),
        getForYou()
      ]);
      
      // Create hero items from trending and latest
      const heroData = [...trending.slice(0, 3), ...latest.slice(0, 3)];
      heroItems = heroData.slice(0, 6);
      
      trendingDramas = trending;
      popularDramas = popular;
      latestDramas = latest;
      
      isLoading = false;
      
      // Start auto-slide
      startAutoSlide();
    } catch (error) {
      console.error('Failed to load home data:', error);
      isLoading = false;
    }
  });
  
  let autoSlideInterval: ReturnType<typeof setInterval>;
  
  function startAutoSlide() {
    autoSlideInterval = setInterval(() => {
      if (heroItems.length > 0) {
        currentSlide = (currentSlide + 1) % heroItems.length;
      }
    }, 5000);
  }
  
  function goToSlide(index: number) {
    currentSlide = index;
    clearInterval(autoSlideInterval);
    startAutoSlide();
  }
  
  function nextSlide() {
    goToSlide((currentSlide + 1) % heroItems.length);
  }
  
  function prevSlide() {
    goToSlide((currentSlide - 1 + heroItems.length) % heroItems.length);
  }
</script>

<svelte:head>
  <title>DRACIN - Drama China Streaming</title>
  <meta name="description" content="Platform streaming drama China premium dengan subtitle Indonesia" />
</svelte:head>

<div class="space-y-8 md:space-y-12">
  <!-- Hero Carousel -->
  <section class="relative h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden -mt-16">
    {#if isLoading}
      <div class="absolute inset-0 shimmer"></div>
    {:else if heroItems.length > 0}
      {#each heroItems as item, index}
        <div 
          class="absolute inset-0 transition-opacity duration-700 {index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}"
        >
          <!-- Background Image -->
          <div class="absolute inset-0">
            <img 
              src={fixUrl(item.cover)} 
              alt={item.bookName}
              class="w-full h-full object-cover object-top scale-110 blur-sm"
            />
            <div class="absolute inset-0 gradient-overlay-left"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-brand-black/50"></div>
          </div>
          
          <!-- Content -->
          <div class="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-end pb-16 md:pb-24">
            <div class="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end">
              <!-- Cover Image (Desktop) -->
              <div class="hidden md:block shrink-0">
                <img 
                  src={fixUrl(item.cover)} 
                  alt={item.bookName}
                  class="w-48 h-72 object-cover rounded-xl shadow-2xl"
                />
              </div>
              
              <!-- Info -->
              <div class="flex-1 max-w-xl space-y-4">
                <!-- Badges -->
                <div class="flex items-center gap-2">
                  {#if index < 3}
                    <span class="px-3 py-1 bg-brand-orange text-xs font-bold rounded-full">
                      #{index + 1} Featured
                    </span>
                  {:else}
                    <span class="px-3 py-1 bg-green-500/80 text-xs font-bold rounded-full">
                      Baru Ditambahkan
                    </span>
                  {/if}
                  {#if item.rating}
                    <span class="flex items-center gap-1 px-2 py-1 glass rounded-full text-xs">
                      <Star class="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {item.rating.toFixed(1)}
                    </span>
                  {/if}
                </div>
                
                <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  {item.bookName}
                </h1>
                
                <p class="text-gray-300 text-sm md:text-base line-clamp-3 md:line-clamp-2">
                  {truncateText(item.introduction, 200)}
                </p>
                
                <div class="flex flex-wrap items-center gap-3 pt-2">
                  <a 
                    href="/watch/{item.bookId}"
                    class="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange hover:bg-orange-600 rounded-full font-semibold transition-colors shadow-lg shadow-brand-orange/30"
                  >
                    <Play class="w-5 h-5 fill-white" />
                    Tonton Sekarang
                  </a>
                  <a 
                    href="/detail/{item.bookId}"
                    class="px-6 py-3 glass hover:bg-white/20 rounded-full font-semibold transition-colors"
                  >
                    Detail
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/each}
      
      <!-- Navigation Arrows -->
      <button 
        onclick={prevSlide}
        class="absolute left-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full hover:bg-white/20 transition-colors z-20 hidden md:block"
        aria-label="Previous slide"
      >
        <ChevronLeft class="w-6 h-6" />
      </button>
      <button 
        onclick={nextSlide}
        class="absolute right-4 top-1/2 -translate-y-1/2 p-3 glass rounded-full hover:bg-white/20 transition-colors z-20 hidden md:block"
        aria-label="Next slide"
      >
        <ChevronRight class="w-6 h-6" />
      </button>
      
      <!-- Slide Indicators -->
      <div class="absolute top-24 right-4 md:right-8 flex flex-col gap-2 z-20">
        {#each heroItems as _, index}
          <button 
            onclick={() => goToSlide(index)}
            class="w-2 h-2 rounded-full transition-all {index === currentSlide ? 'bg-brand-orange scale-125' : 'bg-white/30 hover:bg-white/50'}"
            aria-label="Go to slide {index + 1}"
          ></button>
        {/each}
      </div>
    {/if}
  </section>
  
  <!-- Rekomendasi Untukmu (Horizontal Scroll) -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl md:text-2xl font-bold">Rekomendasi Untukmu</h2>
      <a 
        href="/category/foryou"
        class="text-sm text-brand-orange hover:underline"
      >
        Lihat Semua
      </a>
    </div>
    <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
      {#if isLoading}
        {#each Array(6) as _}
          <div class="w-36 md:w-44 shrink-0 aspect-[2/3] shimmer rounded-xl"></div>
        {/each}
      {:else}
        {#each trendingDramas.slice(0, 10) as drama}
          <div class="w-36 md:w-44 shrink-0">
            <DramaCard {drama} compact />
          </div>
        {/each}
      {/if}
    </div>
  </section>
  
  <!-- Popular Dramas (Grid) -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl md:text-2xl font-bold">Popular Dramas</h2>
      <a 
        href="/category/populersearch"
        class="text-sm text-brand-orange hover:underline"
      >
        Lihat Semua
      </a>
    </div>
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
      {#if isLoading}
        {#each Array(6) as _}
          <div class="aspect-[2/3] shimmer rounded-xl"></div>
        {/each}
      {:else}
        {#each popularDramas.slice(0, 6) as drama}
          <DramaCard {drama} compact />
        {/each}
      {/if}
    </div>
  </section>
  
  <!-- Baru Ditambahkan (Grid) -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl md:text-2xl font-bold">Baru Ditambahkan</h2>
      <a 
        href="/category/latest"
        class="text-sm text-brand-orange hover:underline"
      >
        Lihat Semua
      </a>
    </div>
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
      {#if isLoading}
        {#each Array(6) as _}
          <div class="aspect-[2/3] shimmer rounded-xl"></div>
        {/each}
      {:else}
        {#each latestDramas.slice(0, 6) as drama}
          <DramaCard {drama} compact />
        {/each}
      {/if}
    </div>
  </section>
</div>
