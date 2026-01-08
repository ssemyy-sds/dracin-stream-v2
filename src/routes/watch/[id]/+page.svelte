<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import {
        ChevronLeft,
        ChevronRight,
        List,
        Heart,
        Loader2,
        Info,
    } from "lucide-svelte";
    import VideoPlayer from "$lib/components/VideoPlayer.svelte";
    import {
        getDramaDetail,
        getAllEpisodes,
        getStreamUrl,
    } from "$lib/services/api";
    import { favorites } from "$lib/stores/favorites";
    import { fixUrl } from "$lib/utils/helpers";
    import type { Drama, Episode, QualityOption } from "$lib/types";

    let bookId = $derived($page.params.id);
    let episodeParam = $derived($page.url.searchParams.get("ep"));
    let currentEpisode = $state(1);

    let drama = $state<Drama | null>(null);
    let episodes = $state<Array<Omit<Episode, "videoUrl" | "qualityOptions">>>(
        [],
    );
    let videoSrc = $state("");
    let qualityOptions = $state<QualityOption[]>([]);
    let isLoading = $state(true);
    let isVideoLoading = $state(false);
    let showEpisodeList = $state(false);
    let error = $state<string | null>(null);

    let isFavorited = $derived(
        drama ? $favorites.some((f) => f.bookId === drama.bookId) : false,
    );

    $effect(() => {
        if (episodeParam) {
            currentEpisode = parseInt(episodeParam) || 1;
        }
    });

    onMount(async () => {
        await loadDramaData();
    });

    async function loadDramaData() {
        isLoading = true;
        error = null;

        try {
            const [dramaData, episodesData] = await Promise.all([
                getDramaDetail(bookId),
                getAllEpisodes(bookId),
            ]);

            drama = dramaData;
            episodes = episodesData;

            // Load initial episode
            if (episodeParam) {
                currentEpisode = parseInt(episodeParam) || 1;
            }
            await loadEpisode(currentEpisode);
        } catch (err) {
            console.error("Failed to load drama:", err);
            error = "Failed to load drama";
        } finally {
            isLoading = false;
        }
    }

    async function loadEpisode(epNum: number) {
        isVideoLoading = true;

        try {
            const options = await getStreamUrl(bookId, epNum);
            qualityOptions = options;

            // Get default or 720p quality
            const defaultOption =
                options.find((o) => o.isDefault) ||
                options.find((o) => o.quality === 720) ||
                options[0];
            if (defaultOption) {
                videoSrc = defaultOption.videoUrl;
            } else {
                error = "No video source available";
            }
        } catch (err) {
            console.error("Failed to load episode:", err);
            error = "Failed to load episode";
        } finally {
            isVideoLoading = false;
        }
    }

    function goToEpisode(epNum: number) {
        currentEpisode = epNum;
        goto(`/watch/${bookId}?ep=${epNum}`, { replaceState: true });
        loadEpisode(epNum);
        showEpisodeList = false;
    }

    function prevEpisode() {
        if (currentEpisode > 1) {
            goToEpisode(currentEpisode - 1);
        }
    }

    function nextEpisode() {
        if (currentEpisode < episodes.length) {
            goToEpisode(currentEpisode + 1);
        }
    }

    function handleQualityChange(quality: number) {
        const option = qualityOptions.find((o) => o.quality === quality);
        if (option) {
            videoSrc = option.videoUrl;
        }
    }

    function handleFavorite() {
        if (drama) {
            favorites.toggle(drama);
        }
    }
</script>

<svelte:head>
    <title
        >{drama
            ? `${drama.bookName} - Episode ${currentEpisode}`
            : "Loading..."} - DRACIN</title
    >
</svelte:head>

