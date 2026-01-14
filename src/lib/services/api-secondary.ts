/**
 * Secondary API Service - Uses new Vercel App API
 * Base URL: https://kdjekek-usieke-owjejxkek-iwjwjxkod.vercel.app/
 */

import type { Drama, Episode, QualityOption } from '$lib/types';
import { fixUrl, parseRating } from '$lib/utils/helpers';

// Secondary API base URL (through Vercel proxy)
const API_BASE = '/api';

/**
 * Secondary API drama response structure
 */
interface SecondaryDramaResponse {
    bookId?: string;
    bookid?: string;
    id?: string;
    bookName?: string;
    bookname?: string;
    name?: string;
    cover?: string;
    coverWap?: string;
    introduction?: string;
    description?: string;
    chapterCount?: number;
    latestChapter?: number;
    rating?: number;
    score?: number;
    finished?: boolean;
    status?: string;
    cornerName?: string;
    viewCount?: number | string;
    playCount?: string | number;
    tags?: string[]; // New API seems to return string[] for tags
    tagNameList?: string[];
    // For consolidated endpoint
    videoPath?: string;
    chapters?: any[]; // Only if the API returns chapters list in detail
}

interface SecondaryApiResponse<T> {
    data?: T;
    success?: boolean;
    statusCode?: number;
    error?: string;
    // Some endpoints might return T directly or array directly
    // We'll handle this in the fetcher
}

/**
 * Normalize drama data from secondary API response
 */
function normalizeDrama(data: SecondaryDramaResponse): Drama {
    // Extract genres
    let genres: string[] = [];
    if (data.tags && Array.isArray(data.tags)) {
        // Handle both string[] and object[] if needed, based on user input example it is string[]
        genres = data.tags.map(t => typeof t === 'string' ? t : (t as any).tagName || '').filter(Boolean);
    } else if (data.tagNameList && Array.isArray(data.tagNameList)) {
        genres = data.tagNameList;
    }

    // Parse playCount
    let viewCount: number | undefined;
    if (data.viewCount) {
        viewCount = typeof data.viewCount === 'number' ? data.viewCount : parseInt(data.viewCount);
    } else if (data.playCount) {
        if (typeof data.playCount === 'number') {
            viewCount = data.playCount;
        } else if (typeof data.playCount === 'string') {
            const match = data.playCount.match(/(\d+\.?\d*)(M|K)?/i);
            if (match) {
                let num = parseFloat(match[1]);
                if (match[2]?.toUpperCase() === 'M') num *= 1000000;
                if (match[2]?.toUpperCase() === 'K') num *= 1000;
                viewCount = Math.round(num);
            }
        }
    }

    return {
        bookId: data.bookId || data.bookid || data.id || '',
        bookName: data.bookName || data.bookname || data.name || 'Unknown',
        cover: fixUrl(data.coverWap || data.cover || ''),
        introduction: data.introduction || data.description || '',
        rating: parseRating(data.rating || data.score),
        genres,
        status: data.finished === false || data.status === 'Ongoing' ? 'Ongoing' : 'Completed',
        year: 0,
        latestEpisode: data.latestChapter || data.chapterCount || 0,
        chapterCount: data.chapterCount,
        viewCount,
        cornerLabel: data.cornerName
    };
}


/**
 * Fetch from secondary API via proxy
 */
async function fetchSecondaryApi<T>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
    const queryParams = new URLSearchParams({
        provider: 'secondary',
        ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    });

    const url = `${API_BASE}/${path}${path.includes('?') ? '&' : '?'}${queryParams.toString()}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Secondary API error: ${response.status}`);
            return null;
        }

        const result = await response.json();

        // Handle wrapper: { success: true, data: [...] }
        if (result && typeof result === 'object' && 'data' in result) {
            return result.data as T;
        }

        return result as T;
    } catch (error) {
        console.error('Secondary API fetch error:', error);
        return null;
    }
}


// ============= PUBLIC API FUNCTIONS =============

/**
 * Get home data (featured dramas)
 */
