<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { Coffee } from "lucide-svelte";
  import "../app.css";
  import Navbar from "$lib/components/Navbar.svelte";
  import DonationModal from "$lib/components/DonationModal.svelte";
  import { favorites } from "$lib/stores/favorites";

  let { children } = $props();

  let showDonation = $state(false);

  // Hide donation button on watch page
  let isWatchPage = $derived($page.url.pathname.startsWith("/watch"));

  onMount(() => {
    favorites.init();
  });
</script>

<div class="min-h-screen bg-brand-black flex flex-col">
  <Navbar />

  <main class="flex-1 pt-16">
    {@render children()}
  </main>

  <!-- Footer -->
  <footer class="bg-brand-dark border-t border-white/5 py-8 mt-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="text-center md:text-left">
          <p class="text-sm text-gray-400">
            © 2026 DRACIN. Streaming drama China dengan subtitle Indonesia.
          </p>
          <p class="text-xs text-gray-500 mt-1">
            V2.0 - Built with SvelteKit ❤️
          </p>
        </div>
        <div class="flex items-center gap-4">
          <a
            href="/favorites"
            class="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Watchlist
          </a>
          <a
            href="/category/trending"
            class="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Trending
          </a>
          <button
            onclick={() => (showDonation = true)}
            class="text-sm text-gray-400 hover:text-brand-orange transition-colors"
          >
            Donasi
          </button>
        </div>
      </div>
    </div>
  </footer>

  <!-- Floating Donation Button (hidden on watch page) -->
  {#if !isWatchPage}
    <button
      onclick={() => (showDonation = true)}
      class="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-orange to-orange-600 rounded-full shadow-lg shadow-brand-orange/30 hover:shadow-brand-orange/50 hover:scale-105 transition-all z-40"
      aria-label="Donasi"
    >
      <Coffee class="w-5 h-5" />
      <span class="text-sm font-semibold hidden sm:inline">Traktir Kopi</span>
    </button>
  {/if}

  <!-- Donation Modal -->
  <DonationModal isOpen={showDonation} onClose={() => (showDonation = false)} />
</div>
