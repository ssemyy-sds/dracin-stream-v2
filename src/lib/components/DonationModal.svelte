<script lang="ts">
  import { X, Coffee, QrCode } from "lucide-svelte";

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  // QRIS QR code image path
  const qrisImage = "/qrcode_sds.png";

  // Fallback QR generator
  //const fallbackQr =
  //  "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://saweria.co/dracin";

  let imageError = $state(false);

  function handleImageError() {
    imageError = true;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="donation-title"
  >
    <!-- Modal -->
    <div
      class="relative w-full max-w-sm bg-gradient-to-b from-brand-gray to-brand-dark rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
    >
      <!-- Close Button -->
      <button
        onclick={onClose}
        class="absolute top-4 right-4 p-2 rounded-full glass hover:bg-white/20 transition-colors z-10"
        aria-label="Close"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Header -->
      <div class="p-6 pb-4 text-center border-b border-white/10">
        <div
          class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-orange/20 mb-4"
        >
          <Coffee class="w-7 h-7 text-brand-orange" />
        </div>
        <h2 id="donation-title" class="text-xl font-bold">Traktir Kopi ☕</h2>
        <p class="text-sm text-gray-400 mt-2">
          Dukungan untuk server & kopi developer
        </p>
      </div>

      <!-- QR Code -->
      <div class="p-6 flex flex-col items-center">
        <div
          class="relative bg-white p-4 rounded-xl shadow-inner min-w-[200px] min-h-[200px] flex items-center justify-center"
        >
          {#if imageError}
            <div class="text-center text-gray-500">
              <QrCode class="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p class="text-sm font-medium">Gagal memuat QR Code</p>
              <p class="text-xs mt-1">Silakan coba lagi nanti</p>
            </div>
          {:else}
            <img
              src={qrisImage}
              alt="QRIS Code"
              class="w-48 h-48 object-contain"
              onerror={handleImageError}
            />
          {/if}
        </div>

        <p class="mt-4 text-sm text-gray-400 text-center">
          Scan QRIS dengan aplikasi e-wallet atau mobile banking
        </p>

        <!-- QRIS Label -->
        <div class="flex items-center gap-2 mt-4 px-4 py-2 glass rounded-full">
          <QrCode class="w-4 h-4 text-brand-orange" />
          <span class="text-sm font-medium">QRIS - Semua Pembayaran</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 bg-black/30 text-center">
        <p class="text-xs text-gray-500">Terima kasih atas dukungannya! 🙏</p>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }

  .animate-scale-in {
    animation: scale-in 0.3s ease-out;
  }
</style>
