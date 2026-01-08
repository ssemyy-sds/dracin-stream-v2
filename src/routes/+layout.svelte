<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Navbar from '$lib/components/Navbar.svelte';
  import DonationModal from '$lib/components/DonationModal.svelte';
  import { Coffee, Heart, Globe, Github } from 'lucide-svelte';
  import { favorites } from '$lib/stores/favorites';
  
  let { children } = $props();
  
  let isDonationOpen = $state(false);
  
  onMount(() => {
    // Initialize favorites from localStorage
    favorites.init();
  });
</script>

<div class="flex flex-col min-h-screen">
  <Navbar />
  
  <main class="flex-1 pt-16">
    {@render children()}
  </main>
  
  <!-- Footer -->
  <footer class="bg-brand-dark border-t border-white/5 py-12 mt-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
        <div>
          <h2 class="text-xl font-bold mb-4 flex items-center justify-center md:justify-start gap-2">
            <span class="text-brand-orange">DRACIN</span> STREAM
          </h2>
          <p class="text-gray-400 text-sm leading-relaxed">
            Platform streaming drama China premium dengan subtitle Indonesia. Nikmati pengalaman menonton terbaik dengan kualitas video HD.
          </p>
        </div>
        
        <div>
          <h3 class="font-semibold mb-4">Navigasi</h3>
          <ul class="space-y-2 text-sm text-gray-400">
            <li><a href="/" class="hover:text-brand-orange transition-colors">Home</a></li>
            <li><a href="/category/trending" class="hover:text-brand-orange transition-colors">Trending</a></li>
            <li><a href="/category/vip" class="hover:text-brand-orange transition-colors">VIP Premium</a></li>
            <li><a href="/category/dubindo" class="hover:text-brand-orange transition-colors">Dubbing Indonesia</a></li>
          </ul>
        </div>
        
        <div>
          <h3 class="font-semibold mb-4">Dukungan</h3>
          <p class="text-xs text-gray-500 mb-4">
            Bantu kami menjaga website tetap online dan gratis untuk semua.
          </p>
          <button 
            onclick={() => isDonationOpen = true}
            class="flex items-center gap-2 px-6 py-2 bg-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white rounded-full transition-all mx-auto md:mx-0"
          >
            <Coffee class="w-4 h-4" />
            <span>Traktir Kopi</span>
          </button>
        </div>
      </div>
      
      <div class="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Dracin Stream V2. Made with <Heart class="w-3 h-3 inline text-red-500 fill-current" /> for Dracin Lovers.</p>
        <div class="flex items-center gap-4">
          <a href="#" class="hover:text-white transition-colors">Terms</a>
          <a href="#" class="hover:text-white transition-colors">Privacy</a>
          <a href="#" class="flex items-center gap-1 hover:text-white transition-colors">
            <Globe class="w-3 h-3" /> API Status
          </a>
        </div>
      </div>
    </div>
  </footer>
  
  <!-- Floating Donation Button (Mobile) -->
  <button 
    onclick={() => isDonationOpen = true}
    class="fixed bottom-6 right-6 p-4 bg-brand-orange rounded-full shadow-lg shadow-brand-orange/30 z-40 md:hidden hover:scale-110 active:scale-95 transition-transform"
    aria-label="Donate"
  >
    <Coffee class="w-6 h-6 text-white" />
  </button>
  
  <DonationModal isOpen={isDonationOpen} onClose={() => isDonationOpen = false} />
</div>

<style>
  :global(.scrollbar-hide::-webkit-scrollbar) {
    display: none;
  }
  :global(.scrollbar-hide) {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