export async function getHome(page = 1, size = 20): Promise<Drama[]> {
    const data = await fetchSecondaryApi<SecondaryDramaResponse[]>('home', { page }); // size might not be standard, using page only based on user edit

    if (!data || !Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get recommended dramas
 */
export async function getRecommend(page = 1, size = 20): Promise<Drama[]> {
    const data = await fetchSecondaryApi<SecondaryDramaResponse[]>('recommend', { page });

    if (!data || !Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get VIP content
 */
export async function getVip(page = 1, size = 20): Promise<Drama[]> {
    const data = await fetchSecondaryApi<SecondaryDramaResponse[]>('vip', { page });

    // Assuming VIP returns array now based on user notes, checking both structures just in case
    if (Array.isArray(data)) {
        return data.map(normalizeDrama);
    }

    // Fallback for nested structure if it persists (unlikely if strictly following user notes)
    // @ts-ignore
    if (data && data.columnVoList) return [];

    return [];
}

/**
 * Get categories list
 */
export interface Category {
    id: number;
    name: string;
    replaceName?: string;
}

export async function getCategories(): Promise<Category[]> {
    const data = await fetchSecondaryApi<Category[]>('categories');

    if (!data || !Array.isArray(data)) return [];
    return data;
}

/**
 * Get dramas by category
 * Note: New API might not have 'category' endpoint, mapped to 'categories' in api-call.md user edit?
 * But 'categories' usually returns list of categories. 
 * If user meant filtering, we might need to check if 'search' handles it or 'category' endpoint exists.
 * User wrote: "#>> use new external URL : '.../api/categories'" strictly for Category Detail.
 * This looks suspicious (getting list of categories vs getting dramas IN a category).
 * I will default to returning empty or Home if not supported, but let's try calling 'category' as endpoint first is safer,
 * or maybe 'categories' with params.
 */
export async function getCategory(categoryId: number, page = 1, size = 20): Promise<Drama[]> {
    // User instruction was vague: mapped to 'api/categories'
    // Likely incorrect for fetching items. 
    // I will try 'categories' with ID if that's what was requested.
    const data = await fetchSecondaryApi<SecondaryDramaResponse[]>('categories', {
        categoryId,
        page
    });

    if (!data || !Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Search dramas
 * Param change: query -> keyword
 */
export async function search(query: string, page = 1, size = 20): Promise<Drama[]> {
    const data = await fetchSecondaryApi<SecondaryDramaResponse[]>('search', {
        keyword: query,
        page
    });

    if (!data || !Array.isArray(data)) return [];
    return data.map(normalizeDrama);
}

/**
 * Get drama detail
 * Consolidating to `chapters/{bookId}`
 */
export async function getDetail(bookId: string): Promise<Drama | null> {
    const data = await fetchSecondaryApi<SecondaryDramaResponse>(`chapters/${bookId}`);

    if (!data) return null;
    return normalizeDrama(data);
}

/**
 * Get episodes/chapters
 * Consolidating to `chapters/{bookId}`
 * Assuming the response contains a list of chapters or we infer from chapterCount?
 * User didn't explicitly show chapter list in the JSON snippet, but implied "chapterCount".
 * WARNING: If the API is `chapters/{bookId}`, it usually implies a list of chapters.
 * But the JSON snippet shows metadata. 
 * I will assume the response is Mixed (Metadata + Chapter List).
 */
export async function getChapters(bookId: string): Promise<Array<Omit<Episode, 'videoUrl' | 'qualityOptions'>>> {
    // The user didn't give the field name for the chapter list. 
    // Standard practice: 'chapters', 'episodeList', or it IS an array.
    // Given the snippet has "bookId", "bookName", etc., it's an object.
    // I will look for a 'chapters' array or generate placeholders if only 'chapterCount' is present.

    const data = await fetchSecondaryApi<any>(`chapters/${bookId}`);

    if (!data) return [];

    let chapters = [];
    if (Array.isArray(data)) {
        // If it returns an array directly
        chapters = data;
    } else if (Array.isArray(data.chapters)) {
        chapters = data.chapters;
    } else if (Array.isArray(data.episodes)) {
        chapters = data.episodes;
    } else if (Array.isArray(data.list)) {
        chapters = data.list;
    }

    if (chapters.length > 0) {
        return chapters.map((ep: any, idx: number) => ({
            chapterId: ep.chapterId || ep.id || ep.url || `ep-${idx + 1}`, // Assuming url might be the ID if crawling
            chapterIndex: ep.chapterIndex || idx + 1,
            chapterName: ep.chapterName || ep.name || `Episode ${idx + 1}`,
            cover: fixUrl(ep.cover || '')
        }));
    }

    // Fallback: Generate based on chapterCount if no list provided
    const count = data.chapterCount || data.totalChapter || 0;
    if (count > 0) {
        return Array.from({ length: count }, (_, i) => ({
            chapterId: `${i + 1}`, // Simple index as ID
            chapterIndex: i + 1,
            chapterName: `Episode ${i + 1}`,
            cover: fixUrl(data.cover || '')
        }));
    }

    return [];
}

/**
 * Get stream URL
 * Consolidating to `chapters/{bookId}`
 * User said: "# search until get parameter videoPath": "..."
 * This implies iterating through something? 
 * Or maybe the same endpoint returns the video for a specific chapter?
 * But getStream takes (bookId, chapterId).
 * If I call `chapters/{bookId}`, do I get ALL videos? Or does it verify entitlement?
 * 
 * IF the user means "crawl the chapters endpoint until I find the video", that implies the chapter list has the video links.
 */
export async function getStream(bookId: string, chapterId: string): Promise<QualityOption[]> {
    const data = await fetchSecondaryApi<any>(`chapters/${bookId}`);

    if (!data) return [];

    // The snippet shows "videoPath" at the top level? 
    // "search until get parameter videoPath" -> this sounds like the user wants to traverse the object?
    // OR, maybe the user implies that `chapters/{bookId}` returns the DETAIL, and we need to find the video there.
    // If "videoPath" is at the root, it's likely a movie or single file?
    // But this is a drama stream.

    // Let's assume the chapters list contains the video paths.
    // We need to find the specific chapter.

    // First, find the chapter list again.
    let chapters: any[] = [];
    if (Array.isArray(data.chapters)) chapters = data.chapters;
    else if (Array.isArray(data.episodes)) chapters = data.episodes;

    // If we generated IDs in getChapters, we need to match that logic.
    // If chapterId is "1", "2", etc.

    let targetChapter;
    if (chapters.length > 0) {
        targetChapter = chapters.find((c: any) =>
            c.chapterId == chapterId || c.id == chapterId || (c.index && c.index == chapterId)
        );
    }

    // If not found in list, or no list...
    // Check root 'videoPath' if it matches? (Unlikely for multi-episode).

    // If the user's note "search until get parameter videoPath" means "keep requesting until you find it", 
    // that might be for a different scraper logic. 
    // Here we can only map what we have.

    // Let's assume the generic case:
    const url = targetChapter?.videoPath || targetChapter?.url || data.videoPath;

    if (url) {
        return [{
            quality: 720,
            videoUrl: fixUrl(url),
            isDefault: true
        }];
    }

    return [];
}
// Secondary API base URL (through Vercel proxy)
