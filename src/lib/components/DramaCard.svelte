<script lang="ts">
  import { Star, Play, Eye } from "lucide-svelte";
  import type { Drama } from "$lib/types";
  import { fixUrl, formatViewCount } from "$lib/utils/helpers";

  interface Props {
    drama: Drama;
    compact?: boolean;
  }

  let { drama, compact = false }: Props = $props();
</script>

<a
  href="/detail/{drama.bookId}"
  class="group relative block overflow-hidden rounded-xl bg-brand-dark transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-orange/10"
>
  <!-- Cover Image -->
  <div class="relative aspect-[2/3] overflow-hidden">
    <img
      src={fixUrl(drama.cover)}
      alt={drama.bookName}
      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      loading="lazy"
    />

    <!-- Gradient Overlay -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"
    ></div>

    <!-- Corner Label Badge (e.g., VIP, NEW) -->
    {#if drama.cornerLabel}
      <div class="absolute top-2 left-2">
        <span
          class="px-2 py-1 text-xs font-semibold rounded-md bg-brand-orange/90 backdrop-blur-sm"
        >
          {drama.cornerLabel}
        </span>
      </div>
    {/if}

    <!-- Episode Count (top right) -->
    {#if drama.latestEpisode}
      <div
        class="absolute top-2 right-2 px-2 py-1 rounded-md glass text-xs font-medium"
      >
        Ep {drama.latestEpisode}
      </div>
    {/if}

    <!-- Play Button Overlay -->
    <div
      class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <div
        class="w-14 h-14 rounded-full bg-brand-orange/90 flex items-center justify-center backdrop-blur-sm shadow-lg transform scale-75 group-hover:scale-100 transition-transform"
      >
        <Play class="w-6 h-6 text-white fill-white ml-1" />
      </div>
    </div>

    <!-- Play Count Badge (bottom right, with eye icon, blue color) -->
    {#if drama.viewCount}
      <div
        class="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-blue-600/90 backdrop-blur-sm text-xs font-medium flex items-center gap-1"
      >
        <Eye class="w-3 h-3" />
        {formatViewCount(drama.viewCount)}
      </div>
    {/if}
  </div>

  <!-- Info -->
  <div class="p-3 space-y-1">
    <h3
      class="font-semibold text-sm line-clamp-2 group-hover:text-brand-orange transition-colors"
    >
      {drama.bookName}
    </h3>

    {#if !compact}
      <div class="flex items-center gap-2 text-xs text-gray-400">
        {#if drama.rating}
          <span class="flex items-center gap-1">
            <Star class="w-3 h-3 text-yellow-500 fill-yellow-500" />
            {drama.rating.toFixed(1)}
          </span>
        {/if}
        {#if drama.year}
          <span>• {drama.year}</span>
        {/if}
      </div>
    {:else}
      <div class="flex items-center gap-1 text-xs text-gray-400">
        {#if drama.rating}
          <Star class="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span>{drama.rating.toFixed(1)}</span>
        {/if}
      </div>
    {/if}
  </div>
</a>
