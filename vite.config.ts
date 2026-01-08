import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [sveltekit()],
    ssr: {
        // Force bundling of lucide-svelte to avoid module resolution issues
        noExternal: ['lucide-svelte']
    },
    optimizeDeps: {
        include: ['hls.js', 'lucide-svelte']
    },
    server: {
        // Increase timeout for module loading in Docker
        warmup: {
            ssrFiles: ['./src/lib/components/*.svelte']
        }
    }
});
