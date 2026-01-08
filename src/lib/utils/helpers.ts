/**
 * Fix protocol-less URLs by adding https://
 */
export function fixUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('//')) {
        return `https:${url}`;
    }
    if (!url.startsWith('http')) {
        return `https://${url}`;
    }
    return url;
}

/**
 * Format view count with K/M suffix
 */
export function formatViewCount(count: number | undefined): string {
    if (!count) return '0';
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Parse rating from various formats
 */
export function parseRating(rating: number | string | undefined): number {
    if (!rating) return 0;
    const num = typeof rating === 'string' ? parseFloat(rating) : rating;
    // If rating is on 100 scale, convert to 10 scale
    if (num > 10) {
        return Math.round(num / 10) / 10;
    }
    return Math.round(num * 10) / 10;
}

/**
 * Get year from date string or number
 */
export function parseYear(year: number | string | undefined): number {
    if (!year) return new Date().getFullYear();
    if (typeof year === 'number') return year;
    const parsed = parseInt(year);
    return isNaN(parsed) ? new Date().getFullYear() : parsed;
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Generate placeholder image URL
 */
export function getPlaceholderImage(width = 300, height = 450): string {
    return `https://via.placeholder.com/${width}x${height}/1E1E1E/666666?text=No+Image`;
}