<div class="min-h-screen bg-brand-black">
    {#if isLoading}
        <div class="flex items-center justify-center min-h-[60vh]">
            <Loader2 class="w-10 h-10 text-brand-orange animate-spin" />
        </div>
    {:else if error && !drama}
        <div
            class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
        >
            <h2 class="text-2xl font-bold mb-2">Error</h2>
            <p class="text-gray-400 mb-6">{error}</p>
            <a
                href="/"
                class="px-6 py-3 bg-brand-orange rounded-full font-semibold"
            >
                Kembali ke Home
            </a>
        </div>
    {:else if drama}
        <div class="max-w-7xl mx-auto px-0 md:px-6 py-0 md:py-6">
            <div class="flex flex-col lg:flex-row gap-6">
                <!-- Main Content -->
                <div class="flex-1">
                    <!-- Video Player -->
                    <div class="relative">
                        {#if isVideoLoading}
                            <div
                                class="aspect-video bg-brand-dark flex items-center justify-center rounded-xl"
                            >
                                <Loader2
                                    class="w-10 h-10 text-brand-orange animate-spin"
                                />
                            </div>
                        {:else}
                            <VideoPlayer
                                src={videoSrc}
                                {qualityOptions}
                                onQualityChange={handleQualityChange}
                                poster={fixUrl(drama.cover)}
                            />
                        {/if}
                    </div>

                    <!-- Episode Navigation (Mobile) -->
                    <div
                        class="flex items-center justify-between p-4 bg-brand-dark lg:hidden"
                    >
                        <button
                            onclick={prevEpisode}
                            disabled={currentEpisode <= 1}
                            class="flex items-center gap-1 px-4 py-2 glass rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft class="w-4 h-4" />
                            Prev
                        </button>

                        <button
                            onclick={() => (showEpisodeList = !showEpisodeList)}
                            class="flex items-center gap-2 px-4 py-2 glass rounded-lg"
                        >
                            <List class="w-4 h-4" />
                            Ep {currentEpisode}
                        </button>

                        <button
                            onclick={nextEpisode}
                            disabled={currentEpisode >= episodes.length}
                            class="flex items-center gap-1 px-4 py-2 glass rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- Drama Info -->
                    <div class="p-4 md:p-0 md:mt-6">
                        <div class="flex items-start gap-4">
                            <img
                                src={fixUrl(drama.cover)}
                                alt={drama.bookName}
                                class="w-16 h-24 object-cover rounded-lg hidden md:block"
                            />
                            <div class="flex-1">
                                <div
                                    class="flex items-start justify-between gap-4"
                                >
                                    <div>
                                        <h1
                                            class="text-xl md:text-2xl font-bold"
                                        >
                                            {drama.bookName}
                                        </h1>
                                        <p class="text-gray-400 text-sm">
                                            Episode {currentEpisode} of {episodes.length}
                                        </p>
                                    </div>
                                    <button
                                        onclick={handleFavorite}
                                        class="shrink-0 p-3 glass rounded-full hover:bg-white/20 transition-colors {isFavorited
                                            ? 'text-red-500'
                                            : 'text-white'}"
                                        aria-label={isFavorited
                                            ? "Remove from favorites"
                                            : "Add to favorites"}
                                    >
                                        <Heart
                                            class="w-5 h-5 {isFavorited
                                                ? 'fill-current'
                                                : ''}"
                                        />
                                    </button>
                                </div>

                                <a
                                    href="/detail/{drama.bookId}"
                                    class="inline-flex items-center gap-2 mt-4 text-sm text-brand-orange hover:underline"
                                >
                                    <Info class="w-4 h-4" />
                                    Lihat Detail Drama
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Mobile Episode List -->
                    {#if showEpisodeList}
                        <div class="p-4 lg:hidden">
                            <div class="glass rounded-xl p-4">
                                <h3 class="font-semibold mb-3">
                                    Pilih Episode
                                </h3>
                                <div
                                    class="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto"
                                >
                                    {#each episodes as ep, index}
                                        <button
                                            onclick={() =>
                                                goToEpisode(
                                                    ep.chapterIndex ||
                                                        index + 1,
                                                )}
                                            class="p-3 rounded-lg text-sm font-medium transition-colors {currentEpisode ===
                                            (ep.chapterIndex || index + 1)
                                                ? 'bg-brand-orange'
                                                : 'glass hover:bg-white/20'}"
                                        >
                                            {ep.chapterIndex || index + 1}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Episode List Sidebar (Desktop) -->
                <div class="hidden lg:block w-80 shrink-0">
                    <div class="glass rounded-xl overflow-hidden sticky top-20">
                        <div class="p-4 border-b border-white/10">
                            <h3 class="font-semibold">Daftar Episode</h3>
                            <p class="text-sm text-gray-400">
                                {episodes.length} episode
                            </p>
                        </div>
                        <div class="max-h-[60vh] overflow-y-auto">
                            {#each episodes as ep, index}
                                {@const epNum = ep.chapterIndex || index + 1}
                                <button
                                    onclick={() => goToEpisode(epNum)}
                                    class="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 {currentEpisode ===
                                    epNum
                                        ? 'bg-brand-orange/20 border-l-2 border-l-brand-orange'
                                        : ''}"
                                >
                                    <span
                                        class="w-8 h-8 rounded-lg glass flex items-center justify-center text-sm font-medium {currentEpisode ===
                                        epNum
                                            ? 'bg-brand-orange'
                                            : ''}"
                                    >
                                        {epNum}
                                    </span>
                                    <span class="text-sm truncate"
                                        >{ep.chapterName ||
                                            `Episode ${epNum}`}</span
                                    >
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>
