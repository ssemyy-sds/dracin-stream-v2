import type { Drama, FavoriteItem } from '$lib/types';

const STORAGE_KEY = 'dracin_favorites';
const MAX_FAVORITES = 100;

/**
 * Get all favorites from localStorage
 */
export function getFavorites(): FavoriteItem[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const favorites = JSON.parse(stored) as FavoriteItem[];
        // Sort by addedAt descending (newest first)
        return favorites.sort((a, b) => b.addedAt - a.addedAt);
    } catch {
        return [];
    }
}

/**
 * Check if a drama is in favorites
 */
export function isFavorite(bookId: string): boolean {
    const favorites = getFavorites();
    return favorites.some(f => f.bookId === bookId);
}

/**
 * Add a drama to favorites
 */
export function addFavorite(drama: Drama): FavoriteItem[] {
    if (typeof window === 'undefined') return [];

    const favorites = getFavorites();

    // Don't add duplicates
    if (favorites.some(f => f.bookId === drama.bookId)) {
        return favorites;
    }

    const newFavorite: FavoriteItem = {
        ...drama,
        addedAt: Date.now()
    };

    // Add to beginning and limit size
    const updated = [newFavorite, ...favorites].slice(0, MAX_FAVORITES);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save favorites:', e);
    }

    return updated;
}

/**
 * Remove a drama from favorites
 */
export function removeFavorite(bookId: string): FavoriteItem[] {
    if (typeof window === 'undefined') return [];

    const favorites = getFavorites();
    const updated = favorites.filter(f => f.bookId !== bookId);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save favorites:', e);
    }

    return updated;
}

/**
 * Toggle favorite status for a drama
 */
export function toggleFavorite(drama: Drama): { favorites: FavoriteItem[]; added: boolean } {
    if (isFavorite(drama.bookId)) {
        return { favorites: removeFavorite(drama.bookId), added: false };
    } else {
        return { favorites: addFavorite(drama), added: true };
    }
}

/**
 * Clear all favorites
 */
export function clearFavorites(): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('Failed to clear favorites:', e);
    }
}
