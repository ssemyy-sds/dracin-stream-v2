import { writable, derived } from 'svelte/store';
import type { Drama, FavoriteItem } from '$lib/types';
import * as favoritesService from '$lib/services/favorites';

// Create a writable store for favorites
function createFavoritesStore() {
    const { subscribe, set, update } = writable<FavoriteItem[]>([]);

    return {
        subscribe,

        // Initialize from localStorage (call on mount)
        init: () => {
            const favorites = favoritesService.getFavorites();
            set(favorites);
        },

        // Add a drama to favorites
        add: (drama: Drama) => {
            update(current => {
                if (current.some(f => f.bookId === drama.bookId)) {
                    return current;
                }
                const newFavorite: FavoriteItem = {
                    ...drama,
                    addedAt: Date.now()
                };
                const updated = [newFavorite, ...current].slice(0, 100);
                favoritesService.addFavorite(drama);
                return updated;
            });
        },

        // Remove a drama from favorites
        remove: (bookId: string) => {
            update(current => {
                const updated = current.filter(f => f.bookId !== bookId);
                favoritesService.removeFavorite(bookId);
                return updated;
            });
        },

        // Toggle favorite status
        toggle: (drama: Drama) => {
            update(current => {
                const exists = current.some(f => f.bookId === drama.bookId);
                if (exists) {
                    favoritesService.removeFavorite(drama.bookId);
                    return current.filter(f => f.bookId !== drama.bookId);
                } else {
                    const newFavorite: FavoriteItem = {
                        ...drama,
                        addedAt: Date.now()
                    };
                    favoritesService.addFavorite(drama);
                    return [newFavorite, ...current].slice(0, 100);
                }
            });
        },

        // Check if a drama is favorited
        isFavorite: (bookId: string, favorites: FavoriteItem[]): boolean => {
            return favorites.some(f => f.bookId === bookId);
        },

        // Clear all favorites
        clear: () => {
            favoritesService.clearFavorites();
            set([]);
        }
    };
}

// Export the store
export const favorites = createFavoritesStore();

// Derived store for favorites count
export const favoritesCount = derived(favorites, $favorites => $favorites.length);

// Derived store for last 10 favorites (for navbar dropdown)
export const recentFavorites = derived(favorites, $favorites => $favorites.slice(0, 10));
