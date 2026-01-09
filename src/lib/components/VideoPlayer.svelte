<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Loader2,
    Settings,
  } from "lucide-svelte";
  import type { QualityOption } from "$lib/types";

  interface Props {
    src: string;
    qualityOptions?: QualityOption[];
    onQualityChange?: (quality: number) => void;
    poster?: string;
  }

  let { src, qualityOptions = [], onQualityChange, poster }: Props = $props();

  let videoElement: HTMLVideoElement;
  let containerElement: HTMLDivElement;
  let hls: any;

  let isPlaying = $state(false);
  let isMuted = $state(false);
  let isLoading = $state(true);
  let isError = $state(false);
  let showControls = $state(true);
  let showQualityMenu = $state(false);
  let currentQuality = $state(720);
  let progress = $state(0);
  let currentTime = $state(0);
  let duration = $state(0);

  let controlsTimeout: ReturnType<typeof setTimeout>;

  onMount(async () => {
    if (!src) {
      isError = true;
      return;
    }

    // Check if it's an HLS stream (.m3u8) or direct video file (.mp4)
    const isHls = src.includes(".m3u8");

    if (isHls) {
      // Dynamic import HLS.js for HLS streams
      const Hls = (await import("hls.js")).default;

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });

        hls.loadSource(src);
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          isLoading = false;
        });

        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            isError = true;
            isLoading = false;
          }
        });
      } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        videoElement.src = src;
        isLoading = false;
      } else {
        isError = true;
        isLoading = false;
      }
    } else {
      // Direct MP4/video file - just set the src
      videoElement.src = src;
      isLoading = false;
    }
  });

  onDestroy(() => {
    if (hls) {
      hls.destroy();
    }
    clearTimeout(controlsTimeout);
  });

  function updateSource(newSrc: string) {
    if (!newSrc || !videoElement) return;

    isLoading = true;
    isError = false;

    const isHlsSource = newSrc.includes(".m3u8");

    if (isHlsSource && hls) {
      hls.loadSource(newSrc);
    } else {
      // Direct MP4 - set src directly
      videoElement.src = newSrc;
      isLoading = false;
    }
  }

  $effect(() => {
    if (src && videoElement) {
      updateSource(src);
    }
  });

  function togglePlay() {
    if (videoElement.paused) {
      videoElement.play();
    } else {
      videoElement.pause();
    }
  }

  function toggleMute() {
    videoElement.muted = !videoElement.muted;
    isMuted = videoElement.muted;
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerElement.requestFullscreen();
    }
  }

  function handleTimeUpdate() {
    currentTime = videoElement.currentTime;
    duration = videoElement.duration || 0;
    progress = duration ? (currentTime / duration) * 100 : 0;
  }

  function handleSeek(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoElement.currentTime = pos * duration;
  }

  function handleMouseMove() {
    showControls = true;
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      if (isPlaying) {
        showControls = false;
      }
    }, 3000);
  }

  function selectQuality(quality: number) {
    currentQuality = quality;
    showQualityMenu = false;
    if (onQualityChange) {
      onQualityChange(quality);
    }
  }

  function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
</script>

<div
  bind:this={containerElement}
  class="relative bg-black rounded-xl overflow-hidden group aspect-video"
  onmousemove={handleMouseMove}
  onmouseleave={() => {
    if (isPlaying) showControls = false;
  }}
>
  <video
    bind:this={videoElement}
    class="w-full h-full object-contain"
    {poster}
    playsinline
    onclick={togglePlay}
    onplay={() => {
      isPlaying = true;
      isLoading = false;
    }}
    onpause={() => (isPlaying = false)}
    ontimeupdate={handleTimeUpdate}
    onwaiting={() => (isLoading = true)}
    oncanplay={() => (isLoading = false)}
    onerror={() => (isError = true)}
  ></video>

  <!-- Loading Spinner -->
  {#if isLoading && !isError}
    <div class="absolute inset-0 flex items-center justify-center bg-black/50">
      <Loader2 class="w-12 h-12 text-brand-orange animate-spin" />
    </div>
  {/if}

  <!-- Error State -->
  {#if isError}
    <div
      class="absolute inset-0 flex flex-col items-center justify-center bg-black/80"
    >
      <p class="text-red-400 mb-4">Failed to load video</p>
      <button
        onclick={() => {
          isError = false;
          isLoading = true;
          updateSource(src);
        }}
        class="px-4 py-2 bg-brand-orange rounded-lg"
      >
        Retry
      </button>
    </div>
  {/if}

  <!-- Play Button Overlay (when paused) -->
  {#if !isPlaying && !isLoading && !isError}
    <button
      onclick={togglePlay}
      class="absolute inset-0 flex items-center justify-center"
    >
      <div
        class="w-20 h-20 rounded-full bg-brand-orange/90 flex items-center justify-center shadow-2xl"
      >
        <Play class="w-10 h-10 text-white fill-white ml-1" />
      </div>
    </button>
  {/if}

  <!-- Controls -->
  <div
    class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 {showControls ||
    !isPlaying
      ? 'opacity-100'
      : 'opacity-0'}"
  >
    <!-- Progress Bar -->
    <div
      class="relative h-1 bg-white/20 rounded-full mb-4 cursor-pointer"
      onclick={handleSeek}
    >
      <div
        class="absolute top-0 left-0 h-full bg-brand-orange rounded-full"
        style="width: {progress}%"
      ></div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- Play/Pause -->
        <button
          onclick={togglePlay}
          class="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          {#if isPlaying}
            <Pause class="w-5 h-5" />
          {:else}
            <Play class="w-5 h-5 fill-white" />
          {/if}
        </button>

        <!-- Volume -->
        <button
          onclick={toggleMute}
          class="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          {#if isMuted}
            <VolumeX class="w-5 h-5" />
          {:else}
            <Volume2 class="w-5 h-5" />
          {/if}
        </button>

        <!-- Time -->
        <span class="text-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <!-- Quality -->
        {#if qualityOptions.length > 1}
          <div class="relative">
            <button
              onclick={() => (showQualityMenu = !showQualityMenu)}
              class="flex items-center gap-1 px-2 py-1 text-sm hover:bg-white/20 rounded transition-colors"
            >
              <Settings class="w-4 h-4" />
              {currentQuality}p
            </button>

            {#if showQualityMenu}
              <div
                class="absolute bottom-full right-0 mb-2 bg-brand-dark rounded-lg overflow-hidden shadow-xl"
              >
                {#each qualityOptions as option}
                  <button
                    onclick={() => selectQuality(option.quality)}
                    class="block w-full px-4 py-2 text-sm text-left hover:bg-white/10 {currentQuality ===
                    option.quality
                      ? 'text-brand-orange'
                      : ''}"
                  >
                    {option.quality}p
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <!-- Fullscreen -->
        <button
          onclick={toggleFullscreen}
          class="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <Maximize class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</div>
