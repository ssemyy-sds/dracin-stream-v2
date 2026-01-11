<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import {
    PlayCircle,
    Search,
    Heart,
    Menu,
    X,
    Home,
    TrendingUp,
    Crown,
  } from "lucide-svelte";
  import {
    favorites,
    favoritesCount,
    recentFavorites,
  } from "$lib/stores/favorites";
  import { fixUrl, truncateText } from "$lib/utils/helpers";

  let isMenuOpen = $state(false);
  let isSearchOpen = $state(false);
  let isScrolled = $state(false);
  let showWatchlist = $state(false);
  let searchQuery = $state("");

  // Handle scroll for navbar background
  $effect(() => {
    if (typeof window !== "undefined") {
      const handleScroll = () => {
        isScrolled = window.scrollY > 50;
      };
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  });

  function handleSearch(e: Event) {
    e.preventDefault();
    if (searchQuery.trim()) {
      goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      isSearchOpen = false;
      searchQuery = "";
    }
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/category/trending", label: "Trending", icon: TrendingUp },
    { href: "/category/vip", label: "VIP", icon: Crown },
  ];
</script>

<nav
  class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 {isScrolled
    ? 'bg-black/95 backdrop-blur-md shadow-lg'
    : 'bg-gradient-to-b from-black/80 to-transparent'}"
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2 group">
        <PlayCircle
          class="w-8 h-8 text-brand-orange group-hover:scale-110 transition-transform"
        />
        <span class="text-xl font-bold tracking-tight">DRACIN</span>
      </a>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center gap-6">
        {#each navLinks as link}
          <a
            href={link.href}
            class="text-sm font-medium transition-colors hover:text-brand-orange {$page
              .url.pathname === link.href
              ? 'text-brand-orange'
              : 'text-gray-300'}"
          >
            {link.label}
          </a>
        {/each}
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <!-- Search (Desktop) -->
        <div class="hidden md:block relative">
          {#if isSearchOpen}
            <form onsubmit={handleSearch} class="flex items-center">
              <input
                type="text"
                placeholder="Cari drama..."
                bind:value={searchQuery}
                class="w-48 lg:w-64 bg-brand-gray/80 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
                autofocus
              />
              <button
                type="button"
                onclick={() => {
                  isSearchOpen = false;
                  searchQuery = "";
                }}
                class="ml-2 p-2 text-gray-400 hover:text-white"
              >
                <X class="w-5 h-5" />
              </button>
            </form>
          {:else}
            <button
              onclick={() => (isSearchOpen = true)}
              class="p-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search class="w-5 h-5" />
            </button>
          {/if}
        </div>

        <!-- Watchlist -->
        <div
          class="relative"
          onmouseenter={() => (showWatchlist = true)}
          onmouseleave={() => (showWatchlist = false)}
        >
          <a
            href="/favorites"
            class="relative p-2 text-gray-300 hover:text-brand-orange transition-colors"
            aria-label="Watchlist"
          >
            <Heart
              class="w-5 h-5 {$favoritesCount > 0
                ? 'fill-brand-orange text-brand-orange'
                : ''}"
            />
            {#if $favoritesCount > 0}
              <span
                class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-brand-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black"
              >
                {$favoritesCount > 99 ? "99+" : $favoritesCount}
              </span>
            {/if}
          </a>

          <!-- Watchlist Dropdown -->
          {#if showWatchlist && $recentFavorites.length > 0}
            <div
              class="absolute right-0 top-full mt-2 w-72 glass rounded-xl overflow-hidden shadow-xl hidden md:block"
            >
              <div class="p-3 border-b border-white/10">
                <h3 class="text-sm font-semibold">Watchlist Terbaru</h3>
              </div>
              <div class="max-h-80 overflow-y-auto">
                {#each $recentFavorites as item}
                  <a
                    href="/detail/{item.bookId}"
                    class="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                  >
                    <img
                      src={fixUrl(item.cover)}
                      alt={item.bookName}
                      class="w-10 h-14 object-cover rounded"
                      loading="lazy"
                    />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">
                        {item.bookName}
                      </p>
                      <p class="text-xs text-gray-400">
                        {item.status} • {item.year}
                      </p>
                    </div>
                  </a>
                {/each}
              </div>
              <a
                href="/favorites"
                class="block p-3 text-center text-sm text-brand-orange hover:bg-white/5 border-t border-white/10"
              >
                Lihat Semua
              </a>
            </div>
          {/if}
        </div>

        <!-- Mobile Menu Toggle -->
        <button
          onclick={() => (isMenuOpen = !isMenuOpen)}
          class="md:hidden p-2 text-gray-300 hover:text-white"
          aria-label="Menu"
        >
          {#if isMenuOpen}
            <X class="w-6 h-6" />
          {:else}
            <Menu class="w-6 h-6" />
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Menu Overlay -->
  {#if isMenuOpen}
    <div
      class="md:hidden fixed inset-0 top-16 bg-black/70 backdrop-blur-md z-40"
    >
      <div class="p-6 space-y-6">
        <!-- Mobile Search -->
        <form onsubmit={handleSearch} class="relative">
          <Search
            class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari drama..."
            bind:value={searchQuery}
            class="w-full bg-brand-gray border border-white/10 rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
          />
        </form>

        <!-- Mobile Nav Links -->
        <div class="space-y-2">
          {#each navLinks as link}
            <a
              href={link.href}
              onclick={closeMenu}
              class="flex items-center gap-4 p-4 rounded-xl hover:bg-brand-gray transition-colors {$page
                .url.pathname === link.href
                ? 'bg-brand-gray text-brand-orange'
                : 'text-white'}"
            >
              <link.icon class="w-5 h-5" />
              <span class="font-medium">{link.label}</span>
            </a>
          {/each}
          <a
            href="/favorites"
            onclick={closeMenu}
            class="flex items-center gap-4 p-4 rounded-xl hover:bg-brand-gray transition-colors {$page
              .url.pathname === '/favorites'
              ? 'bg-brand-gray text-brand-orange'
              : 'text-white'}"
          >
            <Heart class="w-5 h-5" />
            <span class="font-medium">Watchlist</span>
            {#if $favoritesCount > 0}
              <span
                class="ml-auto bg-brand-orange text-white text-xs font-bold px-2 py-1 rounded-full"
              >
                {$favoritesCount}
              </span>
            {/if}
          </a>
        </div>
      </div>
    </div>
  {/if}
</nav>
